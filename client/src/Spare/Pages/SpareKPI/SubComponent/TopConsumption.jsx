import React, { useState, useCallback, useMemo } from "react";
import ChartWrapper from "./ChartComponents/ChartWrapper";
import BarChart from "./ChartComponents/BarChart";
import TopLimit from "./TopLimit";
import handleDownloadCSVOrPDF from "./handleDownloadCSVOrPDF";

const TopConsumption = ({
  title = "Top Spare Usage",
  visualizationBasedOn = "spare",
  selectedYear,
  selectedMonth,
  headerKey0 = "Spare part",
}) => {
  const [limit, setLimit] = useState(10);

  const handleSetParentLimit = useCallback(
    (propLimit) => setLimit(propLimit),
    [],
  );

  const csvOrPDfFileNamePostPix = useMemo(
    () => (selectedMonth ? `${selectedMonth}_${selectedYear}` : selectedYear),
    [selectedMonth, selectedYear],
  );

  const filters = useMemo(
    () =>
      selectedMonth
        ? [selectedYear, selectedMonth, `Top ${limit}`]
        : [selectedYear, `Top ${limit}`],
    [selectedMonth, selectedYear, limit],
  );

  return (
    <ChartWrapper
      title={title}
      params={{
        requestFor: "costWise",
        consumptionFor: "top",
        visualizationBasedOn,
        limit,
        selectedYear,
        selectedMonth,
      }}
      referenceArrayForUseEffect={[limit, selectedYear, selectedMonth]}
      chartProps={{
        indexAxis: "y",
      }}
      ChartMiddlewareComponent={BarChart}
      OtherToolbar={<TopLimit handleSetParentLimit={handleSetParentLimit} />}
      moreEffectReferences={[limit]}
      handleDownloadCSVOrPDF={handleDownloadCSVOrPDF}
      csvOrPDfFileNamePostPix={csvOrPDfFileNamePostPix}
      header={[headerKey0, "Quantity", "Cost in Mil"]}
      filters={filters}
    />
  );
};

export default TopConsumption;
