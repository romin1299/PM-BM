export function roundValue(value, decimal = 2) {
  if (typeof value === "number") {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
  } else if (value === null || value === undefined) {
    return 0;
  }
  return value;
}
