const path = require("path");
const ExcelJS = require("exceljs");

/**
 * The machines an import could not find, as a workbook beside the source file.
 *
 * Two sheets, because two people need it: "Machines" is the de-duplicated list
 * of what the file names and the catalogue lacks — the list to register — and
 * "Rows" is every affected part, for tracing a part back to its row.
 */

const defaultReportPath = (sourceFile) => {
  const { dir, name } = path.parse(sourceFile);
  return path.join(dir, `${name}-unresolved-machines.xlsx`);
};

const machineKey = ({ machineName, equipmentCodes }) =>
  [machineName ?? "", ...(equipmentCodes ?? [])].join("|").toUpperCase();

const collectUnresolvedMachines = () => {
  const rows = [];
  const machines = new Map();

  return {
    add({ excelRow, location, partName, machineSource, reason }) {
      const { machineName, equipmentCodes = [] } = machineSource ?? {};
      const [equipment1, equipment2, equipment3] = equipmentCodes;

      rows.push({ excelRow, location, partName, machineName, equipment1, equipment2, equipment3, reason });

      const key = machineKey(machineSource ?? {});
      const entry = machines.get(key) ?? {
        machineName: machineName ?? "",
        equipment1: equipment1 ?? "",
        equipment2: equipment2 ?? "",
        equipment3: equipment3 ?? "",
        parts: 0,
        reason,
      };
      entry.parts += 1;
      machines.set(key, entry);
    },
    get rows() {
      return rows;
    },
    get machines() {
      return [...machines.values()].sort((a, b) => b.parts - a.parts);
    },
  };
};

const addSheet = (workbook, name, columns, records) => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  records.forEach((record) => sheet.addRow(record));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
};

const writeUnresolvedMachinesReport = async (collected, filePath) => {
  const workbook = new ExcelJS.Workbook();

  addSheet(
    workbook,
    "Machines",
    [
      { header: "Machine Name", key: "machineName", width: 34 },
      { header: "Equipment 1", key: "equipment1", width: 18 },
      { header: "Equipment 2", key: "equipment2", width: 18 },
      { header: "Equipment 3", key: "equipment3", width: 18 },
      { header: "Parts Affected", key: "parts", width: 14 },
      { header: "Reason", key: "reason", width: 90 },
    ],
    collected.machines,
  );

  addSheet(
    workbook,
    "Rows",
    [
      { header: "Excel Row", key: "excelRow", width: 10 },
      { header: "Location (PartsNumber)", key: "location", width: 22 },
      { header: "Part Name", key: "partName", width: 38 },
      { header: "Machine Name", key: "machineName", width: 34 },
      { header: "Equipment 1", key: "equipment1", width: 18 },
      { header: "Equipment 2", key: "equipment2", width: 18 },
      { header: "Equipment 3", key: "equipment3", width: 18 },
      { header: "Reason", key: "reason", width: 90 },
    ],
    collected.rows,
  );

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

module.exports = {
  defaultReportPath,
  collectUnresolvedMachines,
  writeUnresolvedMachinesReport,
};
