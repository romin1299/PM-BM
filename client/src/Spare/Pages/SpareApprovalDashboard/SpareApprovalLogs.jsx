import React from "react";
import WithFilters from "../../Component/Common/WithFilters";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";

const SpareApprovalLogs = () => {
  return (
    <WithFilters
      title="Approval logs"
      PropComp={({ flagForTogglingFilter, selectedValue, selectedYear }) => (
        <WithLoadingAndError
          requestProps={{
            url: `/v1/spare/spareRequestSheet/logs`,
            axiosConfig: {
              params: {
                flagForTogglingFilter,
                selectedValue,
                selectedYear,
              },
            },
            referenceArrayForUseEffect: [
              flagForTogglingFilter,
              selectedValue,
              selectedYear,
            ],
            initialState: {
              isLoading: true,
              isError: false,
              data: {
                tableData: [],
              },
            },
          }}
          PropComponent={({ tableData }) => <h1>Approval Logs</h1>}
        />
      )}
    />
  );
};

export default SpareApprovalLogs;
