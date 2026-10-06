const RequestSheetOfCM = require("../../model/requestSheetDataOfCM");
const PlantToMachineHierarchy = require("../../model/plantToMachineHierarchySchema");
const {
  findMachineWithParentHierarchy,
} = require("../../middleware/findMachineDataForNewRequestSheetOfCM");
const {
  snapshotOf,
  resolvePlantToMachineHierarchyRef,
} = require("../plantToMachineHierarchyService");

/**
 * Brings every CM sheet's hierarchy back in step with its machine.
 *
 * A sheet records its place twice: the `*Ref` ids and a
 * `plantToMachineHierarchyRef` pointing at the snapshot the reports read. Both
 * were written from whatever the creating request happened to carry, so a sheet
 * could end up with a machine from one place and parents from another.
 *
 * `machineRef` is taken as the truth — it is the machine the sheet was raised
 * against — and the levels above it are re-derived by walking
 * line → cell → sub-section → section → plant from that machine.
 *
 * What it will not do is blank a ref it cannot re-derive. Where a machine's own
 * line has since been deleted, the walk stops there and the sheet's stored
 * cell/section/plant are the only record of where it was raised; overwriting
 * them with nothing would destroy the last good copy. So a level is only
 * written when the walk actually resolves it.
 */

const LEVELS = [
  "lineRef",
  "cellRef",
  "subSectionRef",
  "sectionRef",
  "plantRef",
];

const sameId = (a, b) => String(a ?? "") === String(b ?? "");

/** The ids above a machine, as far as its chain can be followed. */
const parentsOf = (machine) => {
  const line = machine?.line_names;
  const cell = line?.cell_names;
  const subSection = cell?.subSection_names;
  const section = subSection?.section_names;
  const plant = section?.plant_names;

  return {
    lineRef: line?._id,
    cellRef: cell?._id,
    subSectionRef: subSection?._id,
    sectionRef: section?._id,
    plantRef: plant?._id,
  };
};

/**
 * @param {object}  options
 * @param {boolean} options.commit  write the corrections; otherwise report only
 * @param {boolean} options.verbose print a summary
 * @returns a tally plus the sheets that changed and the ones that could not be
 *   fully resolved, so a dry run says exactly what a commit would do.
 */
