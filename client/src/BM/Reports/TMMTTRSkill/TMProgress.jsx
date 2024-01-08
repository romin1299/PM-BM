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
import { Chart } from "react-chartjs-2";
import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { Col } from "react-bootstrap";
import { MONTH_LABELS, chartColors } from "../../Utils/ChartUtils/chartEnums";
import ChartTitleBar from "../Common/ChartTitleBar";
import DataNotFound from "../Common/DataNotFound";
import axios from "axios";
import TeamMembersDropdown from "./TeamMembersDropdown";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      align: "end",
      labels: {
        usePointStyle: true,
      },
    },
    datalabels: { display: false },
  },
  // elements: {
  //   bar: {
  //     borderColor: "000",
  //     borderWidth: 1,
  //   },
  // },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      title: {
        display: true,
        text: "Months",
      },
      ticks: {
        color: "black",
        // maxRotation: 90,
        // minRotation: 90,
      },
    },
    y: {
      stacked: true,
      position: "left",
      ticks: {
        color: "black",
      },
      title: {
        display: true,
        text: "MTTR Hours",
      },
    },
  },
};

const TMProgress = ({
  timeFilter,
  selectedValue,
  flagForTogglingFilter,
  selectedYear,
  tmId,
  setTmId,
}) => {
  const [data, setData] = React.useState({});
  const [isAllTM, setIsAllTM] = React.useState(false);

  const fetchChartData = async () => {
    // console.log("selectedValue:", selectedValue);
    const url = `/tmProgress/tmMTTRSkill/${flagForTogglingFilter}/${selectedValue}/${tmId}`;
    const params = {
      selectedYear,
      time: timeFilter,
      // includeMBD: timeFilter ? "include-mbd" : "",
      // allFilter: isAllTM ? "include-all" : "",
    };

    try {
      const res = await axios.get(url, {
        params,
        withCredentials: true,
        credentials: "include",
      });
      // console.log("MTTR Trend res:", res.data.data);

      setData(res?.data?.data);
    } catch (error) {
      console.log("error:", error);
    }
  };

  React.useEffect(() => {
    if (selectedValue) fetchChartData();
  }, [selectedValue, tmId, selectedYear, timeFilter]);

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        type: "line",
        stack: "bar-stacked",
        label: "Hours",
        data: data?.data,
        backgroundColor: chartColors[3],
        borderColor: chartColors[3],
        borderWidth: 2,
        pointStyle: "circle",
        yAxisID: "y",
      },
    ],
  };

  // React.useEffect(() => {
  //   console.log("TM progress data:", data);
  // }, [data]);

  // const handleChange = (event) => {
  //   setIsAllTM(event.target.checked);
  // };

  // const AllTMCheckBox = (
  //   <Col className="col-auto">
  //     <FormControlLabel
  //       control={
  //         <Checkbox
  //           // size="small"
  //           sx={{
  //             color: "#004b5b",
  //             "&.MuiCheckbox-root": { p: "0px", mr: "10px" },
  //             "&.Mui-checked": { color: "#004b5b" },
  //           }}
  //           checked={isAllTM}
  //           onChange={handleChange}
  //           inputProps={{ size: "10px" }}
  //         />
  //       }
  //       label="All"
  //     />
  //   </Col>
  // );

  return (
    <Box className="cell p-3">
      <ChartTitleBar
        title="TM Load"
        Toolbar={
          <>
            <Col className="col-auto">
              <TeamMembersDropdown
                tmId={tmId}
                setTmId={setTmId}
                selectedValue={selectedValue}
                flagForTogglingFilter={flagForTogglingFilter}
              />
            </Col>

            {/* {AllTMCheckBox} */}
          </>
        }
      />

      <Box sx={{ height: { xs: "300px", md: "350px" } }}>
        {data === undefined ? (
          <DataNotFound />
        ) : (
          <Chart options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default TMProgress;
