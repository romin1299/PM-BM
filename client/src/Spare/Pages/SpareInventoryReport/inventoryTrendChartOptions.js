/**
 * Chart-specific labels and tooltip for the Inventory Trend vs Holding Ratio
 * chart. Kept out of the shared chartDataLabels util because this chart labels
 * differently from the rest: the stacked bars are not labelled segment by
 * segment (there are many cells), only the total above each bar, with the
 * holding-ratio value displayed above the total label.
 *
 * Datasets carry a `role` set by the server:
 *   - no role      a cell's inventory-value bar (Mil INR)
 *   - "ratio"      an invisible holding-ratio source (%)
 *   - "target"     the inventory-value target line (Mil INR)
 */

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "";
};

const isBar = (dataset) => (dataset?.type ?? "bar") === "bar";

/** The visible bar datasets, with their index, for the stack-total helpers. */
const visibleBars = (chart) =>
  chart.data.datasets
    .map((dataset, index) => ({ dataset, index }))
    .filter(({ dataset, index }) => isBar(dataset) && chart.isDatasetVisible(index));

const stackTotalAt = (chart, dataIndex) =>
  visibleBars(chart).reduce(
    (sum, { dataset }) => sum + (Number(dataset.data?.[dataIndex]) || 0),
    0,
  );

/** The percentage is plotted on y1, but displayed above its month's bar stack. */
const holdingRatioAt = (chart, dataIndex) => {
  const ratioDataset = chart.data.datasets.find(
    (dataset) => dataset.role === "ratio",
  );
  return ratioDataset?.data?.[dataIndex];
};

/**
 * The top-most visible bar segment with a value at this point - the one the
 * total label is drawn above. The last such series in the stack sits at the top.
 */
const isTopBarSegment = (context) => {
  const bars = visibleBars(context.chart).filter(
    ({ dataset }) => Number(dataset.data?.[context.dataIndex]) > 0,
  );
  if (!bars.length) return false;
  return context.datasetIndex === bars[bars.length - 1].index;
};

const TOTAL_BOX_COLOUR = "#2E7D32";
const RATIO_LABEL_COLOUR = "#1F4E78";

// A segment shorter than this cannot hold its value legibly, so it is left to
// the tooltip rather than piling text on its neighbours.
const MIN_SEGMENT_HEIGHT = 15;

/** The drawn height of a bar segment, in pixels. */
const segmentHeight = (context) => {
  const element = context.chart
    .getDatasetMeta(context.datasetIndex)
    ?.data?.[context.dataIndex];
  if (!element?.getProps) return 0;
  const { y, base } = element.getProps(["y", "base"], true);
  return Math.abs(base - y);
};

const barValueAt = (context) => Number(context.dataset.data?.[context.dataIndex]);

/**
 * Four labels per point (chartjs-plugin-datalabels multi-label):
 *   - segment: each cell's own value, inside its segment when it fits;
 *   - total:   the stack total, in a green box above each bar;
 *   - ratio:   the holding-ratio percentage, above the total label;
 *   - target:  the target line's value, right above each target point.
 */
export const inventoryTrendDataLabels = {
  clamp: true,
  labels: {
    segment: {
      display: (context) =>
        isBar(context.dataset) &&
        barValueAt(context) > 0 &&
        segmentHeight(context) >= MIN_SEGMENT_HEIGHT,
      formatter: (value) => formatNumber(value),
      anchor: "center",
      align: "center",
      color: "#1b1b1b",
      font: { weight: "bold", size: 9 },
    },
    total: {
      display: (context) =>
        isTopBarSegment(context) &&
        stackTotalAt(context.chart, context.dataIndex) > 0,
      formatter: (value, context) =>
        formatNumber(stackTotalAt(context.chart, context.dataIndex)),
      anchor: "end",
      align: "top",
      offset: 4,
      backgroundColor: TOTAL_BOX_COLOUR,
      color: "#fff",
      borderRadius: 3,
      padding: { top: 3, bottom: 3, left: 5, right: 5 },
      font: { weight: "bold", size: 11 },
    },
    ratio: {
      display: (context) =>
        isTopBarSegment(context) &&
        holdingRatioAt(context.chart, context.dataIndex) != null,
      formatter: (value, context) =>
        `${formatNumber(holdingRatioAt(context.chart, context.dataIndex))}%`,
      anchor: "end",
      align: "top",
      // The total label is offset by 4px; this second label deliberately sits
      // above it instead of following the y1 dot elsewhere in the chart.
      offset: 30,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      color: RATIO_LABEL_COLOUR,
      borderRadius: 3,
      padding: 2,
      font: { weight: "bold", size: 11 },
    },
    target: {
      // The target is a real inventory value, so its own value is shown at
      // every point of the line instead of being available only on hover.
      //
      // The datalabels context has neither `parsed` (tooltip only) nor `raw`
      // for this line series, so the value is read from the dataset itself;
      // checking `parsed` kept the label switched off entirely.
      display: (context) => {
        const value = context.dataset?.data?.[context.dataIndex];
        return (
          context.dataset?.role === "target" &&
          value !== null &&
          value !== undefined
        );
      },
      formatter: (value, context) =>
        formatNumber(context.dataset?.data?.[context.dataIndex] ?? value),
      anchor: "center",
      align: "top",
      offset: 2,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      color: "#9F0000",
      borderRadius: 3,
      padding: { top: 1, bottom: 1, left: 3, right: 3 },
      font: { weight: "bold", size: 9 },
    },
  },
};

/**
 * The overall Inventory Bifurcation is also a vertical stack. It needs the
 * same segment and green stack-total labels, but has no ratio dataset, so the
 * ratio label's display predicate naturally remains false.
 */
export const inventoryBifurcationDataLabels = inventoryTrendDataLabels;

/**
 * Tooltip: the month as title; one line per cell / holding ratio / target with
 * its unit (zero-value cells left out so a many-cell stack stays short); and a
 * footer with the stack total and the machine cost behind the ratio.
 */
export const inventoryTrendTooltip = {
  callbacks: {
    label: (context) => {
      const value = context.parsed.y;
      if (value === null || value === undefined) return null;
      // Keep the tooltip short: drop a cell that contributed nothing this month.
      if (isBar(context.dataset) && value === 0) return null;

      const unit = context.dataset.unit === "%" ? "%" : " Mil INR";
      return `${context.dataset.label}: ${formatNumber(value)}${unit}`;
    },
    footer: (items) => {
      const chart = items?.[0]?.chart;
      const dataIndex = items?.[0]?.dataIndex;
      if (!chart) return "";

      const lines = [
        // Summed from the bars themselves, so it always matches what is drawn.
        `Total inventory: ${formatNumber(stackTotalAt(chart, dataIndex))} Mil INR`,
      ];

      const machineCost = chart.data?.machineCost;
      if (machineCost)
        lines.push(`Machine cost: ${formatNumber(machineCost)} Mil INR`);

      return lines.join("\n");
    },
  },
};
