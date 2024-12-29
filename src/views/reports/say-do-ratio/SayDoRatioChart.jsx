import { Chart } from 'primereact/chart';
import React from 'react';

const documentStyle = getComputedStyle(document.documentElement);
const textColor = documentStyle.getPropertyValue('--text-color');
const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

function getOptions(titleText, subTitle, minY, maxY) {
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
                        `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue} ${tooltipItem.dataset.yAxisID === 'y1' ? 'days' : 'points'}`
                },
                bodySpacing: 10
            }
        },
        hover: {
            mode: 'index',
            intersect: false
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Story Points'
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
                    text: 'Say Do Ratio (%)'
                },
                min: 0,
                max: 100,
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
        data: sprintList.map(({ [key]: value }) => value),
        fill: false,
        borderColor,
        tension: 0.4,
        ...others
    };
}

function SayDoRatioChart({ board }) {
    const { data, options } = React.useMemo(() => {
        const { name, sprintList, velocity } = board;
        const availableSprints = sprintList.filter(Boolean);
        const labels = availableSprints.map(s => s.name);
        const datasets = [
            getChartData(availableSprints, 'velocity', 'Velocity', '#4169E1', { borderDash: [5, 5] }),
            getChartData(availableSprints, 'committedStoryPoints', 'Committed', '#FF6347'),
            getChartData(availableSprints, 'completedStoryPoints', 'Completed', '#228B22'),
            getChartData(availableSprints, 'sayDoRatio', 'Say Do Ratio', '#FFD700', { yAxisID: 'y1', fill: true, backgroundColor: '#ffed8cc4' })
        ];

        let minY = 7, maxY = 7;

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

        return {
            data: { labels, datasets },
            options: getOptions(name, `Velocity: ${velocity ?? '(Unavailable)'}`, minY, maxY + 2)
        };
    }, [board]);

    return (
        <div className="col-12 col-xl-6 mb-4">
            <Chart className="exportable-image" type="line" data={data} options={options} height="350px" />
        </div>
    );
}

export default SayDoRatioChart;