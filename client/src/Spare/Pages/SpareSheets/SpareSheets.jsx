import React from "react";
import SpareSummery from "./SpareSummery";
import SpareTableWithFilters from "../../Component/SpareTableWithFilters";

const SpareSheets = () => {
  return (
    <SpareTableWithFilters
      title="Spare Requests"
      url="/v1/spare/spareRequestSheet/all"
      OtherCompo={SpareSummery}
      tableProps={{
        exportMenu: {
          exportFileNamePrefix: "Spare Requests",
        },
      }}
    />
  );
};

export default SpareSheets;
