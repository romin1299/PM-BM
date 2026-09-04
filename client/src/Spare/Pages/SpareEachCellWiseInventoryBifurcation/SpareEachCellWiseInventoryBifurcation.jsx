import React from "react";
import { CommonChartMappingComponent } from "../SpareMTDRAndMPlanVsActualBudgetReport/SpareMTDRAndMPlanVsActualBudgetReport";

const SpareEachCellWiseInventoryBifurcation = () => (
  <CommonChartMappingComponent
    url="/v1/spare/kpi/inventoryBifurcation/eachCellWise"
    componentFor="eachCellWiseBifurcation"
    title="Each Cell Wise Inventory Bifurcation"
  />
);

export default SpareEachCellWiseInventoryBifurcation;
