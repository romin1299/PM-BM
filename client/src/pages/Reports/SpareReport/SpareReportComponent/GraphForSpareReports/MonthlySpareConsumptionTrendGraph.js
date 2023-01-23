import React from 'react'
import {
    Chart as ChartJS,
    LinearScale,
    CategoryScale,
    BarElement,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
    LineController,
    BarController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';


const MonthlySpareConsumptionTrendGraph = () => {

    ChartJS.register(
        LinearScale,
        CategoryScale,
        BarElement,
        PointElement,
        LineElement,
        Legend,
        Tooltip,
        LineController,
        BarController
    );

    const options = {
        plugins: {
            title: {
                display: true,
                text: 'Chart.js Bar Chart - Stacked',
            },
        },
        responsive: true,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        },
    };

    const labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];


    const data = {
        labels,
        datasets: [
            {
                type: 'line',
                label: 'Total',
                borderColor: 'red',
                borderWidth: 2,
                // fill: false,
                // backgroundColor: "red",
                data: [1, 2, 3, 4, 1, 4, 2, 3, 2, 1, 3, 2],
            },
            {
                type: 'bar',
                label: 'Dataset 2',
                backgroundColor: 'rgb(75, 192, 192)',
                data: labels.map(() => 1),
                // borderColor: 'white',
                borderWidth: 2,
            },
            {
                type: 'bar',
                label: 'Dataset 2',
                backgroundColor: 'rgb(53, 162, 235)',
                data: labels.map(() => 1),
            },
            {
                type: 'bar',
                label: 'Dataset 2',
                backgroundColor: 'rgb(255, 99, 132)',
                data: labels.map(() => 1),
            },
            {
                type: 'bar',
                label: 'Dataset 2',
                backgroundColor: 'rgb(132, 63, 128)',
                data: labels.map(() => 1),
            },


        ],
    };

    return (
        <Chart type='bar' data={data} options={options} />
    )
}

export default MonthlySpareConsumptionTrendGraph