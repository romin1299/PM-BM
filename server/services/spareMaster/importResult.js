/**
 * Accumulates the outcome of an import run.
 *
 * Row-level detail is capped while the counters stay exact, because a badly
 * mismatched file can fail on every one of tens of thousands of rows and the
 * response still has to be something a browser and a log can hold. The caps are
 * reported alongside the counts so a truncated list is never mistaken for the
 * whole story.
 */
const DEFAULT_DETAIL_LIMIT = 500;

const createImportResult = ({ detailLimit = DEFAULT_DETAIL_LIMIT } = {}) => {
  const counters = {
    totalRows: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
    duplicateInFile: 0,
    withMachine: 0,
    withoutMachine: 0,
    validationErrors: 0,
    warnings: 0,
  };

  const details = { errors: [], warnings: [], duplicates: [] };
  const truncated = { errors: 0, warnings: 0, duplicates: 0 };
  const meta = {};

  const push = (bucket, entries) => {
    entries.forEach((entry) => {
      if (details[bucket].length < detailLimit) details[bucket].push(entry);
      else truncated[bucket]++;
    });
  };

  return {
    counters,
    setMeta: (key, value) => {
      meta[key] = value;
    },
    countRow: () => counters.totalRows++,
    countMachine: (hasMachine) =>
      hasMachine ? counters.withMachine++ : counters.withoutMachine++,
    addErrors: (entries = []) => {
      if (!entries.length) return;
      counters.validationErrors += entries.length;
      push("errors", entries);
    },
    addWarnings: (entries = []) => {
      if (!entries.length) return;
      counters.warnings += entries.length;
      push("warnings", entries);
    },
    addDuplicate: (entry) => {
      counters.duplicateInFile++;
      push("duplicates", [entry]);
    },
    markFailed: (count = 1) => {
      counters.failed += count;
    },
    applyBulkWriteResult: (bulkResult) => {
      counters.created += bulkResult?.upsertedCount ?? 0;
      counters.updated += bulkResult?.modifiedCount ?? 0;
      counters.unchanged +=
        (bulkResult?.matchedCount ?? 0) - (bulkResult?.modifiedCount ?? 0);
    },
    toJSON: () => ({
      ...meta,
      summary: {
        ...counters,
        succeeded: counters.created + counters.updated + counters.unchanged,
      },
      errors: details.errors,
      warnings: details.warnings,
      duplicates: details.duplicates,
      truncated,
    }),
  };
};

module.exports = { createImportResult, DEFAULT_DETAIL_LIMIT };
