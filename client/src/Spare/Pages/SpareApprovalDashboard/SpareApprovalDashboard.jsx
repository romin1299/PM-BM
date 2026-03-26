import React from "react";
import SpareTableWithFilters from "../../Component/SpareTableWithFilters";
import MonthlyGeneratedAndCompletedCountTable from "./MonthlyGeneratedAndCompletedCountTable";

const SpareApprovalDashboard = () => {
  return (
    <SpareTableWithFilters
      title="Approval Dashboard"
      OtherCompo={MonthlyGeneratedAndCompletedCountTable}
      url="/v1/spare/spareRequestSheet/approval"
      tableProps={{
        exportMenu: {
          exportFileNamePrefix: "Approval List of Request-Sheet",
        },
      }}
    />
  );
};

export default SpareApprovalDashboard;
