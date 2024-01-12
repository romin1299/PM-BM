import React from "react";
import { Chart } from "react-chartjs-2";
import { Box } from "@mui/material";
import { chartColors } from "../../Utils/ChartUtils/chartEnums";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axios from "axios";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar from "../Common/ChartTitleBar";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
import Loading from "../../../components/Loading/Loading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  PointElement,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  maxBarThickness: 100,
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    // datalabels: { display: false },
    datalabels: {
      ...commonDatalabels,
      display: false,
      color: chartColors.barChartText,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false, // Hide vertical grid lines
      },
      title: {
        display: true,
        text: "Lines",
      },
      ticks: {
        // maxRotation: 90,
        // minRotation: 90,
        color: "black",
      },
    },
    y: {
      stacked: true,
      title: {
        display: true,
        text: "% Contribution",
      },

      min: 0,
      // max: 20,
      stepSize: 5,
      ticks: {
        callback: function (value, index, values) {
          return value + " %";
        },
        color: "black",
      },
    },
    y2: {
      position: "right",
      title: {
        display: true,
        text: "Breakdown Hours",
      },
      min: 0,
      // max: 50,
      stepSize: 5,
      ticks: {
        color: "black",
      },
    },
  },
};

const PlantLineContribution = ({ selectedYear, selectedMonth }) => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({});

  const fetchPlantId = async ({ url }) => {
    try {
      const res = await axios.get(url, {
        withCredentials: true,
        credentials: "include",
      });

      if (res.status === 201) {
        return res?.data?.selectedValue;
      }
    } catch (error) {
      console.log("error:", error);
    }
  };

  const fetchChartData = async () => {
    setLoading(true);

    const plantId = await fetchPlantId({
      url: `/getFiltrationValue/monthly-breakdown-filter/byDefault`,
    });

    const url = `/lineWiseBdContribution/based-on-plant/${plantId}`;
    const params = { selectedYear: selectedYear, selectedMonth: selectedMonth };

    try {
      const res = await axios.get(url, {
        params, //uncomment when database is updated with agrregated year and month values
        withCredentials: true,
        credentials: "include",
      });

      console.log("plant contri res:", res.data);
      setData(res?.data?.lineWiseBDData[0]);

      // delete this piece of code after successful server response
      // setData(undefined); //keep undefined till api is stable
    } catch (error) {
      setData(undefined);
      console.log("error:", error);
    }

    setLoading(false);
  };

  React.useEffect(() => {
    fetchChartData();
  }, [selectedYear, selectedMonth]);

  const chartData = {
    labels: data?.lineNames,
    datasets: [
      {
        type: "line",
        label: "Breakdown Hrs",
        data: data?.bdHours,
        fill: false,
        borderWidth: 2,
        borderColor: chartColors.bdHoursLine,
        backgroundColor: chartColors.bdHoursLine,
        pointStyle: "rectRot",
        pointRadius: 4,
        yAxisID: "y2",
      },
      {
        type: "bar",
        stack: "bar-stacked",
        label: "% Contribution",
        data: data?.percentages,
        backgroundColor: chartColors.barChart,
        borderRadius: 4,
        yAxisID: "y",
      },
    ],
  };

  // React.useEffect(() => {
  //   console.log("plant data:", data);
  // }, [data]);

  return (
    <Box className="cell p-3">
      <ChartTitleBar title="Plant Contribution" />

      {loading ? (
        <Loading height={300} />
      ) : (
        <Box sx={{ height: { xs: "300px", md: "400px" } }}>
          {data === undefined ? (
            <DataNotFound />
          ) : (
            <Chart
              options={options}
              data={chartData}
              plugins={[ChartDataLabels]}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default PlantLineContribution;
