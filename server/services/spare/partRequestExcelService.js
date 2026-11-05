/**
 * Excel upload for the Spare Part Request (Order / Stock-in) sheet.
 *
 * A requester with many parts fills one workbook in the layout below and uploads
 * it; the parts come back as the form's own part rows, to be reviewed and edited
 * before the sheet is submitted. Nothing is saved by the upload itself - the
 * sheet is still created by the normal submit, with all of its normal checks.
 *
 * The template and the reader share one column list, so a column added or
 * renamed here changes the downloaded file and what is accepted together.
 */
const ExcelJS = require("exceljs");

const PARTS_SHEET = "Parts";
const EXAMPLE_SHEET = "Example";
const INSTRUCTIONS_SHEET = "Instructions";

/** Most parts one upload may carry; the form is not built for more. */
const MAX_PARTS = 200;
/** Rows the template pre-formats and validates. */
const TEMPLATE_ROWS = 300;

const FOR_STOCK_IN = "For stock in";

const SUPPLIER_CATEGORIES = ["Local", "Imported"];
const URGENCY = ["Normal", "Urgent"];
const PART_TYPES = ["Standard Parts", "Manufacturing Parts"];

/** What a blank cell means for the two pick-one columns the form always shows. */
const DEFAULT_URGENCY = "Normal";
const DEFAULT_PART_TYPE = "Standard Parts";

/**
 * One entry per column, in the order they appear.
 *   key       the form field the value fills
 *   required  refused when blank
 *   type      "text" | "number" | "choice"
 *   choices   for "choice": the accepted values, each with spellings it is
 *             also read from
 */
const COLUMNS = [
  {
    key: "partName",
    header: "Part Name",
    required: true,
    type: "text",
    width: 28,
    example: ["Servo Motor", "Proximity Sensor", "Toggle Clamp"],
    note: "Name of the part.",
  },
  {
    key: "partModel",
    header: "Part Model",
    required: true,
    type: "text",
    width: 22,
    example: ["SGM7J-04AFC6S", "E2E-X5ME1", "GH-201-B"],
    note: "Model / part number. Must be different for every row, and not already ordered or registered.",
  },
  {
    key: "maker",
    header: "Maker",
    type: "text",
    width: 18,
    example: ["Yaskawa", "Omron", "Destaco"],
    note: "Manufacturer.",
  },
  {
    key: "supplierName",
    header: "Supplier Name",
    type: "text",
    width: 22,
    example: ["ABC Automation", "Omron India", "Destaco India"],
    note: "Supplier you would order from.",
  },
  {
    key: "supplierCategory",
    header: "Supplier Category",
    type: "choice",
    width: 18,
    choices: {
      Local: ["local"],
      Imported: ["imported", "import"],
    },
    example: ["Local", "Imported", "Local"],
    note: "Pick from the list: Local or Imported.",
  },
  {
    key: "minQuantity",
    header: "Min Quantity",
    type: "number",
    forStockInOnly: true,
    width: 14,
    example: [2, 1, 4],
    note: "Stock-in requests only: stock level at which the part is reordered. Whole number, 0 or more.",
  },
  {
    key: "maxQuantity",
    header: "Max Quantity",
    type: "number",
    forStockInOnly: true,
    width: 14,
    example: [6, 4, 10],
    note: "Stock-in requests only: highest stock to hold. Must not be below Min Quantity.",
  },
  {
    key: "quantityRequired",
    header: "Quantity Required",
    required: true,
    type: "number",
    width: 18,
    example: [2, 4, 6],
    note: "How many to order. A number above 0.",
  },
  {
    key: "approxUnitPrice",
    header: "Approx Unit Price (INR)",
    required: true,
    type: "number",
    width: 24,
    example: [45000, 3200, 1850],
    note: "Price of one, in rupees. Used for the budget check.",
  },
  {
    key: "normalOrUrgentPart",
    header: "Normal / Urgent",
    type: "choice",
    width: 16,
    choices: {
      Normal: ["normal", "normal part"],
      Urgent: ["urgent", "urgent part"],
    },
    example: ["Normal", "Urgent", "Normal"],
    note: `Pick from the list. Left blank it is read as ${DEFAULT_URGENCY}.`,
  },
  {
    key: "standerOrManufacturingPart",
    header: "Standard / Manufacturing",
    type: "choice",
    width: 24,
    choices: {
      "Standard Parts": ["standard parts", "standard part", "standard"],
      "Manufacturing Parts": [
        "manufacturing parts",
        "manufacturing part",
        "manufacturing",
      ],
    },
    example: ["Standard Parts", "Standard Parts", "Manufacturing Parts"],
    note: `Pick from the list. Left blank it is read as ${DEFAULT_PART_TYPE}. A drawing for a Manufacturing part is attached on the form after the upload.`,
  },
];

