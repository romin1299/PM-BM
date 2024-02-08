import React from "react";
import { Chart } from "react-chartjs-2";
import { Box, Divider, Paper, Typography } from "@mui/material";
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
import { Row, Col } from "react-bootstrap";
import axios from "axios";
import SectionCellSelectionDropdown from "./SectionCellSelectionDropdown";
import DataNotFound from "../Common/DataNotFound";
import ChartTitleBar, { ChartDownloadMenu } from "../Common/ChartTitleBar";
import { commonDatalabels } from "../../Utils/ChartUtils/chartOptions";
import Loading from "../../../components/Loading/Loading";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import downloadFile from "../../../util";

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
    datalabels: { display: false },
    // datalabels: commonDatalabels,
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

const SectionContribution = ({ reduceState, reducerDispatch }) => {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({});

  const { selectedYear, selectedMonth, flagForTogglingFilter, selectedValue } =
    reduceState;

  const fetchChartData = async () => {
    setLoading(true);

    const url = `/lineWiseBdContribution/${flagForTogglingFilter}/${selectedValue}`;
    const params = { selectedYear, selectedMonth };

    try {
      const res = await axios.get(url, {
        params, //uncomment when database is updated with agrregated year and month values
        withCredentials: true,
        credentials: "include",
      });

      // console.log("line res:", res?.data?.lineWiseBDData[0]);
      setData(res?.data?.lineWiseBDData[0]);
    } catch (error) {
      console.log("error:", error);
      setData({});
    }

    setLoading(false);
  };

  const header = ["Line Names", "Hours", "Percentages"];

  const handleDownload = async (fileType) => {
    try {
      let bodyData = [];
      if (fileType === "csv") {
        bodyData = [
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
      }

      downloadFile(
        bodyData,
        fileType,
        header,
        `${
          flagForTogglingFilter.split("-")?.[2]
        }_Linewise_Contribution_${selectedMonth}_${selectedYear}`
      );
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

  React.useEffect(() => {
    selectedValue && fetchChartData();
  }, [selectedValue, selectedYear, selectedMonth]);

  // React.useEffect(() => {
  //   console.log("section data:", data);
  // }, [data]);

  const chartData = {
    labels: data?.lineNames,
    datasets: [
      {
        type: "line",
        label: "Breakdown Hrs",
        data: data?.bdHours,
        fill: false,
        borderWidth: 2,
        backgroundColor: chartColors.bdHoursLine,
        borderColor: chartColors.bdHoursLine,
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
  const baseUrlForFiltering = "/getFiltrationValue/all-filtration";

  const noData = data === undefined || Object.keys(data).length === 0;

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="Section Contribution"
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

      <Row>
        <ChartsToolbar
          baseUrlForFiltering={baseUrlForFiltering}
          reduceState={reduceState}
          reducerDispatch={reducerDispatch}
          sectionFiltration
          subSectionFiltration
          cellFiltration
          resetButtonFiltration
        />
      </Row>

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {loading ? (
          <Loading height={"100%"} />
        ) : noData ? (
          <DataNotFound sx={{ mt: 2 }} />
        ) : (
          <Chart
            options={options}
            data={chartData}
            plugins={[ChartDataLabels]}
          />
        )}
      </Box>
    </Box>
  );
};

export default SectionContribution;
