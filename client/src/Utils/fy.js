const fyMonths = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];

/**
 * Position of the current month within the financial year (Apr = 0 ... Mar = 11),
 * the index into any twelve-slot FY array.
 */
export const currentFyMonthIndex = (date = new Date()) =>
  (date.getMonth() + 9) % 12;

export default fyMonths;
