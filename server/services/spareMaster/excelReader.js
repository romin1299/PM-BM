const ExcelJS = require("exceljs");

const { buildHeaderIndex, countRecognisedColumns } = require("./columnMapping");

/**
 * Streaming Excel reader for the Spare Master importer.
 *
 * Streams rather than loading the workbook, because these exports are whole-table
 * dumps of a legacy parts system — the file in hand is already 3.8 MB / 17.6k
 * rows and is expected to grow. WorkbookReader keeps memory flat regardless of
 * row count; readFile would hold every row plus every style at once.
 */

/**
 * exceljs hands back several shapes depending on how the cell was authored.
 * Everything downstream wants a primitive or a Date, so flatten here once
 * instead of defending against the union in every transformer.
 */
const readCellValue = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;

  if (typeof value === "object") {
    if (value.error !== undefined) return null;
    if (value.result !== undefined) return readCellValue(value.result);
    if (Array.isArray(value.richText))
      return value.richText.map((part) => part.text).join("");
    if (value.text !== undefined) return readCellValue(value.text);
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
};

const rowToCells = (row) => {
  const cells = [];
  // getCell is 1-based; index 0 stays empty so cell indexes match Excel columns.
  for (let i = 1; i <= row.cellCount; i++) cells[i] = readCellValue(row.getCell(i).value);
  return cells;
};

/**
 * The legacy export puts its header on row 2 with row 1 blank, and a future
 * export may well put it on row 1. Rather than hard-coding either, scan the
 * first rows and take the one that recognises the most known column names.
 * A blank row scores zero, so it is skipped without a special case.
 */
const MIN_RECOGNISED_HEADER_COLUMNS = 3;

/**
 * Yields { excelRow, raw } for every data row, where `raw` is keyed by canonical
 * field name. `onHeader` fires once, before the first data row, with the
 * detected header so callers can report or validate it.
 */
async function* readMappedRows(
  filePath,
  { sheetName, maxHeaderScanRows = 25, onHeader } = {},
) {
  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    worksheets: "emit",
    sharedStrings: "cache",
    styles: "ignore",
    hyperlinks: "ignore",
  });

  let sheetSeen = false;
  let headerFound = false;
  const skippedSheets = [];

  for await (const worksheet of workbookReader) {
    if (headerFound) break;

    if (sheetName && worksheet.name !== sheetName) {
      // A worksheet that is emitted but never iterated leaves its rows queued in
      // the stream, so drain it rather than simply skipping to the next one.
      // eslint-disable-next-line no-unused-vars
      for await (const _row of worksheet);
      continue;
    }

    sheetSeen = true;

    let headerIndex = null;
    let scanned = 0;
    let bestScore = 0;

    for await (const row of worksheet) {
      const cells = rowToCells(row);

      if (!headerIndex) {
        scanned++;
        const score = countRecognisedColumns(cells);
        if (score > bestScore) bestScore = score;

        if (score >= MIN_RECOGNISED_HEADER_COLUMNS) {
          headerIndex = buildHeaderIndex(cells);
          headerFound = true;
          if (onHeader)
            onHeader({
              sheetName: worksheet.name,
              headerRow: row.number,
              headerIndex,
              headers: cells,
            });
        }

        if (!headerIndex && scanned >= maxHeaderScanRows) break;
        continue;
      }

      const raw = {};
      let hasValue = false;

      Object.entries(headerIndex).forEach(([canonical, columnIndex]) => {
        const value = cells[columnIndex] ?? null;
        raw[canonical] = value;
        if (value !== null) hasValue = true;
      });

      // Trailing blank rows are an artefact of the export, not data.
      if (!hasValue) continue;

      yield { excelRow: row.number, raw };
    }

    if (!headerIndex) {
      skippedSheets.push(`"${worksheet.name}" (best match ${bestScore} known column(s))`);
      // Only an explicitly requested sheet is fatal on its own; otherwise keep
      // looking, because these workbooks can carry pivot or notes sheets first.
      if (sheetName) break;
    }
  }

  if (!sheetSeen)
    throw new Error(
      sheetName
        ? `Sheet "${sheetName}" was not found in the workbook`
        : "The workbook contains no readable worksheet",
    );

  if (!headerFound)
    throw new Error(
      `Could not find a Spare Master header row in the first ${maxHeaderScanRows} rows of any sheet. ` +
        `Checked: ${skippedSheets.join(", ")}`,
    );
}

module.exports = { readMappedRows, readCellValue };
