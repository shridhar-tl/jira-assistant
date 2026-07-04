import React, { useCallback, useRef } from 'react';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';

import { chartOptions as defaultChartOptions } from './chart-config';
import type { ChartState } from './types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartPanelProps {
    chartData: ChartState;
    chartWidth: number;
}

export default function ChartPanel({ chartData, chartWidth }: ChartPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const resizeChart = useCallback(
        (direction: number) => {
            if (!containerRef.current) return;
            const canvasContainer = containerRef.current.querySelector('.chart-canvas-container') as HTMLDivElement;
            if (!canvasContainer) return;

            const step = direction * 100;
            let curWidth = parseInt(canvasContainer.style.width?.replace('px', '') || '0');

            if (!(curWidth > 0)) {
                curWidth = 500;
            } else if (curWidth > chartWidth) {
                curWidth = chartWidth;
            }

            curWidth = curWidth + step;
            canvasContainer.style.width = `${curWidth}px`;
        },
        [chartWidth],
    );

    if (!chartData.datasets?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-secondary">
                <i className="fa fa-bar-chart text-5xl mb-4 opacity-20" />
                <p className="text-lg font-medium">No chart data available</p>
                <p className="text-sm mt-1">Configure the settings and click "Generate Report" to view the chart.</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full group p-4">
            <div
                className="absolute top-6 left-6 z-10 flex items-center gap-0 rounded-lg
                bg-gray-900/70 dark:bg-gray-700/80 backdrop-blur-sm shadow-lg
                opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
                <button
                    type="button"
                    onClick={() => resizeChart(-1)}
                    className="flex items-center justify-center w-9 h-9 cursor-pointer text-white/80 hover:text-white
                        hover:bg-white/10 rounded-l-lg transition-colors"
                    title="Decrease the width of the chart"
                >
                    <i className="fa fa-search-minus text-sm" />
                </button>
                <div className="w-px h-5 bg-white/20" />
                <button
                    type="button"
                    onClick={() => resizeChart(1)}
                    className="flex items-center justify-center w-9 h-9 cursor-pointer text-white/80 hover:text-white
                        hover:bg-white/10 rounded-r-lg transition-colors"
                    title="Increase the width of the chart"
                >
                    <i className="fa fa-search-plus text-sm" />
                </button>
            </div>

            <div className="w-full overflow-x-auto overflow-y-hidden rounded-lg border border-(--border-color) bg-(--bg-primary)">
                <div className="chart-canvas-container min-w-full" style={{ height: 'calc(100vh - 200px)' }}>
                    <Bar data={chartData as any} options={defaultChartOptions as ChartOptions<'bar'>} />
                </div>
            </div>
        </div>
    );
}
