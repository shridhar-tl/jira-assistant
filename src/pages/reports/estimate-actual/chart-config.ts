import pattern from 'patternomaly';

import type { ChartColorConfig } from './types';

const defaultChartColors: ChartColorConfig[] = [
    {
        backgroundColor: '#f1c40f4a',
        borderColor: '#f1c40f',
        hoverBackgroundColor: '#f1c40f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#27ae614a',
        borderColor: '#27ae61',
        pointBackgroundColor: 'rgba(77,83,96,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#e84c3d4a',
        borderColor: '#e84c3d',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#8f44ad4a',
        borderColor: '#8f44ad',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#9a8d2f4a',
        borderColor: '#9a8d2f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#3e95cd94',
        borderColor: '#3e95cd',
        hoverBackgroundColor: '#3e95cd',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#8e5ea27a',
        borderColor: '#8e5ea2',
        hoverBackgroundColor: '#8e5ea2',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#3cba9f7d',
        borderColor: '#3cba9f',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#e8c3b987',
        borderColor: '#e8c3b9',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: '#c4585080',
        borderColor: '#c45850',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
    {
        backgroundColor: 'rgba(148,159,177,0.2)',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
    },
];

export const chartColours = defaultChartColors.union((d: ChartColorConfig) => [
    { ...d, hoverBackgroundColor: d.borderColor },
    { ...d, hoverBackgroundColor: pattern.draw('zigzag', d.backgroundColor), backgroundColor: pattern.draw('zigzag', d.borderColor) },
]);

export const chartOptions = {
    animation: false as const,
    maintainAspectRatio: false,
    plugins: {
        title: {
            display: true,
            text: 'Estimate vs Actual',
        },
        tooltip: {
            mode: 'index' as const,
        },
    },
    scales: {
        x: {
            stacked: false,
            ticks: {
                stepSize: 1,
                autoSkip: false,
            },
        },
    },
};
