import React, { memo, useMemo } from "react";
import "./SpareMTDRAndMPlanVsActualBudgetReport.scss";

import AllKPIAndReportWrapper from "../SpareKPI/AllKPIAndReportWrapper";
import EachChartComponent from "./ChartComponent/EachChartComponent";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";

/**
 * Every card on a page plots the same thing for a different cell, so the axis
 * titles are decided once per page: rupees for the budget report, quantities
 * for the rotation bifurcation. Both run month by month.
 */
const AXIS_TITLES = {
  MRDRAndMBudget: { x: "Month", y: "Budget (INR)" },
  eachCellWiseBifurcation: { x: "Month", y: "Available quantity (Nos.)" },
};

const ChartMappingComponent = memo(({ chartData, axisTitles }) => (
  <div className="dashboard-grid">
    {chartData?.data?.map(
      ({ cell = {}, monthlyStatus = [], datasets = [] }) => (
        <div className="dashboard-card">
          <EachChartComponent
            title={cell?.cell_name}
            monthlyStatus={monthlyStatus}
            chartData={{
              labels: chartData?.labels,
              datasets,
            }}
            axisTitles={axisTitles}
          />
        </div>
      ),
    )}
  </div>
));

const PropComp = memo(
  ({ yearAndMonth, url, componentFor = "MRDRAndMBudget" }) => {
    const apiProps = useMemo(() => {
      if (componentFor === "eachCellWiseBifurcation")
        return {
          axiosConfig: {
            params: { selectedYear: yearAndMonth?.selectedYear },
          },
          referenceArrayForUseEffect: [yearAndMonth?.selectedYear],
        };

      return {
        axiosConfig: {
          params: yearAndMonth,
        },
        referenceArrayForUseEffect: [
          yearAndMonth?.selectedYear,
          yearAndMonth?.selectedMonth,
        ],
      };
    }, [componentFor, yearAndMonth]);
    return (
      <WithLoadingAndError
        requestProps={{
          url,
          ...apiProps,
          initialState: {
            isLoading: true,
            isError: false,
            chartData: {
              labels: [],
              data: [],
            },
          },
        }}
        PropComponent={ChartMappingComponent}
        otherProps={{ axisTitles: AXIS_TITLES[componentFor] }}
      />
    );
  },
);

export const CommonChartMappingComponent = (props) => (
  <AllKPIAndReportWrapper
    PropComp={PropComp}
    isDefaultSelectedMonth={true}
    otherParentProps={props}
    title={props?.title}
  />
);

const SpareMTDRAndMPlanVsActualBudgetReport = () => (
  <CommonChartMappingComponent
    url="/v1/spare/kpi/mtdRAndPlanVsActual"
    componentFor="MRDRAndMBudget"
    title="MTD R & M Plan Vs Actual Budget"
  />
);

export default SpareMTDRAndMPlanVsActualBudgetReport;