/** How a header is compared: case, spacing, "*" and punctuation do not matter. */
const normalizeHeader = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/[^a-z0-9]/g, "");

const headerAliases = (column) => {
  const aliases = new Set([normalizeHeader(column.header)]);
  // "Approx Unit Price (INR)" is also written without the unit.
  aliases.add(normalizeHeader(column.header.replace(/\(.*\)/, "")));
  return aliases;
};

/* ------------------------------------------------------------------ template */

const REQUIRED_FILL = "FF1F4E78";
const OPTIONAL_FILL = "FF7F7F7F";

const listFormula = (values) => `"${values.join(",")}"`;

const choiceValues = (column) => Object.keys(column.choices);

const styleHeaderRow = (sheet) => {
  const row = sheet.getRow(1);
  row.height = 30;
  COLUMNS.forEach((column, index) => {
    const cell = row.getCell(index + 1);
    cell.value = column.required ? `${column.header} *` : column.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: column.required ? REQUIRED_FILL : OPTIONAL_FILL },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    sheet.getColumn(index + 1).width = column.width;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
};

/** Dropdowns and number checks on the rows the user will fill in. */
const addValidation = (sheet) => {
  COLUMNS.forEach((column, index) => {
    for (let rowNumber = 2; rowNumber <= TEMPLATE_ROWS + 1; rowNumber += 1) {
      const cell = sheet.getCell(rowNumber, index + 1);

      if (column.type === "choice")
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [listFormula(choiceValues(column))],
          showErrorMessage: true,
          errorStyle: "stop",
          errorTitle: column.header,
          error: `Choose one of: ${choiceValues(column).join(", ")}`,
        };

      if (column.type === "number")
        cell.dataValidation = {
          type: "decimal",
          operator: "greaterThanOrEqual",
          allowBlank: true,
          formulae: [0],
          showErrorMessage: true,
          errorStyle: "stop",
          errorTitle: column.header,
          error: "Enter a number, 0 or more.",
        };
    }
  });
};

const buildInstructionsSheet = (workbook) => {
  const sheet = workbook.addWorksheet(INSTRUCTIONS_SHEET);

  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 90;

  sheet.mergeCells("A1:C1");
  sheet.getCell("A1").value = "Spare Part Request - parts upload";
  sheet.getCell("A1").font = { bold: true, size: 14 };

  [
    "1. Fill one row per part on the \"Parts\" sheet (the \"Example\" sheet shows how). Do not rename or move the header row.",
    "2. Columns marked * must be filled. Everything else can be left blank.",
    "3. On the Spare Part Request form choose For use / For stock in, then Upload Excel. The parts are filled into the form for you to check and change.",
    `4. Up to ${MAX_PARTS} parts per file. If any row has a problem, nothing is filled and the file's problems are listed by row number.`,
    "5. Nothing is saved by the upload. The sheet is created when you press Submit on the form.",
  ].forEach((line, index) => {
    sheet.mergeCells(`A${index + 3}:C${index + 3}`);
    sheet.getCell(`A${index + 3}`).value = line;
    sheet.getCell(`A${index + 3}`).alignment = { wrapText: true, vertical: "top" };
  });

  const headerRow = sheet.getRow(9);
  ["Column", "Required", "What to enter"].forEach((text, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = text;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: REQUIRED_FILL } };
  });

  COLUMNS.forEach((column, index) => {
    const row = sheet.getRow(10 + index);
    row.getCell(1).value = column.header;
    row.getCell(2).value = column.required ? "Yes" : "No";
    row.getCell(3).value = column.note;
    row.getCell(3).alignment = { wrapText: true, vertical: "top" };
  });
};

/**
 * The downloadable workbook: an empty, formatted "Parts" sheet to fill in, an
 * "Example" sheet filled the way a real request would be, and the instructions.
 * The example is a separate sheet so that uploading the file as downloaded never
 * brings sample parts into a real request.
 */
const buildTemplateWorkbook = () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Spare Management";
  workbook.created = new Date();

  const parts = workbook.addWorksheet(PARTS_SHEET);
  styleHeaderRow(parts);
  addValidation(parts);

  const example = workbook.addWorksheet(EXAMPLE_SHEET);
  styleHeaderRow(example);
  example.getRow(1).getCell(COLUMNS.length + 2).value =
    "Example only - copy rows like these onto the \"Parts\" sheet.";
  example.getRow(1).getCell(COLUMNS.length + 2).font = { italic: true };
  example.getColumn(COLUMNS.length + 2).width = 60;
  [0, 1, 2].forEach((exampleIndex) => {
    COLUMNS.forEach((column, columnIndex) => {
      example.getCell(exampleIndex + 2, columnIndex + 1).value =
        column.example[exampleIndex];
    });
  });

  buildInstructionsSheet(workbook);

  return workbook;
};

/* -------------------------------------------------------------------- reading */

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

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  return Number(value.replace(/,/g, "").trim());
};

