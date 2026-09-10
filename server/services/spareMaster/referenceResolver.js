const Machine = require("../../model/machineSchema");
const Line = require("../../model/lineSchema");
const Cell = require("../../model/cellSchema");
const SubSection = require("../../model/subSectionSchema");
const Section = require("../../model/sectionSchema");
const Plant = require("../../model/plantSchema");
const User = require("../../model/userSchema");

const { normalizeHeader: normalizeValue } = require("./columnMapping");

/**
 * Reference data for the Spare Master importer, loaded once per import.
 *
 * Every lookup a row needs — machine, the five hierarchy levels above it, and
 * the currency table — is answered from memory. A 17.6k-row file would otherwise
 * cost roughly 88k queries; this costs six, and the whole cache is ~3k small
 * documents.
 */

/**
 * The plant hierarchy is only fully linked at the cell level: `lines` documents
 * carry `cell_names` and nothing above it, while `cells` carry subSection,
 * section and plant. So the walk has to go machine -> line -> cell and read the
 * upper levels off the cell — reading a section straight off a line silently
 * yields nothing.
 */
const buildIndex = (docs, selector) => {
  const index = new Map();
  docs.forEach((doc) => {
    const key = normalizeValue(selector(doc));
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(doc);
  });
  return index;
};

const loadReferenceData = async () => {
  const [machines, lines, cells, subSections, sections, plants] = await Promise.all([
    Machine.find({}, { machine_code: 1, machine_name: 1, machine_nickname: 1, line_names: 1 }).lean(),
    Line.find({}, { line_id: 1, line_name: 1, cell_names: 1 }).lean(),
    Cell.find({}, { cell_id: 1, cell_name: 1, subSection_names: 1, section_names: 1, plant_names: 1 }).lean(),
    SubSection.find({}, { subSection_id: 1, subSection_name: 1 }).lean(),
    Section.find({}, { section_id: 1, section_name: 1, dashboardLevel: 1 }).lean(),
    Plant.find({}, { plant_id: 1, plant_name: 1, spareCurrenciesWithUnit: 1 }).lean(),
  ]);

  const byId = (docs) => new Map(docs.map((doc) => [String(doc._id), doc]));

  return {
    machines,
    machineByCode: buildIndex(machines, (m) => m.machine_code),
    machineByName: buildIndex(machines, (m) => m.machine_name),
    machineByNickname: buildIndex(machines, (m) => m.machine_nickname),
    lineById: byId(lines),
    cellById: byId(cells),
    subSectionById: byId(subSections),
    sectionById: byId(sections),
    plantById: byId(plants),
    plants,
  };
};

/**
 * Match a row to a machine.
 *
 * MachineName is the primary key by business rule, but ~4.3k rows name a machine
 * that several machines share, and ~4.1k rows name none at all. So the cascade
 * keeps the name first and lets everything else fall through it, which resolves
 * meaningfully more rows than name-only or code-only alone:
 *
 *   1. MachineName matches exactly one machine_name
 *   2. MachineName matches several, and an Equipment code picks one of them
 *   3. any Equipment code matches a machine_code outright
 *   4. MachineName matches exactly one machine_nickname
 *
 * Ambiguity that none of these settle is left unresolved on purpose — guessing
 * between candidates would attach a part to the wrong machine and, through the
 * hierarchy, to the wrong section and plant.
 */
const resolveMachine = (references, { machineName, equipmentCodes = [] }) => {
  const nameCandidates = references.machineByName.get(normalizeValue(machineName)) || [];

  if (nameCandidates.length === 1)
    return { machine: nameCandidates[0], matchedBy: "machineName" };

  if (nameCandidates.length > 1) {
    const disambiguated = nameCandidates.find((candidate) =>
      equipmentCodes.some((code) => normalizeValue(code) === normalizeValue(candidate.machine_code)),
    );
    if (disambiguated)
      return { machine: disambiguated, matchedBy: "machineName+equipmentCode" };
  }

  for (const code of equipmentCodes) {
    const byCode = references.machineByCode.get(normalizeValue(code));
    if (byCode?.length === 1) return { machine: byCode[0], matchedBy: "equipmentCode" };
  }

  const nicknameCandidates = references.machineByNickname.get(normalizeValue(machineName)) || [];
  if (nicknameCandidates.length === 1)
    return { machine: nicknameCandidates[0], matchedBy: "machineNickname" };

  return {
    machine: null,
    matchedBy: null,
    reason: nameCandidates.length > 1
      ? `Machine name "${machineName}" matches ${nameCandidates.length} machines and no equipment code identifies which`
      : machineName || equipmentCodes.length
        ? `No machine found for name "${machineName || "(blank)"}" or equipment code(s) ${equipmentCodes.join(", ") || "(none)"}`
        : "Row carries no machine name or equipment code",
  };
};

/**
 * Denormalised hierarchy blocks in the exact shape of plantToMachineHierarchyObj,
 * so an imported master is indistinguishable from one created by the request-sheet
 * flow and every existing dashboard filter reaches it unchanged.
 */
const buildHierarchy = (references, machine) => {
  const hierarchy = {
    machine: {
      _id: machine._id,
      machine_code: machine.machine_code,
      machine_name: machine.machine_name,
      machine_nickname: machine.machine_nickname,
    },
  };

  const line = references.lineById.get(String(machine.line_names));
  if (!line) return { hierarchy, isComplete: false, missingAt: "line" };
  hierarchy.line = { _id: line._id, line_id: line.line_id, line_name: line.line_name };

  const cell = references.cellById.get(String(line.cell_names));
  if (!cell) return { hierarchy, isComplete: false, missingAt: "cell" };
  hierarchy.cell = { _id: cell._id, cell_id: cell.cell_id, cell_name: cell.cell_name };

  const subSection = references.subSectionById.get(String(cell.subSection_names));
  if (subSection)
    hierarchy.subSection = {
      _id: subSection._id,
      subSection_id: subSection.subSection_id,
      subSection_name: subSection.subSection_name,
    };

  const section = references.sectionById.get(String(cell.section_names));
  if (section)
    hierarchy.section = {
      _id: section._id,
      section_id: section.section_id,
      section_name: section.section_name,
      dashboardLevel: section.dashboardLevel,
    };

  const plant = references.plantById.get(String(cell.plant_names));
  if (plant)
    hierarchy.plant = { _id: plant._id, plant_id: plant.plant_id, plant_name: plant.plant_name };

  return {
    hierarchy,
    isComplete: Boolean(section && plant),
    missingAt: section ? (plant ? null : "plant") : "section",
  };
};

/**
 * createdBy is a denormalised snapshot on the master, matching what the
 * request-sheet flow writes. Import has no user column, so the caller supplies
 * one (the authenticated Tool Room user on the API path); anything that cannot be
 * confirmed against Users stays null rather than being invented.
 */
const resolveCreatedBy = async (candidate) => {
  if (!candidate) return null;

  const query = candidate._id
    ? { _id: candidate._id }
    : candidate.tm_no
      ? { tm_no: candidate.tm_no }
      : candidate.email
        ? { email: candidate.email }
        : null;

  if (!query) return null;

  const user = await User.findOne(query, {
    tm_no: 1,
    tm_name: 1,
    email: 1,
    plant_data: 1,
  }).lean();

  if (!user) return null;

  return {
    _id: user._id,
    tm_no: user.tm_no,
    tm_name: user.tm_name,
    email: user.email,
    plant_data: user.plant_data,
  };
};

module.exports = {
  loadReferenceData,
  resolveMachine,
  buildHierarchy,
  resolveCreatedBy,
};
