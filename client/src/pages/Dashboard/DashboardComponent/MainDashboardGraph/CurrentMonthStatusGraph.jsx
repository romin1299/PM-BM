// import React from "react";
// import { render } from "react-dom";
// import Highcharts from "highcharts";
// import HighchartsReact from "highcharts-react-official";
// // import "../css/HighCharts.css";
// const options = {
//   chart: {
//     plotBackgroundColor: null,
//     plotBorderWidth: 0,
//     plotShadow: false,
//     type: "pie",
//     // width: "100%",
//   },
//   colors: ["#789c50", "#ddb14d", "#fff"],
//   // colors: ["#D1E7DD", "#F2E7C3", "#fff"],
//   // title: { text: "Browser market shares in January, 2018" },
//   title: false,
//   tooltip: {
//     pointFormat: "{series.name}: <b>{point.y:1f}</b>",
//   },

//   // accessibility: { point: { valueSuffix: "%" } },
//   plotOptions: {
//     pie: {
//       allowPointSelect: true,
//       cursor: "pointer",
//       dataLabels: {
//         enabled: false,
//         format: "<b>{point.name}</b>",
//       },
//     },
//   },
//   series: [
//     {
//       name: "PM",
//       colorByPoint: true,
//       data: [
//         {
//           name: "Completed",
//           y: 70,
//         },
//         {
//           name: "Ongoing",
//           y: 15,
//         },
//         {
//           name: "Pending",
//           y: 10,
//         },
//       ],
//     },
//   ],
// };
// const CurrentMonthStatusGraph = () => (
//   // <div id="container">
//   // </div>
//   <HighchartsReact highcharts={Highcharts} options={options} />
// );
// export default CurrentMonthStatusGraph;

import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

export const options = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: "Monthly Plan vs Actual",
      color: "black",
      font: {
        size: 16,
      },
    },
  },
};
const CurrentMonthStatusGraph = ({ TableData }) => {
  ChartJS.register(ArcElement, Tooltip, Legend);

  // console.log("----------",TableData)

  const data = {
    labels: TableData?.map((item) => item.name),
    datasets: [
      {
        // label: "# of Votes",
        data: TableData?.map((item) => item.value),
        // backgroundColor: ["#54B435", "#FF8D29", "white"],
        // borderColor: ["black"],

        backgroundColor: ["#b2e476", "#ffff59", "#FFFFFF", "#CCE5FF"],
        borderColor: [
          "#458d01",
          "rgb(228, 224, 0)",
          "rgb(211, 223, 223)",
          "rgb(201, 203, 207)",
        ],
        //borderWidth: 2,
        // blur: "12",
      },
    ],
  };
  return <Pie options={options} data={data} />;
};

export default CurrentMonthStatusGraph;
