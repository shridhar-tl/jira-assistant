import { useMemo } from 'react';

import {
    BarController,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    SubTitle,
    Title,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

import { replaceRepeatedWords } from '@/utils/helpers';

import type { BoardData } from './types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    BarElement,
    BarController,
    SubTitle,
    Title,
    Tooltip,
    Legend,
);

interface SprintStatusWiseTimeSpentChartProps {
    board: BoardData;
}

const defaultLineColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgb(105, 0, 251)',
    'rgba(75, 192, 192, 1)',
    'rgba(123, 12, 55, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(34, 33, 219, 1)',
    'rgba(25, 100, 229, 1)',
];

function getChartData(sprintList: any[], key: string, label: string, borderColor: string, others?: any) {
    return {
        label,
        data: sprintList.map((s) => s.statusWiseTimeSpent[key] || 0),
        fill: false,
        borderColor,
        tension: 0.4,
        ...others,
    };
}

function getCycleTimeData(sprintList: any[]) {
    return {
        label: 'Cycle Time',
        data: sprintList.map((s) => s.averageCycleTime),
        backgroundColor: '#FFD700',
        yAxisID: 'y1',
        type: 'bar' as const,
    };
}

function SprintStatusWiseTimeSpentChart({ board }: SprintStatusWiseTimeSpentChartProps) {
    const { data, options } = useMemo(() => {
        const { name, sprintList, boardColumnsOrder } = board;
        const availableSprints = sprintList.filter(Boolean);
        const labels = availableSprints.map((s) => s!.name);
        const shortenedLabels = replaceRepeatedWords(labels);

        const statusList = availableSprints
            .flatMap((s) => Object.keys(s!.statusWiseTimeSpent))
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort((a, b) => (boardColumnsOrder[a] ?? 10) - (boardColumnsOrder[b] ?? 10));

        const datasets = statusList.map((s, i) => getChartData(availableSprints, s, s, defaultLineColors[i % defaultLineColors.length]));
        datasets.push(getCycleTimeData(availableSprints));

        let minY = 2,
            maxY = 4;

        for (const ds of datasets) {
            if (ds.yAxisID !== 'y1') {
                for (const val of ds.data) {
                    if (val < minY) {
                        minY = val;
                    }
                    if (val > maxY) {
                        maxY = val;
                    }
                }
            }
        }

        if (minY <= 1) {
            minY = -1;
        } else if (minY <= 2) {
            minY = 0;
        } else {
            minY -= 1;
        }

        const options: ChartOptions = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: name,
                    align: 'center',
                    font: { size: 16 },
                },
                subtitle: {
                    display: true,
                    text: 'Status Wise Time Spent',
                    padding: { bottom: 10 },
                },
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    padding: 12,
                    callbacks: {
                        title: (tooltipItems) => `Sprint: ${tooltipItems[0].label}`,
                        label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue} days`,
                    },
                },
            },
            hover: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks:
                        shortenedLabels.length > 4
                            ? {
                                  callback: (_, index) => shortenedLabels[index],
                              }
                            : undefined,
                },
                y: {
                    title: {
                        display: true,
                        text: 'Time Spent (days)',
                    },
                    min: minY,
                    max: maxY + 1,
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cycle Time (Days)',
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
        };

        return {
            data: { labels, datasets },
            options,
        };
    }, [board]);

    return (
        <div className="mb-4">
            <div className="exportable-image" style={{ height: '350px' }}>
                <Chart type="line" data={data} options={options} />
            </div>
        </div>
    );
}

export default SprintStatusWiseTimeSpentChart;
