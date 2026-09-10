/**
 * Alphabetical ordering for user lists that populate dropdowns.
 *
 * Applied in the database query rather than in the component that renders the
 * list. The BM approval dropdowns bind each option to its *array index*
 * (`<option value={idx}>`) and the submit handler resolves the choice back with
 * `approvalList[selectedIndex]`, so render order and lookup order have to be the
 * same array. Sorting a copy at render time would show one name and assign a
 * different person.
 *
 * Collation rather than a plain sort because team-member names are stored in
 * mixed case ("AMIT", "AMIT Santra"); a byte-order sort puts every capitalised
 * name ahead of the rest instead of interleaving them. strength 2 compares
 * case-insensitively, which is what "alphabetical" means to a person reading a
 * dropdown.
 */
const USER_NAME_SORT = { tm_name: 1 };

const USER_NAME_COLLATION = { locale: "en", strength: 2 };

/**
 * Applies the ordering to a Mongoose query.
 * Usage: await sortedByName(User.find(filter, projection))
 */
const sortedByName = (query) =>
  query.sort(USER_NAME_SORT).collation(USER_NAME_COLLATION);

module.exports = { USER_NAME_SORT, USER_NAME_COLLATION, sortedByName };
