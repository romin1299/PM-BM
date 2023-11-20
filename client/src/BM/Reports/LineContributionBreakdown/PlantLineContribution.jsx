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
import ChartDataLabels from "chartjs-plugin-datalabels";




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

// Register the plugin to all charts:
ChartJS.register(ChartDataLabels);

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
            //     text: "Lines",

            // },
            ticks: {
                maxRotation: 90,
                minRotation: 90,
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

const plantNames = [
    "FA3WP",
    "M.A.5",
    "FA3NWP",
    "FA2WP",
    "M.A.4",
    "M.A.2",
    "AOI.5",
    "AOI.6",
    "FAAB2",
    "CELLSENSOR",
    "M.A.3",
    "FAAB1",
];



const data = {
    labels: plantNames,
    datasets: [
        {
            type: "line",
            label: "Breakdown Hrs",
            data: [19, 18, 16, 14, 12, 10, 8, 6, 4, 2, 1, 1],
            borderColor: chartColors.yellow[1],
            borderWidth: 2,
            fill: false,
            backgroundColor: chartColors.magenta[1],
            pointStyle: 'rectRot',
            pointRadius: 5,
            pointBorderColor: 'rgb(204, 41, 46)'
        },
        {
            type: "bar",
            stack: "bar-stacked",
            label: "% Contribution",
            data: [19, 17, 15, 13, 11, 9, 7, 5, 3, 1, 1, 1],
            backgroundColor: chartColors.aqua[1],
            pointStyle: 'rect',
        },

    ],
};

const LineCondribution = () => {
    return (

        <Container fluid>


            <Row style={{ marginTop: "1.25rem" }}>
                <Col lg={12}>
                    <Box className="cell p-3">
                        <Row style={{ marginBottom: "1rem" }}>
                            <Typography
                                className="col"
                                variant="h5"
                                component="h5"
                            >
                                Plant Contribution
                            </Typography>

                            <Col className="col-auto d-flex">
                                <FilterMenu DropdownValue="hour" />
                            </Col>
                        </Row>
                        <Divider sx={{ mb: 2, borderColor: "black" }} />
                        <Chart height={120} options={options} data={data} />
                    </Box>
                </Col>



            </Row>
        </Container>


    );
};

export default LineCondribution;
