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

const AnnualPmStatusGraph = ({ graphData }) => {


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
        // interaction: {
        //   mode: 'index' as const,
        //   intersect: false,
        // },
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: "Months",
                },
                // ticks: {
                //     autoSkip: false,
                //     maxRotation: 90,
                //     minRotation: 90,
                // },
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
                    max: 4
                },
            },
        },
    };

    const monthKeyArray = [
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
        "Jan",
        "Feb",
        "Mar",
    ];



    const data = {
        labels: monthKeyArray,
        datasets: [
            {
                label: "Plan",
                data: graphData?.annual_total_current_schedule,
                backgroundColor: "#CFE1FD",
                borderColor: "rgba(54, 162, 235, 1)",
                stack: "Stack 0",
            },
            {
                label: "Last Month Pending",
                data: graphData?.annual_previous_pending,
                backgroundColor: "rgb(250, 178, 178)",
                stack: "Stack 0",
            },
            {
                label: "Actual",
                data: graphData?.annual_completed,
                backgroundColor: "#bde28f",
                borderColor: "#adec71",
                stack: "Stack 1",
            },
        ],
    };
    return (
        <Bar options={options} height={500} data={data} />
    )
}

export default AnnualPmStatusGraph

