import handleDownloadCSVOrPDF, {
  handleDownloadBudgetCSVOrPDF,
  handleDownloadDynamicDataCSVOrPDF,
  handleDownloadDynamicDataOtherFormatCSVOrPDF,
} from "../SpareKPI/SubComponent/handleDownloadCSVOrPDF";

/**
 * Every downloadable chart across the Spare KPI dashboards, described once.
 *
 * Each entry names the endpoint, the fixed parameters and the download handler
 * the dashboard itself uses for that chart, plus which filters the chart takes.
 * The Spare Reports page renders this list and its download dialog builds the
 * request from it, so the file a user gets here is the one the dashboard's own
 * download menu produces — and adding a chart to a dashboard means adding one
 * entry here, not another page.
 *
 * filters:
 *   month      the chart accepts a month as well as a financial year
 *   hierarchy  the section / sub-section / cell / line selector, listing the
 *              levels the chart's toolbar offers; `required` when the chart
 *              shows nothing until one is chosen
 *   topLimit   the "TOP n" control
 */
export const DASHBOARDS = {
  kpi: "KPI Dashboard",
  inventory: "Inventory Dashboard",
  stockLevel: "Stock Level Wise Analysis",
  toolRoom: "MTD Toolroom KPI",
  budget: "Budget Dashboard",
};

const PLANT_HIERARCHY = {
  sectionFiltration: true,
  subSectionFiltration: true,
  cellFiltration: true,
  lineFiltration: true,
};

const QUANTITY_AND_COST = ["Sections", "Quantity", "Cost in Mil"];

