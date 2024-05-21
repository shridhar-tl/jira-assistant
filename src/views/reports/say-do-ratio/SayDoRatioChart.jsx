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
            }
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
                min: minY,
                max: maxY,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
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
        const { name, sprintList, averageCompleted } = board;
        const availableSprints = sprintList.filter(Boolean);
        const labels = availableSprints.map(s => s.name);
        const datasets = [
            getChartData(availableSprints, 'velocity', 'Velocity', '#4169E1', { borderDash: [5, 5] }),
            getChartData(availableSprints, 'committedStoryPoints', 'Committed', '#228B22'),
            getChartData(availableSprints, 'completedStoryPoints', 'Completed', '#FF6347')
        ];

        let minY = 7, maxY = 7;

        for (const ds of datasets) {
            for (const val of ds.data) {
                if (val < minY) {
                    minY = val;
                }

                if (val > maxY) {
                    maxY = val;
                }
            }
        }

        if (minY <= 2) {
            minY = 0;
        }

        return {
            data: { labels, datasets },
            options: getOptions(name, `Velocity: ${averageCompleted}`, minY, maxY + 2)
        };
    }, [board]);

    return (
        <div className="col-12 col-xl-6">
            <Chart type="line" data={data} options={options} height="350px" />
        </div>
    );
}

export default SayDoRatioChart;