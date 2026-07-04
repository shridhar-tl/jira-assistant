import { useMemo } from 'react';

import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    SubTitle,
    Title,
    Tooltip,
    type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import { replaceRepeatedWords } from '@/utils/helpers';

import type { BoardData } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, SubTitle, Title, Tooltip, Legend, Filler);

interface SayDoRatioChartProps {
    board: BoardData;
}

function getChartData(sprintList: any[], key: string, label: string, borderColor: string, others?: any) {
    return {
        label,
        data: sprintList.map((s) => s[key]),
        fill: false,
        borderColor,
        tension: 0.4,
        ...others,
    };
}

function SayDoRatioChart({ board }: SayDoRatioChartProps) {
    const { data, options } = useMemo(() => {
        const { name, sprintList, velocity } = board;
        const availableSprints = sprintList.filter(Boolean);
        const labels = availableSprints.map((s) => s!.name);
        const shortenedLabels = replaceRepeatedWords(labels);

        const datasets = [
            getChartData(availableSprints, 'velocity', 'Velocity', '#4169E1', { borderDash: [5, 5] }),
            getChartData(availableSprints, 'committedStoryPoints', 'Committed', '#FF6347'),
            getChartData(availableSprints, 'completedStoryPoints', 'Completed', '#228B22'),
            getChartData(availableSprints, 'sayDoRatio', 'Say Do Ratio', '#c4a6ff', {
                yAxisID: 'y1',
                fill: true,
                backgroundColor: 'rgba(196, 166, 255, 0.2)',
            }),
        ];

        let minY = 7,
            maxY = 7;

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

        if (minY <= 2) {
            minY = 0;
        } else {
            minY -= 1;
        }

        const options: ChartOptions<'line'> = {
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
                    text: `Velocity: ${velocity ?? '(Unavailable)'}`,
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
                        label: (tooltipItem) =>
                            `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue} ${tooltipItem.dataset.yAxisID === 'y1' ? '%' : 'points'}`,
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
                        text: 'Story Points',
                    },
                    min: minY,
                    max: maxY + 2,
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Say Do Ratio (%)',
                    },
                    min: 0,
                    max: 100,
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
                <Line data={data} options={options} />
            </div>
        </div>
    );
}

export default SayDoRatioChart;
