import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
const MachineWIsePmMonthlyGraph = ({ statusCounter }) => {
  console.log(statusCounter);
  ChartJS.register(ArcElement, Tooltip, Legend);

  const data = {
    labels: ["Completed", "OnGoing", "Pending"],
    datasets: [
      {
        // label: "# of Votes",
        data: [
          statusCounter?.completed,
          statusCounter?.onGoing,
          statusCounter.schedulePm -
            statusCounter.completed -
            statusCounter.onGoing,
        ],
        // backgroundColor: ["#54B435", "#FF8D29", "white"],
        // borderColor: ["black"],

        backgroundColor: [
          "rgba(118, 235, 64, 0.2)",
          "rgb(253, 193, 132)",
          "rgba(255, 255, 255, 0.2)",
          "rgba(201, 203, 207, 0.2)",
        ],
        borderColor: [
          "#adec71",
          "rgb(243, 167, 92)",
          "rgb(211, 223, 223)",
          "rgb(201, 203, 207)",
        ],
        borderWidth: 2,
        // blur: "12",
      },
    ],
  };
  return (
    <Pie
      data={data}
      height={50}
      width={50}
      // options={{ maintainAspectRatio: false }}
    />
  );
};

export default MachineWIsePmMonthlyGraph;
