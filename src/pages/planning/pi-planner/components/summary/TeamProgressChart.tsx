import { useMemo } from 'react';

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartOptions, type TooltipItem } from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { formatNumber } from '../../../shared/format';
import type { TeamProgress } from '../../pi-summary-model';

import { getChartTheme, seriesColors } from './chart-theme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TeamProgressChartProps {
    teams: TeamProgress[];
    elapsedPercent: number;
}

const rowHeight = 36;

function share(value: number, total: number): number {
    return total > 0 ? Math.round((value * 1000) / total) / 10 : 0;
}

/** Each team's scope split into done, in progress and to do, as a share of the team's own scope so teams estimating differently compare. */
export default function TeamProgressChart({ teams, elapsedPercent }: TeamProgressChartProps) {
    const theme = getChartTheme();
    const data = useMemo(
        () => ({
            labels: teams.map((t) => t.name),
            datasets: [
                { label: 'Done', data: teams.map((t) => share(t.done, t.total)), backgroundColor: seriesColors.done },
                { label: 'In progress', data: teams.map((t) => share(t.inProgress, t.total)), backgroundColor: seriesColors.inProgress },
                { label: 'To do', data: teams.map((t) => share(t.todo, t.total)), backgroundColor: seriesColors.todo },
            ].map((ds) => ({ ...ds, borderColor: theme.surface, borderWidth: { right: 2 }, borderSkipped: false, borderRadius: 4, barThickness: 18 })),
        }),
        [teams, theme.surface],
    );

    const options = useMemo<ChartOptions<'bar'>>(
        () => ({
            indexAxis: 'y',
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'start', labels: { color: theme.muted, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, padding: 12 } },
                tooltip: {
                    callbacks: {
                        label: (item: TooltipItem<'bar'>) => {
                            const team = teams[item.dataIndex];
                            const values = [team.done, team.inProgress, team.todo];
                            const unit = team.unit === 'hours' ? 'h' : 'pts';
                            return `${item.dataset.label}: ${formatNumber(values[item.datasetIndex])} ${unit} (${item.formattedValue}%)`;
                        },
                        footer: () => `${elapsedPercent}% of the time has passed`,
                    },
                },
            },
            scales: {
                x: { stacked: true, min: 0, max: 100, ticks: { color: theme.muted, callback: (v) => `${v}%` }, grid: { color: theme.grid } },
                y: { stacked: true, ticks: { color: theme.text }, grid: { display: false } },
            },
        }),
        [teams, elapsedPercent, theme.muted, theme.text, theme.grid],
    );

    return (
        <div className="relative w-full" style={{ height: Math.max(140, teams.length * rowHeight + 70) }}>
            <Bar data={data} options={options} aria-label="Progress by team" role="img" />
        </div>
    );
}
