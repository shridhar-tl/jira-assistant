import { Chart } from 'primereact/chart';
import React from 'react';
import { replaceRepeatedWords } from 'src/common/utils';

const documentStyle = getComputedStyle(document.documentElement);
const textColor = documentStyle.getPropertyValue('--text-color');
const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
const defaultLineColors = [
    'rgba(255, 99, 132)',
    'rgba(54, 162, 235)',
    'rgb(105 0 251)',
    'rgba(75, 192, 192)',
    'rgba(123, 12, 55)',
    'rgba(255, 159, 64)',
    'rgba(34, 33, 219)',
    'rgba(25, 100, 229)',
];

function getOptions(titleText, subTitle, minY, maxY, xAxisLabels) {
    const xAxis = {
        ticks: {
            color: textColorSecondary
        },
        grid: {
            color: surfaceBorder
        }
    };

    if (xAxisLabels.length > 4) {
        xAxis.ticks.callback = (_, index) => xAxisLabels[index];
    }

    return {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: titleText,
                align: "center",
                font: { size: '16px' },
                padding: 0
            },
            subtitle: {
                display: true,
                text: subTitle,
                padding: 10
            },
            legend: {
                position: 'bottom',
                labels: {
                    color: textColor
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                padding: 12,
                boxPadding: 6,
                callbacks: {
                    title: (tooltipItems) => `Sprint: ${tooltipItems[0].label}`,
                    label: (tooltipItem) =>
                        `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue} days`
                },
                bodySpacing: 10
            }
        },
        hover: {
            mode: 'index',
            intersect: false
        },
        scales: {
            x: xAxis,
            y: {
                title: {
                    display: true,
                    text: 'Time Spent (days)'
                },
                min: minY,
                max: maxY,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y1: {
                position: 'right',
                title: {
                    display: true,
                    text: 'Cycle Time (Days)'
                },
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    };
}

function getChartData(sprintList, key, label, borderColor, others) {
    return {
        label,
        data: sprintList.map(s => s.statusWiseTimeSpent[key] || 0),
        fill: false,
        borderColor,
        tension: 0.4,
        ...others
    };
}

function getCycleTimeData(sprintList) {
    return {
        label: 'Cycle Time',
        data: sprintList.map(({ averageCycleTime }) => averageCycleTime),
        backgroundColor: '#FFD700',
        yAxisID: 'y1',
        type: 'bar'
    };
}

function SprintStatusWiseTimeSpentChart({ board }) {
    const { data, options } = React.useMemo(() => {
        const { name, sprintList, boardColumnsOrder } = board;
        const availableSprints = sprintList.filter(Boolean);
        const labels = availableSprints.map(s => s.name);
        const shortenedLabels = replaceRepeatedWords(labels);
        const statusList = availableSprints.flatMap(s => Object.keys(s.statusWiseTimeSpent)).distinct().sortBy(s => boardColumnsOrder[s] ?? 10);
        const datasets = statusList.map((s, i) => getChartData(availableSprints, s, s, defaultLineColors[i]));
        datasets.push(getCycleTimeData(availableSprints));

        let minY = 2, maxY = 4;

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

        return {
            data: { labels, datasets },
            options: getOptions(name, `Status Wise Time Spent`, minY, maxY + 1, shortenedLabels)
        };
    }, [board]);

    return (
        <div className="col-12 col-xl-6 mb-4">
            <Chart className="exportable-image" type="line" data={data} options={options} height="350px" />
        </div>
    );
}

export default SprintStatusWiseTimeSpentChart;