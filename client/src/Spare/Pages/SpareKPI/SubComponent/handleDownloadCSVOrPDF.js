import downloadFile from "../../../../util";
import Papa from "papaparse";
import fyMonths from "../../../../Utils/fy";

export const findOtherFilters = ({
  reduceState,
  flagForTogglingFilter,
  selectedValue,
}) => {
  let sectionName, subSectionName, cellName;

  switch (flagForTogglingFilter) {
    case "based-on-section":
      sectionName = reduceState?.sections?.find(
        (section) => section._id === selectedValue,
      )?.section_name;
      break;

    case "based-on-subSection":
      subSectionName = reduceState?.subSections?.find(
        (subSection) => subSection._id === selectedValue,
      )?.subSection_name;

      sectionName = reduceState?.sections?.find(
        (section) => section._id === reduceState?.selectedSection,
      )?.section_name;
      break;

    case "based-on-cell":
      cellName = reduceState?.cells?.find(
        (cell) => cell._id === selectedValue,
      )?.cell_name;

      subSectionName = reduceState?.subSections?.find(
        (subSection) => subSection._id === reduceState?.selectedSubSection,
      )?.subSection_name;

      sectionName = reduceState?.sections?.find(
        (section) => section._id === reduceState?.selectedSection,
      )?.section_name;
      break;

    default:
      break;
  }

  return [sectionName, subSectionName, cellName].filter(
    (item) => item !== undefined,
  );
};

const handleDownloadCSVOrPDF = ({
  format = "csv",
  filters = [],
  header = ["Sections", "Quantity", "Cost in Mil"],
  counters = {
    labels: [],
    data1: [],
    data2: [],
  },
  fileName = "Consumption Trend (Cost & Qty)",
  csvOrPDfFileNamePostPix = "",
}) => {
  let bodyData = [];
  let filterData = ["Filters", ...filters];

  if (format === "csv") {
    bodyData[0] = filterData;
    bodyData[1] = [];
    bodyData[2] = header;
  }

  for (let i = 0; i < counters?.labels.length; i++) {
    bodyData.push([
      counters?.labels[i],
      counters?.data1[i],
      counters?.data2[i],
    ]);
  }

  if (format === "csv") bodyData = [Papa.unparse(bodyData)];

  downloadFile(
    filterData,
    bodyData,
    format,
    header,
    `${fileName}_${csvOrPDfFileNamePostPix}`,
  );
};

export const handleDownloadBudgetCSVOrPDF = ({
  format = "csv",
  filters = [],
  budget = {
    plan: [],
    actual: [],
    BPDActual: [],
    cumulativePlan: [],
    cumulativeActual: [],
    monthlyStatus: [],
    cumulativeStatus: [],
    remarks: [],
  },
  fileName = "Month-wise Plan vs Actual",
  csvOrPDfFileNamePostPix = "",
}) => {
  let bodyData = [];
  let filterData = ["Filters", ...filters];
  const header = ["Months", ...fyMonths];

  if (format === "csv") {
    bodyData[0] = filterData;
    bodyData[1] = [];
    bodyData[2] = header;
  }

  bodyData.push(["Monthly Plan", ...budget?.plan]);
  bodyData.push(["Monthly Actual", ...budget?.actual]);
  bodyData.push(["BPD Actual", ...budget?.BPDActual]);
  bodyData.push(["Cum Plan", ...budget?.cumulativePlan]);
  bodyData.push(["Cum Actual", ...budget?.cumulativeActual]);
  bodyData.push(["Monthly status", ...budget?.monthlyStatus]);
  bodyData.push(["Cum status", ...budget?.cumulativeStatus]);

  if (budget?.remarks?.length > 0 && filters?.length >= 3)
    bodyData.push(["Remarks", ...budget?.remarks]);

  if (format === "csv") bodyData = [Papa.unparse(bodyData)];

  downloadFile(
    filterData,
    bodyData,
    format,
    header,
    `${fileName}_${csvOrPDfFileNamePostPix}`,
  );
};

export const handleDownloadDynamicDataCSVOrPDF = ({
  format = "csv",
  filters = [],
  chartData = {
    labels: [],
    datasets: [{ label: "", data: [] }],
  },
  fileName = "Inventory Trend Vs Holding ratio",
  csvOrPDfFileNamePostPix = "",
}) => {
  let bodyData = [];
  let filterData = ["Filters", ...filters];
  const header = ["", ...chartData?.labels];

  if (format === "csv") {
    bodyData[0] = filterData;
    bodyData[1] = [];
    bodyData[2] = header;
  }

  for (let i = 0; i < chartData?.datasets.length; i++) {
    const { label = "", data = [] } = chartData?.datasets[i];
    bodyData.push([label, ...data]);
  }

  if (format === "csv") bodyData = [Papa.unparse(bodyData)];

  downloadFile(
    filterData,
    bodyData,
    format,
    header,
    `${fileName}_${csvOrPDfFileNamePostPix}`,
  );
};

export const handleDownloadDynamicDataOtherFormatCSVOrPDF = ({
  format = "csv",
  filters = [],
  chartData = {
    labels: [],
    datasets: [{ label: "", data: [] }],
  },
  fileName = "Inventory Trend Vs Holding ratio",
  csvOrPDfFileNamePostPix = "",
  labelColumnHeader = "Cell",
}) => {
  let bodyData = [];
  let filterData = ["Filters", ...filters];
  let header = [labelColumnHeader];

  if (format === "csv") {
    bodyData[0] = filterData;
    bodyData[1] = [];
    bodyData[2] = header;
  }

  for (let i = 0; i < chartData?.datasets.length; i++) {
    header.push(chartData.datasets[i]?.label ?? "");
  }

  for (let i = 0; i < chartData?.labels.length; i++) {
    let eachLabelWise = [chartData.labels[i]];
    for (let j = 0; j < chartData?.datasets.length; j++) {
      eachLabelWise.push(chartData.datasets[j]?.data?.[i] ?? 0);
    }
    bodyData.push(eachLabelWise);
  }

  if (format === "csv") bodyData = [Papa.unparse(bodyData)];

  downloadFile(
    filterData,
    bodyData,
    format,
    header,
    `${fileName}_${csvOrPDfFileNamePostPix}`,
  );
};

export default handleDownloadCSVOrPDF;
