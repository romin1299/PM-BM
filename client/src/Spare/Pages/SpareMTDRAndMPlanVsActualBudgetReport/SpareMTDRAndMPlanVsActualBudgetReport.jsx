import React, { memo, useCallback, useContext, useMemo, useState } from "react";
import { Button, ButtonGroup } from "@mui/material";
import "./SpareMTDRAndMPlanVsActualBudgetReport.scss";

import AllKPIAndReportWrapper from "../SpareKPI/AllKPIAndReportWrapper";
import EachChartComponent from "./ChartComponent/EachChartComponent";
import WithLoadingAndError from "../../Component/Common/WithLoadingAndError";
import RoutingContext from "../../../context/routing/RoutingContext";
import { isToolRoomUser } from "../../../Utils/userScope";
import CellTargetModal from "../SpareEachCellWiseInventoryBifurcation/CellTargetModal";

/**
 * Every card on a page plots the same thing for a different cell, so the axis
 * titles are decided once per page: millions of rupees for the budget report,
 * inventory cost for the rotation bifurcation. Both run month by month.
 */
const AXIS_TITLES = {
  MRDRAndMBudget: {
    x: "Month",
    y: "Budget (Mil INR)",
    y1: "Cumulative (Mil INR)",
  },
  eachCellWiseBifurcation: { x: "Month", y: "Inventory cost (Mil INR)" },
};

const ChartMappingComponent = memo(
  ({
    chartData,
    axisTitles,
    onEditTarget = null,
    hideChartLabels = false,
    // Value-axis headroom, so a line drawn at the top keeps its label clear of
    // the card's legend.
    primaryAxisGrace,
  }) => (
    <div className="dashboard-grid">
      {chartData?.data?.map(
        ({ cell = {}, monthlyStatus = [], datasets = [], hasTarget }) => (
          <div className="dashboard-card" key={cell?._id ?? cell?.cell_name}>
            <EachChartComponent
              title={cell?.cell_name}
              monthlyStatus={monthlyStatus}
              chartData={{
                labels: chartData?.labels,
                datasets,
              }}
              axisTitles={axisTitles}
              hideChartLabels={hideChartLabels}
              primaryAxisGrace={primaryAxisGrace}
              headerAction={
                // Only while editing, and only for a cell that can be targeted.
                onEditTarget && cell?._id ? (
                  <div className="col-auto">
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      onClick={() => onEditTarget(cell)}
                    >
                      {hasTarget ? "Edit target" : "Add target"}
                    </Button>
                  </div>
                ) : null
              }
            />
          </div>
        ),
      )}
    </div>
  ),
);

const PropComp = memo(
  ({ yearAndMonth, url, componentFor = "MRDRAndMBudget" }) => {
    const loggedUser = useContext(RoutingContext);
    const isEachCell = componentFor === "eachCellWiseBifurcation";
    // Targets are set by the tool room; everyone else just sees the lines.
    const canSetTargets = isEachCell && isToolRoomUser(loggedUser);

    const [isEditing, setIsEditing] = useState(false);
    const [targetCell, setTargetCell] = useState(null);
    // Bumped after a save so the charts reload with the new line.
    const [reloadCount, setReloadCount] = useState(0);

    const handleTargetSaved = useCallback(
      () => setReloadCount((count) => count + 1),
      [],
    );
    const handleCloseTarget = useCallback(() => setTargetCell(null), []);

    const apiProps = useMemo(() => {
      if (isEachCell)
        return {
          axiosConfig: {
            params: { selectedYear: yearAndMonth?.selectedYear },
          },
          referenceArrayForUseEffect: [yearAndMonth?.selectedYear, reloadCount],
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
    }, [isEachCell, yearAndMonth, reloadCount]);
    return (
      <>
        {canSetTargets && (
          <div className="d-flex justify-content-end align-items-center gap-2 mt-2">
            <small className="text-muted">Target</small>
            {/* The same View / Edit toggle as Ordered Spare Part Tracking. */}
            <ButtonGroup size="small" disableElevation variant="outlined">
              {["View", "Edit"].map((mode) => (
                <Button
                  key={mode}
                  variant={
                    (mode === "Edit") === isEditing ? "contained" : "outlined"
                  }
                  onClick={() => setIsEditing(mode === "Edit")}
                >
                  {mode}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        )}
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
          otherProps={{
            axisTitles: AXIS_TITLES[componentFor],
            onEditTarget: canSetTargets && isEditing ? setTargetCell : null,
            // Labels on the bars crowd this cell-wise budget chart; values
            // stay on hover. The shared bifurcation view still draws them.
            hideChartLabels: componentFor === "MRDRAndMBudget",
            /**
             * The bifurcation's target line is drawn on the value axis. With no
             * headroom above the highest point its value label is pushed past
             * the top of the plot and lands on the legend, so pad that axis.
             *
             * 50% is not as large as it reads: Chart.js splits grace across
             * both ends of the range, and beginAtZero pins the floor at 0, so
             * about a fifth of the plot is left free above the top point —
             * enough for the label on the smallest card. The budget view keeps
             * its own headroom on the cumulative axis.
             */
            primaryAxisGrace:
              componentFor === "eachCellWiseBifurcation" ? "50%" : undefined,
          }}
        />
        {targetCell && (
          <CellTargetModal
            cell={targetCell}
            selectedYear={yearAndMonth?.selectedYear}
            onHide={handleCloseTarget}
            onSaved={handleTargetSaved}
          />
        )}
      </>
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
