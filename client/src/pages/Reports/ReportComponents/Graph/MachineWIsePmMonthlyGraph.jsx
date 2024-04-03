// import React from "react";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import { Pie } from "react-chartjs-2";
// const MachineWIsePmMonthlyGraph = ({ statusCounter }) => {
//   console.log(statusCounter);
//   ChartJS.register(ArcElement, Tooltip, Legend);

//   const data = {
//     labels: ["Completed", "OnGoing", "Pending"],
//     datasets: [
//       {
//         // label: "# of Votes",
//         data: [
//           statusCounter?.completed,
//           statusCounter?.onGoing,
//           statusCounter.schedulePm -
//             statusCounter.completed -
//             statusCounter.onGoing,
//         ],
//         // backgroundColor: ["#54B435", "#FF8D29", "white"],
//         // borderColor: ["black"],

//         backgroundColor: [
//           "rgba(118, 235, 64, 0.2)",
//           "rgb(253, 193, 132)",
//           "rgba(255, 255, 255, 0.2)",
//           "rgba(201, 203, 207, 0.2)",
//         ],
//         borderColor: [
//           "#adec71",
//           "rgb(243, 167, 92)",
//           "rgb(211, 223, 223)",
//           "rgb(201, 203, 207)",
//         ],
//         //borderWidth: 2,
//         // blur: "12",
//       },
//     ],
//   };
//   return (
//     <Pie
//       data={data}
//       height={50}
//       width={50}
//       // options={{ maintainAspectRatio: false }}
//     />
//   );
// };

// export default MachineWIsePmMonthlyGraph;

//******************************************************************************************************************************** */

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

const MachineWIsePmMonthlyGraph = ({ statusCounter, selectedMonth }) => {
  console.log(statusCounter);
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  // const options = {
  //   maintainAspectRatio: false,
  //   responsive: true,
  //   plugins: {
  //     legend: {
  //       position: "top",
  //     },
  //     title: {
  //       display: false,
  //       text: "Chart.js Bar Chart",
  //     },
  //   },
  //   // interaction: {
  //   //   mode: 'index' as const,
  //   //   intersect: false,
  //   // },
  //   scales: {
  //     x: {
  //       stacked: true,
  //       title: {
  //         display: true,
  //         text: "Months",
  //       },
  //       ticks: {
  //         autoSkip: false,
  //         maxRotation: 90,
  //         minRotation: 90,
  //       },
  //     },
  //     y: {
  //       stacked: true,
  //       title: {
  //         display: true,
  //         text: "No. of Machine",
  //       },
  //     },
  //   },
  // };

  const options = {
    plugins: {
      title: {
        display: true,
        text: "Plan vs Actual",
      },
    },
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          min: 0,
          stepSize: 1,
          max: 4,
        },
      },
    },
  };

  // const data = {
  //   labels: ["Completed", "OnGoing", "Pending"],
  //   datasets: [
  //     {
  //       // label: "# of Votes",
  //       data: [
  //         statusCounter?.completed,
  //         statusCounter?.onGoing,
  //         statusCounter.schedulePm -
  //           statusCounter.completed -
  //           statusCounter.onGoing,
  //       ],
  //       // backgroundColor: ["#54B435", "#FF8D29", "white"],
  //       // borderColor: ["black"],

  //       backgroundColor: [
  //         "rgba(118, 235, 64, 0.2)",
  //         "rgb(253, 193, 132)",
  //         "rgba(255, 255, 255, 0.2)",
  //         "rgba(201, 203, 207, 0.2)",
  //       ],
  //       borderColor: [
  //         "#adec71",
  //         "rgb(243, 167, 92)",
  //         "rgb(211, 223, 223)",
  //         "rgb(201, 203, 207)",
  //       ],
  //       //borderWidth: 2,
  //       // blur: "12",
  //     },
  //   ],
  // };

  // const data = {
  //   // labels: ["Completed", "OnGoing", "Pending"],
  //   datasets: [
  //     {
  //       label: "Completed",
  //       data: [1, 2, 3, 4],
  //       // data: [statusCounter?.completed],
  //       backgroundColor: "#CFE1FD",
  //       borderColor: "rgba(54, 162, 235, 1)",
  //       stack: "Stack 0",
  //     },
  //     {
  //       label: "OnGoing",
  //       data: [statusCounter?.onGoing],
  //       backgroundColor: "rgb(250, 178, 178)",
  //       stack: "Stack 0",
  //     },
  //     {
  //       label: "Pending",
  //       data: [
  //         statusCounter.schedulePm -
  //           statusCounter.completed -
  //           statusCounter.onGoing,
  //       ],
  //       backgroundColor: "#bde28f",
  //       borderColor: "#adec71",
  //       stack: "Stack 1",
  //     },
  //   ],
  // };

  const data = {
    labels: [selectedMonth],
    // datasets: [
    //   {
    //     label: "Dataset 1",
    //     data: [1],
    //     backgroundColor: "rgb(255, 99, 132)",
    //     stack: "Stack 0",
    //   },
    //   {
    //     label: "Dataset 2",
    //     data: [1],
    //     backgroundColor: "rgb(75, 192, 192)",
    //     stack: "Stack 0",
    //   },
    //   {
    //     label: "Dataset 3",
    //     data: [0,1],
    //     backgroundColor: "rgb(53, 162, 235)",
    //     stack: "Stack 1",
    //   },
    // ],

    datasets: [
      {
        label: "Pm-schedule",
        data: [statusCounter.schedulePm],
        backgroundColor: "#CFE1FD",
        borderColor: "rgba(54, 162, 235, 1)",
        stack: "Stack 0",
        // barThickness: "25",
        barPercentage: 0.7,
        categoryPercentage: 0.4,
      },
      {
        label: "Completed",
        data: [statusCounter?.completed],
        backgroundColor: "#bde28f",
        borderColor: "#adec71",
        stack: "Stack 1",
        // barThickness: "25",
        barPercentage: 0.7,
        categoryPercentage: 0.4,
      },
    ],
  };

  // const data = {
  //   labels,
  //   datasets: [
  //     {
  //       id: 1,
  //       label: "",
  //       data: [5, 6, 7],
  //     },
  //     {
  //       id: 2,
  //       label: "",
  //       data: [3, 2, 1],
  //     },
  //   ],

  // [
  //   {
  //     label: ["Dataset 1"],
  //     data: [1, 2],
  //     stack: 1,
  //     id: 1,
  //     backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(1, 8, 14, 0.5)"],
  //   },
  //   {
  //     label: "Pending",
  //     stack: 1,
  //     data: [3],
  //     id: 1,
  //     backgroundColor: "rgba(53, 162, 235, 0.5)",
  //   },
  // ],
  // };
  // return (
  //   <Pie
  //     data={data}
  //     height={50}
  //     width={50}
  //     // options={{ maintainAspectRatio: false }}
  //   />
  // );

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

export default MachineWIsePmMonthlyGraph;
