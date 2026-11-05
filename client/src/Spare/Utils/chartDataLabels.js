/**
 * Value labels drawn on the charts themselves, so a figure can be read without
 * hovering for the tooltip. One definition for every Spare chart, so a value
 * looks the same wherever it appears:
 *
 *   - the value, then any second figure the chart carries in brackets -
 *     "120 (3.4)" for a quantity with its cost, "45.39% (1482)" for a share
 *     with its count;
 *   - inside a bar, above a line point, inside a pie slice;
 *   - when a bar or slice is too small to hold the text, over it instead, so a
 *     small value is never dropped or crushed into the shape.
 *
 * A second figure travels with its dataset as `secondaryValues` (one entry per
 * point) or, on the cell-wise bifurcation, as `costInINR`.
 *
 * Only a value that is not there (zero, or no data for that month) has no
 * label: there is nothing plotted to label.
 */
const NUMBER_FORMAT = { maximumFractionDigits: 2 };

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", NUMBER_FORMAT)
    : "";
};

const secondaryOf = (context) =>
  context.dataset?.secondaryValues?.[context.dataIndex] ??
  context.dataset?.costInINR?.[context.dataIndex];

/** "value" or "value (second figure)", with "%" after a share. */
const labelText = (context, { percentage = false } = {}) => {
  const value = context.dataset?.data?.[context.dataIndex];
  const main = `${formatNumber(value)}${percentage ? "%" : ""}`;
  const second = secondaryOf(context);
  const hasSecond =
    second !== undefined && second !== null && formatNumber(second) !== "";

  return hasSecond ? `${main} (${formatNumber(second)})` : main;
};

const hasValue = (context) => {
  const value = Number(context.dataset?.data?.[context.dataIndex]);
  return Number.isFinite(value) && value !== 0;
};

const isLine = (context) => context.dataset?.type === "line";

// Rough room a label needs: one line of bold text at 11px, plus its padding.
const labelWidth = (text) => text.length * 6.5 + 10;

/** Length of the bar (or stacked segment) along its value axis, in pixels. */
const barLength = (context) => {
  const element = context.chart
    ?.getDatasetMeta(context.datasetIndex)
    ?.data?.[context.dataIndex];
  if (!element?.getProps) return Infinity;

  const { x, y, base } = element.getProps(["x", "y", "base"], true);
  return context.chart.options.indexAxis === "y"
    ? Math.abs(x - base)
    : Math.abs(y - base);
};

const NORMAL_FONT_SIZE = 11;
const SMALL_FONT_SIZE = 9;

// One line of text and its padding, by font size.
const LABEL_HEIGHT = { [NORMAL_FONT_SIZE]: 17, [SMALL_FONT_SIZE]: 13 };

/** Room a label of this font size needs along the bar's value axis. */
const roomNeeded = (context, fontSize) => {
  const scale = fontSize / NORMAL_FONT_SIZE;

  return context.chart.options.indexAxis === "y"
    ? labelWidth(labelText(context)) * scale
    : LABEL_HEIGHT[fontSize];
};

/** Whether the label would not fit inside its bar at the normal size. */
const isTooSmallForLabel = (context) => {
  if (isLine(context)) return false;

  return barLength(context) < roomNeeded(context, NORMAL_FONT_SIZE);
};

/**
 * Whether this bar is one of several segments of a stack. Segments sit flush
 * against each other, so a label that does not fit one has nowhere to go -
 * above it is the next segment.
 */
const isStackedSegment = (context) => {
  const { chart } = context;
  if (isLine(context)) return false;

  const valueScale = chart.options.indexAxis === "y" ? "x" : "y";
  if (!chart.options.scales?.[valueScale]?.stacked) return false;

  const stackOf = context.dataset?.stack;
  const segments = chart.data.datasets.filter(
    (dataset, index) =>
      dataset?.type !== "line" &&
      dataset?.stack === stackOf &&
      chart.isDatasetVisible(index),
  );

  return segments.length > 1;
};

/**
 * Font size for a stacked segment: normal when it fits, smaller when that makes
 * it fit, and 0 when even the small size will not - such a segment is left
 * unlabelled and read from its tooltip, rather than piling its text onto the
 * segments around it.
 */
const stackedFontSize = (context) => {
  const room = barLength(context);

  if (room >= roomNeeded(context, NORMAL_FONT_SIZE)) return NORMAL_FONT_SIZE;
  if (room >= roomNeeded(context, SMALL_FONT_SIZE)) return SMALL_FONT_SIZE;
  return 0;
};

// Over its bar: a line's label always, and a lone bar's when it is too short.
// A stacked segment never goes over - it is shrunk or left to the tooltip.
const outside = (context) =>
  isLine(context) ||
  (!isStackedSegment(context) && isTooSmallForLabel(context));

const LABEL_STYLE = {
  color: "#000",
  font: { weight: "bold", size: NORMAL_FONT_SIZE },
  // Over a bar, a line or another segment the text still has to be legible.
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  borderRadius: 3,
  padding: 2,
  clamp: true,
};

/**
 * Bar and line charts. Centred in a bar; above a line point; at the far end of
 * a lone bar too short to hold it. In a stack the text shrinks to fit its
 * segment, and a segment too thin even for that is left unlabelled.
 */
export const valueDataLabels = {
  ...LABEL_STYLE,
  display: (context) =>
    hasValue(context) &&
    (!isStackedSegment(context) || stackedFontSize(context) > 0),
  formatter: (value, context) => labelText(context),
  anchor: (context) => (outside(context) ? "end" : "center"),
  align: (context) =>
    isLine(context) ? "top" : outside(context) ? "end" : "center",
  offset: (context) => (outside(context) ? 4 : 0),
  font: (context) => ({
    weight: "bold",
    size: isStackedSegment(context)
      ? stackedFontSize(context) || SMALL_FONT_SIZE
      : NORMAL_FONT_SIZE,
  }),
  padding: (context) => (isStackedSegment(context) ? 1 : 2),
};

const SMALL_SLICE_SHARE = 0.05;

const isSmallSlice = (context) => {
  const data = context.dataset?.data ?? [];
  const total = data.reduce((sum, item) => sum + (Number(item) || 0), 0);
  return total > 0 && Number(data[context.dataIndex]) / total < SMALL_SLICE_SHARE;
};

/**
 * Pie and doughnut charts. `percentage` is for the pies whose slices are
 * shares; a doughnut of counts leaves it off. A slice too small to hold its
 * text is labelled just outside it.
 */
export const pieDataLabels = ({ percentage = false } = {}) => ({
  ...LABEL_STYLE,
  display: hasValue,
  formatter: (value, context) => labelText(context, { percentage }),
  anchor: (context) => (isSmallSlice(context) ? "end" : "center"),
  align: (context) => (isSmallSlice(context) ? "end" : "center"),
  offset: (context) => (isSmallSlice(context) ? 6 : 0),
});

/** Room a pie needs around it for the labels that sit outside small slices. */
export const PIE_LABEL_PADDING = 28;
