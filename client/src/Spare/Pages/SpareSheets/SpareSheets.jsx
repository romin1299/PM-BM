import React, { useMemo } from "react";
import SpareSummery from "./SpareSummery";
import SpareTableWithFilters from "../../Component/SpareTableWithFilters";

const OtherCompo = ({ flagForTogglingFilter, selectedValue, selectedYear }) => {
  const apiReferencePropsBasedOnFilters = useMemo(
    () => ({
      params: { flagForTogglingFilter, selectedValue, selectedYear },
      referenceArrayForUseEffect: [
        flagForTogglingFilter,
        selectedValue,
        selectedYear,
      ],
    }),
    [flagForTogglingFilter, selectedValue, selectedYear],
  );

  return (
    <div className="cell p-2 rounded-2">
      <SpareSummery
        apiReferencePropsBasedOnFilters={apiReferencePropsBasedOnFilters}
      />
    </div>
  );
};

const SpareSheets = () => {
  return (
    <SpareTableWithFilters
      title="Spare Requests"
      url="/v1/spare/spareRequestSheet/all"
      OtherCompo={OtherCompo}
      tableProps={{
        exportMenu: {
          exportFileNamePrefix: "Spare Requests",
        },
      }}
    />
  );
};

export default SpareSheets;
