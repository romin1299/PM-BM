import React from 'react'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

const SpareConsumptionTrendTypeGraph = ({ graphData }) => {

    ChartJS.register(ArcElement, Tooltip, Legend);

    const data = {
        labels: ['PM', 'BM', 'Corrective', 'Predictive', 'Kaizen'],
        datasets: [
            {
                label: '# of Votes',
                data:

                    graphData?.reduce((accumulator, object) => {
                        accumulator[0] += object.sumOfTotalPMSpareCost;
                        accumulator[1] += object.sumOfTotalBMSpareCost;
                        accumulator[2] += object.sumOfTotalCorrectiveSpareCost;
                        accumulator[3] += object.sumOfTotalPridictiveSpareCost;
                        accumulator[4] += object.sumOfTotalKaizenSpareCost;

                        return accumulator
                    }, [0, 0, 0, 0, 0])

                ,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };


    return (
        <Pie data={data} />
    )
}

export default SpareConsumptionTrendTypeGraph