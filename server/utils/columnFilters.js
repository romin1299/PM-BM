/**
 * Excel-style column filters, shared by every dashboard that offers them.
 *
 * The client sends `filters` as JSON - `{ maker: ["SKF", null] }` - one entry
 * per filtered column, listing the values the reader ticked; `null` stands for
 * the blank cells Excel shows as "(Blanks)". The match runs over the rows as
 * the table shows them (after projection), so the table, the filter dropdown
 * and the export all speak one set of column names.
 */
const createColumnFilters = (allowedColumns) => {
  const parse = (raw) => {
    if (!raw) return {};
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return {};
    }
    const filters = {};
    Object.entries(parsed ?? {}).forEach(([column, values]) => {
      if (allowedColumns.has(column) && Array.isArray(values) && values.length)
        filters[column] = values;
    });
    return filters;
  };

  /** The $match over projected rows for the given filters; null when none. */
  const match = (filters, { except } = {}) => {
    const clauses = Object.entries(filters)
      .filter(([column]) => column !== except)
      .map(([column, values]) => {
        const wantsBlank = values.includes(null) || values.includes("");
        const present = values.filter((v) => v !== null && v !== "");
        const alternatives = [];
        if (present.length) alternatives.push({ [column]: { $in: present } });
        if (wantsBlank) alternatives.push({ [column]: { $in: [null, ""] } });
        return alternatives.length === 1
          ? alternatives[0]
          : { $or: alternatives };
      });
    if (!clauses.length) return null;
    return clauses.length === 1 ? clauses[0] : { $and: clauses };
  };

  return { parse, match };
};

const escapeRegex = (text) =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { createColumnFilters, escapeRegex };
