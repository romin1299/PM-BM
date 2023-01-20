import React from "react";
import Plot from "react-plotlyjs";

const LineWIsePmMonthlyGraph = ({ statusSum }) => {
  // console.log(statusSum);
  return (
    <>
      <div>
        <Plot
          data={[
            // {
            //   x: ["PM schedule"],
            //   y: [30],
            //   type: "scatter",
            //   mode: "lines+markers",
            //   marker: { color: "red" },
            // },
            {
              type: "bar",
              name: "Current Month Schedule",

              x: ["Pm-schedule"],
              y: [statusSum?.totalPmSchedule],
              hoverinfo: "y+name",
            },
            {
              type: "bar",
              name: "Last Month Carry Forward",

              x: ["Pm-schedule"],
              y: [statusSum?.lastMonthPendingStatusSum],
              hoverinfo: "y+name",
            },
            {
              type: "bar",
              name: "Completed",
              hoverinfo: "y+name",
              x: ["Completed"],
              y: [statusSum?.completedStatusSum],
            },
          ]}
          layout={{
            title: "Monthly Status",
            barmode: "stack",
            yaxis: {
              title: {
                text: "PM Status of (2022)",
                font: {
                  // family: 'Courier New, monospace',
                  size: 14,
                  color: "#000",
                },
              },
            },
          }}
          config={{
            responsive: true,
          }}
          style={{ width: "100%", height: "50%" }}
        />
      </div>
    </>
  );
};

export default LineWIsePmMonthlyGraph;
