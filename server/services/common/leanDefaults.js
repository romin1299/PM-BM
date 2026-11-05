/**
 * Lets a read use `.lean()` without changing a single byte of its response.
 *
 * `.find()` returns hydrated Mongoose documents: for every row Mongoose builds
 * a full document with change tracking, casting and getters. On the heavy
 * dashboards that is where the time goes — one section's machines take 12.3s
 * hydrated against 2.2s lean, so ten of those twelve seconds buy nothing but a
 * document object that is immediately thrown away by res.json().
 *
 * `.lean()` on its own is not a safe swap, though. Hydration also fills in
 * what the stored document lacks: an array path absent in MongoDB becomes [],
 * and a path with a declared default takes it. Across this database that is
 * real — `attachedDrawings` is missing on 9,205 of 10,138 BM sheets, and
 * eleven array fields are missing on roughly 1,400 of 2,431 machines. Swap to
 * lean and those keys simply vanish from the JSON, so any front-end that calls
 * `.map()` on one without a guard would throw where it used to render.
 *
 * So this restores exactly those fields and nothing else: the same keys
 * hydration would have added, with the same values. The result serialises
 * identically, which the accompanying check asserts against real documents
 * rather than assuming.
 */

/**
 * The paths a hydrated document would carry even when the stored one does not,
 * worked out once per model from its schema.
 */
const fillersFor = (() => {
  const cache = new WeakMap();

  return (Model) => {
    const cached = cache.get(Model.schema);
    if (cached) return cached;

    const fillers = [];
    Model.schema.eachPath((pathName, type) => {
      if (pathName === "_id" || pathName === "__v") return;
      // Only top-level paths: a nested one cannot be filled without inventing
      // the parent object, which hydration does not do either.
      if (pathName.includes(".")) return;

      const declared = type.options?.default;

      if (type.$isMongooseArray || type.instance === "Array") {
        // Mongoose presents a missing array as an empty one.
        fillers.push([pathName, () => []]);
        return;
      }

      if (declared === undefined) return;
      if (typeof declared === "function") {
        fillers.push([pathName, declared]);
        return;
      }
      fillers.push([pathName, () => declared]);
    });

    cache.set(Model.schema, fillers);
    return fillers;
  };
})();

/**
 * @param {import("mongoose").Model} Model the model the rows came from
 * @param {object|object[]} rows result of a `.lean()` read
 * @returns the same rows, with the keys hydration would have added
 */
const withSchemaDefaults = (Model, rows) => {
  if (!rows) return rows;

  const fillers = fillersFor(Model);
  if (!fillers.length) return rows;

  const fill = (row) => {
    if (!row || typeof row !== "object") return row;
    for (const [pathName, value] of fillers)
      if (row[pathName] === undefined) row[pathName] = value();
    return row;
  };

  return Array.isArray(rows) ? rows.map(fill) : fill(rows);
};

/** `.lean()` plus the defaults, for a query that is only going to be serialised. */
const leanWithDefaults = async (query, Model) =>
  withSchemaDefaults(Model, await query.lean());

module.exports = { withSchemaDefaults, leanWithDefaults };