const matchChoice = (column, value) => {
  const wanted = String(value).trim().toLowerCase();
  return choiceValues(column).find(
    (choice) =>
      choice.toLowerCase() === wanted || column.choices[choice].includes(wanted),
  );
};

/** Finds the header row in the first rows of the sheet. */
const locateHeader = (sheet) => {
  for (let rowNumber = 1; rowNumber <= Math.min(10, sheet.rowCount); rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const columnIndex = {};

    for (let cellNumber = 1; cellNumber <= row.cellCount; cellNumber += 1) {
      const text = normalizeHeader(readCellValue(row.getCell(cellNumber).value));
      if (!text) continue;

      const column = COLUMNS.find((candidate) => headerAliases(candidate).has(text));
      if (column && columnIndex[column.key] === undefined)
        columnIndex[column.key] = cellNumber;
    }

    // The two columns every part needs are what make a row the header.
    if (columnIndex.partName !== undefined && columnIndex.partModel !== undefined)
      return { rowNumber, columnIndex };
  }

  return null;
};

/**
 * @param {Buffer} buffer the uploaded .xlsx
 * @param {{ newPartFor?: string }} options the request type decides whether
 *   Min / Max Quantity are read (stock-in only)
 * @returns {Promise<{ parts: object[], errors: string[] }>} the parts in form
 *   shape; `errors` is empty when the file is good, and then `parts` is what to
 *   fill the form with. Any error means the file is not used at all.
 */
const readPartsFromWorkbook = async (buffer, { newPartFor } = {}) => {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch (error) {
    return { parts: [], errors: ["The file could not be read as an Excel (.xlsx) workbook."] };
  }

  const sheet =
    workbook.getWorksheet(PARTS_SHEET) ??
    workbook.worksheets.find((candidate) => candidate.name !== INSTRUCTIONS_SHEET);

  if (!sheet) return { parts: [], errors: ['No "Parts" sheet found in the file.'] };

  const header = locateHeader(sheet);
  if (!header)
    return {
      parts: [],
      errors: ['The header row was not found. Use the template: it has "Part Name" and "Part Model" columns.'],
    };

  const isStockIn = newPartFor === FOR_STOCK_IN;
  const errors = [];
  const parts = [];
  const rowOfModel = new Map();

  for (let rowNumber = header.rowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const values = {};
    let hasAnyValue = false;

    Object.entries(header.columnIndex).forEach(([key, cellNumber]) => {
      const value = readCellValue(row.getCell(cellNumber).value);
      if (value !== null) hasAnyValue = true;
      values[key] = value;
    });

    if (!hasAnyValue) continue;

    const problems = [];
    const part = {};

    COLUMNS.forEach((column) => {
      if (column.forStockInOnly && !isStockIn) return;

      const raw = values[column.key] ?? null;

      if (raw === null) {
        if (column.required) problems.push(`${column.header} is required`);
        return;
      }

      if (column.type === "text") {
        part[column.key] = String(raw).trim();
      } else if (column.type === "number") {
        const number = toNumber(raw);
        if (!Number.isFinite(number) || number < 0)
          problems.push(`${column.header} must be a number, 0 or more`);
        else part[column.key] = number;
      } else {
        const choice = matchChoice(column, raw);
        if (!choice)
          problems.push(`${column.header} must be one of: ${choiceValues(column).join(", ")}`);
        else part[column.key] = choice;
      }
    });

    if (part.quantityRequired !== undefined && part.quantityRequired <= 0)
      problems.push("Quantity Required must be above 0");

    if (
      isStockIn &&
      part.minQuantity !== undefined &&
      part.maxQuantity !== undefined &&
      part.minQuantity > part.maxQuantity
    )
      problems.push("Min Quantity cannot be greater than Max Quantity");

    if (part.partModel) {
      const key = part.partModel.toLowerCase();
      if (rowOfModel.has(key))
        problems.push(`Part Model repeats row ${rowOfModel.get(key)}`);
      else rowOfModel.set(key, rowNumber);
    }

    if (problems.length) {
      errors.push(`Row ${rowNumber}: ${problems.join("; ")}`);
      continue;
    }

    // The two pick-one columns the form always shows start filled.
    part.normalOrUrgentPart ??= DEFAULT_URGENCY;
    part.standerOrManufacturingPart ??= DEFAULT_PART_TYPE;

    parts.push(part);
  }

  if (!parts.length && !errors.length)
    errors.push('No part rows found. Fill the "Parts" sheet, one part per row.');

  if (parts.length + errors.length > MAX_PARTS)
    return {
      parts: [],
      errors: [`A file can carry up to ${MAX_PARTS} parts; this one has more.`],
    };

  return { parts: errors.length ? [] : parts, errors };
};

module.exports = {
  COLUMNS,
  MAX_PARTS,
  buildTemplateWorkbook,
  readPartsFromWorkbook,
};
