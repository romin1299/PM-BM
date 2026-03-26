import React from "react";
import SpareSummery from "./SpareSummery";
import SpareTableWithFilters from "../../Component/SpareTableWithFilters";

const SpareKPI = () => {
  return (
    <SpareTableWithFilters
      title="Spare KPI"
      url="/v1/spare/spareKPI/spareSheets"
      OtherCompo={SpareSummery}
      tableProps={{
        exportMenu: {
          exportFileNamePrefix: "Spare KPI",
        },
      }}
    />
  );
};

export default SpareKPI;
