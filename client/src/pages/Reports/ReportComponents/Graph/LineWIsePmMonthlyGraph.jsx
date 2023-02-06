// import React from "react";
// import Plot from "react-plotly.js";

// const LineWIsePmMonthlyGraph = ({ statusSum }) => {
//   console.log(statusSum);
//   return (
//     <>
//       <div>
//         <Plot
//           data={[
//             // {
//             //   x: ["PM schedule"],
//             //   y: [30],
//             //   type: "scatter",
//             //   mode: "lines+markers",
//             //   marker: { color: "red" },
//             // },
//             {
//               type: "bar",
//               name: "Current Month Schedule",

//               x: ["Pm-schedule"],
//               y: [statusSum?.totalPmSchedule],
//               hoverinfo: "y+name",
//             },
//             {
//               type: "bar",
//               name: "Last Month Carry Forward",

//               x: ["Pm-schedule"],
//               y: [statusSum?.lastMonthPendingStatusSum],
//               hoverinfo: "y+name",
//             },
//             {
//               type: "bar",
//               name: "Completed",
//               hoverinfo: "y+name",
//               x: ["Completed"],
//               y: [statusSum?.completedStatusSum],
//             },
//           ]}
//           layout={{
//             title: "Monthly Status",
//             barmode: "stack",
//             yaxis: {
//               title: {
//                 text: "PM Status of (2022)",
//                 font: {
//                   // family: 'Courier New, monospace',
//                   size: 14,
//                   color: "#000",
//                 },
//               },
//             },
//           }}
//           config={{
//             responsive: true,
//           }}
//           style={{ width: "100%", height: "50%" }}
//         />
//       </div>
//     </>
//   );
// };

// export default LineWIsePmMonthlyGraph;

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

const LineWIsePmMonthlyGraph = ({ statusSum, selectedMonth }) => {
  console.log(statusSum);

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
        text: "Chart.js Bar Chart",
      },
    },
    scales: {
      x: {
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "No. of Machine",
        },
        ticks: {
          min: 0,
          stepSize: 1,
          max: 4,
        },
      },
    },
  };

  const data = {
    labels: [selectedMonth],
    datasets: [
      {
        label: "Current Month Schedule",
        data: [statusSum?.totalPmSchedule],
        backgroundColor: "#CFE1FD",
        borderColor: "rgba(54, 162, 235, 1)",
        stack: "Stack 0",
      },
      {
        label: "Last Month Pending",
        // data: [3],
        data: [statusSum?.lastMonthPendingStatusSum],
        backgroundColor: "rgb(250, 178, 178)",
        stack: "Stack 0",
      },
      {
        label: "Completed",
        data: [statusSum?.completedStatusSum],
        backgroundColor: "#bde28f",
        borderColor: "#adec71",
        stack: "Stack 1",
      },
    ],
  };

  return (
    <Bar
      options={options}
      height={50}
      width={50}
      datasetIdKey="id"
      data={data}
    />
  );
};

export default LineWIsePmMonthlyGraph;
