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
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
import Loading from "../../../components/Loading/Loading";
import downloadFile from "../../../util";
import findFilters from "../../../filterNames";

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
  interaction: {
    mode: "index",
    intersect: false,
  },
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
      grid: {
        display: false,
      },
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
      grid: {
        display: false,
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

const PlantLineContribution = ({
  selectedYear,
  selectedMonth,
  reduceState,
  userDetails,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({});

  const { filteredValuesWithHOD, filteredValues } = findFilters(
    reduceState.flagForTogglingFilter,
    reduceState,
    reduceState.selectedValue
  );

  let arrayItems;
  let filterHeaders;

  if (userDetails.tm_grade === "HOD") {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      ...filteredValuesWithHOD,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  } else {
    arrayItems = [
      userDetails?.plant_data.split("-")?.[0],
      userDetails?.section_data.split("-")?.[1],
      ...filteredValues,
    ];
    // filterHeaders = ["Plant", "Section", "Sub-Section", "Cell", "Line"];
  }

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

      // console.log("plant contri res:", res.data);
      setData(res?.data?.lineWiseBDData[0]);

      // delete this piece of code after successful server response
      // setData(undefined); //keep undefined till api is stable
    } catch (error) {
      setData({});
      console.log("error:", error);
    }

    setLoading(false);
  };

  const header = ["Line Names", "Hours", "Percentages"];

  const handleDownload = async (fileType) => {
    try {
      // const bodyData = [[data?.lineNames, data?.bdHours, data?.percentages]];

      let bodyData = [];
      let filterData = [];

      if (fileType === "csv") {
        bodyData = [
          ["Filters", ...arrayItems] + "\n",
          ["\n"],
          [["Line Names"].concat(data?.lineNames)?.toString() + "\n"],
          [["Hours"].concat(data?.bdHours)?.toString() + "\n"],
          [["Percentages"].concat(data?.percentages)?.toString() + "\n"],
        ];
      } else {
        bodyData = [
          [
            data?.lineNames.join("\n"),
            data?.bdHours.join("\n"),
            data?.percentages.join("\n"),
          ],
        ];
        filterData = ["Filters", ...arrayItems];
      }
      downloadFile(
        filterData,
        bodyData,
        fileType,
        header,
        `Plant_Linewise_Contribution_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
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
        borderColor: "#312A7D",
        borderWidth: 2,
      },
    ],
  };

  // React.useEffect(() => {
  //   console.log("plant data:", data);
  // }, [data]);

  const noData = data === undefined || Object.keys(data).length === 0;

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="Plant Contribution"
        Toolbar={
          <div className="col-auto">
            <ChartDownloadMenu
              handleDownloadCSV={() => {
                handleDownload("csv");
              }}
              handleDownloadPDF={() => {
                handleDownload("pdf");
              }}
            />
          </div>
        }
      />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : noData ? (
          <DataNotFound />
        ) : (
          <Chart data={chartData} options={options} />
        )}
      </Box>
    </Box>
  );
};

export default PlantLineContribution;
