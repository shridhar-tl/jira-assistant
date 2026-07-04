import { useMemo } from 'react';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

import { orderBy } from '@utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const lineChartColours = [
    {
        backgroundColor: '#f1c40f4a',
        borderColor: '#f1c40f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
    },
    {
        backgroundColor: '#27ae614a',
        borderColor: '#27ae61',
        pointBackgroundColor: 'rgba(77,83,96,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(77,83,96,1)',
    },
    {
        backgroundColor: '#e84c3d4a',
        borderColor: '#e84c3d',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
    },
    {
        backgroundColor: '#8f44ad4a',
        borderColor: '#8f44ad',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
    },
    {
        backgroundColor: '#9a8d2f4a',
        borderColor: '#9a8d2f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
    },
    {
        backgroundColor: 'rgba(148,159,177,0.2)',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
    },
];

const chartOptions = {
    animation: false as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top' as const,
            labels: {
                usePointStyle: true,
                padding: 16,
            },
        },
        tooltip: {
            mode: 'index' as const,
            intersect: false,
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0,0,0,0.05)',
            },
        },
        x: {
            grid: {
                display: false,
            },
        },
    },
    interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
    },
};

interface VelocityChartProps {
    sprintDetails: any[];
}

function VelocityChart({ sprintDetails }: VelocityChartProps) {
    const chartData = useMemo(() => {
        const sprintLabels: string[] = [];
        const arrEstimated: number[] = [];
        const arrCompleted: number[] = [];
        const arrIncomplete: number[] = [];
        const arrTotal: number[] = [];
        const arrAdded: number[] = [];
        const arrRemoved: number[] = [];

        orderBy(sprintDetails, (sprint: any) => sprint.sprint.id).forEach((sprint: any) => {
            sprintLabels.push(sprint.sprint.name);
            arrEstimated.push(sprint.estimateIssuesSP || 0);
            arrCompleted.push(sprint.completedSP || 0);
            arrIncomplete.push(sprint.incompletedSP || 0);
            arrTotal.push(sprint.totalIssuesSP || 0);
            arrAdded.push(sprint.addedSP || 0);
            arrRemoved.push(sprint.removedSP || 0);
        });

        return {
            labels: sprintLabels,
            datasets: [
                { data: arrEstimated, label: 'Estimated', fill: true, tension: 0.3, ...lineChartColours[0] },
                { data: arrCompleted, label: 'Completed', fill: true, tension: 0.3, ...lineChartColours[1] },
                { data: arrIncomplete, label: 'Not completed', fill: true, tension: 0.3, ...lineChartColours[2] },
                { data: arrTotal, label: 'Total', fill: true, tension: 0.3, ...lineChartColours[3] },
                { data: arrAdded, label: 'Added to sprint', fill: true, tension: 0.3, ...lineChartColours[4] },
                { data: arrRemoved, label: 'Removed from sprint', fill: true, tension: 0.3, ...lineChartColours[5] },
            ],
        };
    }, [sprintDetails]);

    return (
        <div className="p-4">
            <div className="relative h-[calc(100vh-240px)] min-h-[400px]">
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
}

export default VelocityChart;