const repairCMSheetHierarchy = async ({
  commit = false,
  verbose = true,
} = {}) => {
  const sheets = await RequestSheetOfCM.find(
    {},
    {
      requestSheetNoOfCM: 1,
      machineRef: 1,
      plantToMachineHierarchyRef: 1,
      ...LEVELS.reduce((fields, level) => ({ ...fields, [level]: 1 }), {}),
    },
  ).lean();

  const result = {
    scanned: sheets.length,
    noMachineRef: 0,
    machineMissing: 0,
    alreadyCorrect: 0,
    repaired: 0,
    refsWritten: 0,
    snapshotsRelinked: 0,
    snapshotsRefreshed: 0,
    partiallyResolved: [],
    changes: [],
    snapshotChanges: [],
  };

  // One machine is shared by many sheets; resolving it once keeps this to a
  // few hundred reads rather than one per sheet.
  const machineCache = new Map();
  const hierarchyRefCache = new Map();

  for (const sheet of sheets) {
    if (!sheet?.machineRef) {
      result.noMachineRef++;
      continue;
    }

    const machineKey = String(sheet.machineRef);

    if (!machineCache.has(machineKey))
      machineCache.set(
        machineKey,
        await findMachineWithParentHierarchy({ _id: sheet.machineRef }),
      );

    const machine = machineCache.get(machineKey);

    if (!machine) {
      result.machineMissing++;
      continue;
    }

    const parents = parentsOf(machine);

    // Only the levels the walk resolved, and only where they differ.
    const $set = {};
    const diffs = [];
    for (const level of LEVELS) {
      const next = parents[level];
      if (!next) continue;
      if (sameId(sheet[level], next)) continue;
      $set[level] = next;
      diffs.push(`${level}: ${sheet[level] ?? "none"} -> ${next}`);
    }

    const unresolved = LEVELS.filter((level) => !parents[level]);
    if (unresolved.length)
      result.partiallyResolved.push({
        requestSheetNoOfCM: sheet.requestSheetNoOfCM,
        machine: machine.machine_code,
        kept: unresolved,
      });

    /**
     * The snapshot the reports read is resolved from the same machine, which
     * also refreshes the names held in it — that is what makes the reported
     * machine agree with machineRef. Compared read-only first so a dry run can
     * say what a commit would change.
     */
    if (!hierarchyRefCache.has(machineKey)) {
      const existing = await PlantToMachineHierarchy.findOne(
        { "machine._id": machine._id },
        { machine: 1, line: 1, cell: 1, subSection: 1, section: 1, plant: 1 },
      ).lean();

      const fresh = snapshotOf(machine);
      const stale = [];
      for (const [level, values] of Object.entries(fresh))
        for (const [field, next] of Object.entries(values)) {
          if (field === "_id") continue;
          if (String(existing?.[level]?.[field] ?? "") !== String(next ?? ""))
            stale.push(
              `${level}.${field}: "${existing?.[level]?.[field] ?? ""}" -> "${next ?? ""}"`,
            );
        }

      hierarchyRefCache.set(machineKey, {
        ref: commit
          ? await resolvePlantToMachineHierarchyRef(machine)
          : existing?._id,
        stale,
        counted: false,
      });
    }

    const hierarchy = hierarchyRefCache.get(machineKey);

    // Counted once per machine, not once per sheet that shares it.
    if (hierarchy.stale.length && !hierarchy.counted) {
      hierarchy.counted = true;
      result.snapshotsRefreshed++;
      if (result.snapshotChanges.length < 50)
        result.snapshotChanges.push({
          machine: `${machine.machine_code ?? "?"} / ${machine.machine_name ?? "?"}`,
          stale: hierarchy.stale,
        });
    }

    if (hierarchy.ref && !sameId(sheet.plantToMachineHierarchyRef, hierarchy.ref)) {
      $set.plantToMachineHierarchyRef = hierarchy.ref;
      diffs.push(
        `plantToMachineHierarchyRef: ${sheet.plantToMachineHierarchyRef ?? "none"} -> ${hierarchy.ref}`,
      );
    }

    if (!Object.keys($set).length) {
      result.alreadyCorrect++;
      continue;
    }

    result.repaired++;
    result.refsWritten += Object.keys($set).length;
    if ($set.plantToMachineHierarchyRef) result.snapshotsRelinked++;
    if (result.changes.length < 50)
      result.changes.push({
        requestSheetNoOfCM: sheet.requestSheetNoOfCM,
        machine: `${machine.machine_code ?? "?"} / ${machine.machine_name ?? "?"}`,
        diffs,
      });

    if (commit) await RequestSheetOfCM.updateOne({ _id: sheet._id }, { $set });
  }

  if (verbose) {
    console.log(
      `\nCM hierarchy repair ${commit ? "(COMMITTED)" : "(DRY RUN — nothing written)"}`,
    );
    console.log(`  ${"sheets scanned".padEnd(28)} ${result.scanned}`);
    console.log(`  ${"already correct".padEnd(28)} ${result.alreadyCorrect}`);
    console.log(`  ${"repaired".padEnd(28)} ${result.repaired}`);
    console.log(`  ${"refs written".padEnd(28)} ${result.refsWritten}`);
    console.log(`  ${"snapshots relinked".padEnd(28)} ${result.snapshotsRelinked}`);
    console.log(
      `  ${"snapshot names refreshed".padEnd(28)} ${result.snapshotsRefreshed}`,
    );
    console.log(`  ${"no machineRef".padEnd(28)} ${result.noMachineRef}`);
    console.log(`  ${"machine no longer exists".padEnd(28)} ${result.machineMissing}`);
    console.log(
      `  ${"stored refs kept (chain broken)".padEnd(28)} ${result.partiallyResolved.length}`,
    );

    result.changes.forEach((change) =>
      console.log(
        `    ${String(change.requestSheetNoOfCM ?? "(no no.)").padEnd(26)} ${change.machine}\n      ${change.diffs.join("\n      ")}`,
      ),
    );

    result.snapshotChanges.forEach((change) =>
      console.log(`    snapshot ${change.machine}: ${change.stale.join("  |  ")}`),
    );

    result.partiallyResolved.slice(0, 10).forEach((item) =>
      console.log(
        `    kept on ${String(item.requestSheetNoOfCM).padEnd(24)} ${item.machine}: ${item.kept.join(", ")}`,
      ),
    );
  }

  return result;
};

module.exports = { repairCMSheetHierarchy };
