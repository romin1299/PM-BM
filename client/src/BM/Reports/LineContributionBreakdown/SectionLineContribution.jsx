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
import { Container, Row, Col } from "react-bootstrap";
import ChartsToolbar from "../ManHourReport/SubComponents/ChartsToolbar";
import { FilterMenu } from "../ManHourReport/SubComponents/FilterMenu"




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
    plugins: {
        legend: {
            align: "end",
            labels: {
                usePointStyle: true,
            },
        },
        datalabels: {
            display: false,
        },
    },
    responsive: true,
    scales: {
        x: {
            stacked: true,
            grid: {
                display: false, // Hide vertical grid lines
            },
            // title: {
            //     display: true,
            //     text: "Section",
            // },
            ticks: {
                // maxRotation: 90,
                // minRotation: 90,
                color: 'black'
            },

        },
        y: {
            stacked: true,
            title: {
                display: true,
                text: "% Contribution",
            },

            min: 0,
            max: 20,
            stepSize: 5,
            ticks: {
                callback: function (value, index, values) {
                    return value + " %";
                },
                color: 'black'
            }
        },
        y2: {
            position: "right",
            title: {
                display: true,
                text: "Breakdown Hours",
            },
            min: 0,
            max: 50,
            stepSize: 5,
            ticks: {
                color: 'black'
            }
        },
    },
};

const machineNames = [
    "MA5",
    "FANW21",
    "MFI21",
    "OEPS21",
    "PPLIN1",
    "SHN1",
    "JLD2",
    "ABT2",
    "MIK1",
    "LPD2",
    "PWL12",
    "AWQ4",
];



const data = {
    labels: machineNames,
    datasets: [
        {
            type: "line",
            label: "Breakdown Hrs",
            data: [19, 18, 16, 14, 12, 10, 8, 6, 4, 2, 1, 1],
            borderColor: chartColors.blue[2],
            borderWidth: 2,
            fill: false,
            backgroundColor: chartColors.blue[2],
            pointStyle: 'rectRot',
            pointRadius: 5,
            pointBorderColor: 'rgb(7, 78, 102)',
            pointBackgroundColor: 'rgb(7, 78, 102)',

        },
        {
            type: "bar",
            stack: "bar-stacked",
            label: "% Contribution",
            data: [19, 17, 15, 13, 11, 9, 7, 5, 3, 1, 1, 1],
            backgroundColor: chartColors.orange[2],
            pointStyle: 'rect',
        },

    ],
};

const SectionCondribution = () => {
    return (
<Box className="cell p-3 mb-5">
        <Row style={{ marginBottom: "1rem" }}>
          <Typography
            className="col"
            variant="h5"
            component="h5"
          >
            Section Contribution
          </Typography>
  
          <Col className="col-auto d-flex">
            <FilterMenu DropdownValue="hour" />
          </Col>
        </Row>
        <Divider sx={{ mb: 2, borderColor: "black" }} />
        <Chart height={100} options={options} data={data} />
      </Box>

    );
};

export default SectionCondribution;