export const spareReportCatalogue = [
  // ----------------------------------------------------------- KPI Dashboard
  {
    key: "consumption-trend",
    dashboard: DASHBOARDS.kpi,
    title: "Consumption trend (Cost & Qty)",
    url: "/v1/spare/kpi/consumptionTrend",
    params: { requestFor: "costWise", consumptionFor: "section" },
    filters: { month: true },
    download: handleDownloadCSVOrPDF,
    header: QUANTITY_AND_COST,
  },
  {
    key: "consumption-trend-category",
    dashboard: DASHBOARDS.kpi,
    title: "Consumption trend Category (Cost & Qty)",
    url: "/v1/spare/kpi/consumptionTrend",
    params: { requestFor: "costWise", consumptionFor: "section" },
    filters: { month: true },
    download: handleDownloadCSVOrPDF,
    header: QUANTITY_AND_COST,
  },
  {
    key: "temporary-parts-status",
    dashboard: DASHBOARDS.kpi,
    title: "Temporary Parts Status (Cost & Qty)",
    url: "/v1/spare/kpi/consumptionTrend",
    params: { requestFor: "temporaryPart", consumptionFor: "section" },
    filters: { month: true },
    download: handleDownloadCSVOrPDF,
    header: QUANTITY_AND_COST,
  },
  {
    key: "new-ordering-stock-in-trend",
    dashboard: DASHBOARDS.kpi,
    title: "New Ordering/Stock In Trend",
    url: "/v1/spare/kpi/newAndStockInSparesOrderingTrend",
    params: {},
    filters: {},
    download: handleDownloadDynamicDataCSVOrPDF,
  },
  {
    key: "section-wise-budget",
    dashboard: DASHBOARDS.kpi,
    title: "Month-wise Plan vs Actual (Section-wise Budget)",
    url: "/v1/spare/budget",
    params: {},
    filters: {
      hierarchy: {
        sectionFiltration: true,
        subSectionFiltration: true,
        cellFiltration: true,
        required: true,
      },
    },
    download: handleDownloadBudgetCSVOrPDF,
  },
  {
    key: "top-spare-usage",
    dashboard: DASHBOARDS.kpi,
    title: "Top Spare Usage",
    url: "/v1/spare/kpi/consumptionTrend",
    params: {
      requestFor: "costWise",
      consumptionFor: "top",
      visualizationBasedOn: "spare",
    },
    filters: { month: true, topLimit: true },
    download: handleDownloadCSVOrPDF,
    header: ["Spare part", "Quantity", "Cost in Mil"],
  },
  {
    key: "top-machine-spare-usage",
    dashboard: DASHBOARDS.kpi,
    title: "Top M/c wise Spare Usage",
    url: "/v1/spare/kpi/consumptionTrend",
    params: {
      requestFor: "costWise",
      consumptionFor: "top",
      visualizationBasedOn: "machine",
    },
    filters: { month: true, topLimit: true },
    download: handleDownloadCSVOrPDF,
    header: ["Machine name", "Quantity", "Cost in Mil"],
  },

  // ----------------------------------------------------- Inventory Dashboard
  {
    key: "inventory-trend-vs-holding-ratio",
    dashboard: DASHBOARDS.inventory,
    title: "Inventory Trend Vs Holding ratio",
    url: "/v1/spare/kpi/inventoryTrend",
    params: {},
    filters: {},
    download: handleDownloadDynamicDataCSVOrPDF,
  },
  {
    key: "inventory-bifurcation",
    dashboard: DASHBOARDS.inventory,
    title: "Inventory Bifurcation",
    url: "/v1/spare/kpi/inventoryBifurcation/overAll",
    params: {},
    filters: { month: true },
    download: handleDownloadDynamicDataCSVOrPDF,
  },
  {
    key: "section-inventory-bifurcation",
    dashboard: DASHBOARDS.inventory,
    title: "Section Inventory Bifurcation",
    url: "/v1/spare/kpi/inventoryBifurcation/hierarchyWise",
    params: {},
    filters: {
      month: true,
      // upTo trims the selector's own lookup to sub-section level; it is a
      // parameter of the dropdown, not of the report.
      hierarchy: {
        sectionFiltration: true,
        subSectionFiltration: true,
        queryParams: { upTo: "subSection" },
      },
    },
    download: handleDownloadDynamicDataOtherFormatCSVOrPDF,
    downloadProps: { labelColumnHeader: "Cell" },
  },
  {
    key: "top-inventory",
    dashboard: DASHBOARDS.inventory,
    title: "Top inventory",
    url: "/v1/spare/kpi/topInventory",
    params: { showToast: "No" },
    filters: { month: true, hierarchy: PLANT_HIERARCHY, topLimit: true },
    download: handleDownloadCSVOrPDF,
    header: ["Lines", "Quantity", "Cost in Mil"],
  },
  {
    key: "spare-part-details",
    dashboard: DASHBOARDS.inventory,
    title: "Spare Part Details",
    url: "/v1/spare/kpi/supplierCategoryWise",
    params: { showToast: "No" },
    filters: { month: true, hierarchy: PLANT_HIERARCHY, topLimit: true },
    download: handleDownloadDynamicDataOtherFormatCSVOrPDF,
    downloadProps: { labelColumnHeader: "Line" },
  },

  // ------------------------------------------------ Stock Level Wise Analysis
  {
    key: "stock-level-wise-analysis",
    dashboard: DASHBOARDS.stockLevel,
    title: "Stock Level Wise Analysis",
    url: "/v1/spare/kpi/stockLevelWiseAnalysis",
    params: { requestFor: "barline" },
    filters: { month: true },
    download: handleDownloadDynamicDataCSVOrPDF,
  },
  {
    key: "stock-level-wise-analysis-share",
    dashboard: DASHBOARDS.stockLevel,
    title: "Stock Level Wise Analysis (Share)",
    url: "/v1/spare/kpi/stockLevelWiseAnalysis",
    params: { requestFor: "pie" },
    filters: { month: true },
    download: handleDownloadCSVOrPDF,
    header: ["", "Percentage", "Cost in Mil"],
  },

  // ------------------------------------------------------- MTD Toolroom KPI
  {
    key: "new-spares-ordering-trend",
    dashboard: DASHBOARDS.toolRoom,
    title: "New Spares Ordering Trend",
    url: "/v1/spare/kpi/newSparesOrderingTrend",
    params: {},
    filters: {},
    download: handleDownloadDynamicDataCSVOrPDF,
  },
  {
    key: "temporary-part-issue-trend",
    dashboard: DASHBOARDS.toolRoom,
    title: "Temporary Part Issue trend",
    url: "/v1/spare/kpi/temporaryPartIssueTrend",
    params: {},
    filters: {},
    download: handleDownloadDynamicDataCSVOrPDF,
  },
  {
    key: "receiving-inspection-manufacturing-parts",
    dashboard: DASHBOARDS.toolRoom,
    title: "Receiving Inspection Manufacturing Parts",
    url: "/v1/spare/kpi/receivingInspectionManufacturingParts",
    params: {},
    filters: { month: true },
    download: handleDownloadCSVOrPDF,
    header: ["", "Percentage", "Quantity"],
  },
];

/** Human-readable summary of the filters a report takes, for the table. */
export const describeFilters = ({ month, hierarchy, topLimit } = {}) => {
  const parts = ["Year"];
  if (month) parts.push("Month");
  if (hierarchy) {
    const levels = [
      hierarchy.sectionFiltration && "Section",
      hierarchy.subSectionFiltration && "Sub-section",
      hierarchy.cellFiltration && "Cell",
      hierarchy.lineFiltration && "Line",
    ].filter(Boolean);
    parts.push(`${levels.join(" / ")}${hierarchy.required ? " (required)" : ""}`);
  }
  if (topLimit) parts.push("Top N");
  return parts;
};
