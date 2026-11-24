import { useMemo } from 'react';

import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip, type ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

import { formatMeasure } from '../../pi-progress';
import type { BurnUp } from '../../pi-summary-model';

import { getChartTheme, seriesColors } from './chart-theme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface BurnUpChartProps {
    burnUp: BurnUp;
}

const measureLabels = { points: 'Story points', hours: 'Hours', count: 'Stories' };

/** Scope, the work planned to be finished by each iteration and the work actually finished: the gap between the last two is the slip. */
export default function BurnUpChart({ burnUp }: BurnUpChartProps) {
    const theme = getChartTheme();
    const data = useMemo(
        () => ({
            labels: burnUp.labels,
            datasets: [
                { label: 'Scope', data: burnUp.scope, borderColor: seriesColors.scope, borderDash: [6, 4], pointRadius: 0, borderWidth: 2, fill: false },
                { label: 'Planned to finish', data: burnUp.planned, borderColor: seriesColors.inProgress, backgroundColor: seriesColors.inProgress, pointRadius: 4, borderWidth: 2, fill: false },
                {
                    label: 'Finished',
                    data: burnUp.done,
                    borderColor: seriesColors.done,
                    backgroundColor: `${seriesColors.done}22`,
                    pointBackgroundColor: seriesColors.done,
                    pointBorderColor: theme.surface,
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    borderWidth: 2,
                    fill: true,
                },
            ],
        }),
        [burnUp, theme.surface],
    );

    const options = useMemo<ChartOptions<'line'>>(
        () => ({
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', align: 'start', labels: { color: theme.muted, usePointStyle: true, boxWidth: 10, padding: 12 } },
                tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${formatMeasure(Number(item.raw), burnUp.measure)}` } },
            },
            scales: {
                x: { ticks: { color: theme.text }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: theme.muted }, grid: { color: theme.grid }, title: { display: true, text: measureLabels[burnUp.measure], color: theme.muted } },
            },
        }),
        [burnUp.measure, theme.muted, theme.text, theme.grid],
    );

    return (
        <div className="relative h-64 w-full sm:h-72">
            <Line data={data} options={options} aria-label="Burn-up of the plan" role="img" />
        </div>
    );
}
