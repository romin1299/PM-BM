/**
 * Replaces zero values with null in the array.
 *
 * @function
 * @name Array.prototype.replaceZeroWithNull
 * @returns {Array} - New array with null replacing zero values.
 *
 * @example
 * const originalArray = [1, 0, 5, 0, 3];
 * const newArray = originalArray.replaceZeroWithNull();
 * console.log(newArray); // Output: [1, null, 5, null, 3]
 */

Array.prototype.replaceZeroWithNull = function () {
  return this.map((value) => (value === 0 ? null : value));
};
