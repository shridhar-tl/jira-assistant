import { useEffect, useState } from 'react';

import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip, type ChartOptions } from 'chart.js';
import { format } from 'date-fns';
import { Bar } from 'react-chartjs-2';

import { getRandomColor, prepareDateRange } from '../../../jcloud/utils';
import { inject } from '../../../services';
import { groupBy } from '../../../utils/array-utils';
import './Styles.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DateRange {
    fromDate?: Date | string;
    toDate?: Date | string;
}

interface GadgetSettings {
    dateRange?: DateRange;
}

interface GadgetProps {
    lastUpdated?: Date;
    setLoader?: (loading: boolean) => void;
    settings: GadgetSettings;
}

interface WorklogEntry {
    ticketNo: string;
    dateStarted: Date | string;
    totalMins: number;
}

interface ChartDataset {
    label: string;
    backgroundColor: string;
    data: number[];
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    borderSkipped?: boolean;
}

interface ChartData {
    labels: (string | number)[];
    datasets: ChartDataset[];
}

function WorklogBarChart({ lastUpdated, setLoader, settings: { dateRange } }: GadgetProps) {
    const [data, setData] = useState<ChartData | null>(null);
    const [options, setOptions] = useState<ChartOptions<'bar'> | null>(null);

    useEffect(() => {
        if (dateRange?.fromDate) {
            setLoader?.(true);
            const preparedRange = prepareDateRange(dateRange as { fromDate: string | Date; toDate: string | Date });
            getWorklogChartData(preparedRange)
                .then((result) => {
                    if (result) {
                        setData(result.data);
                        setOptions(result.options);
                    } else {
                        setData(null);
                        setOptions(null);
                    }
                })
                .finally(() => setLoader?.(false));
        }
    }, [dateRange, lastUpdated]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!dateRange?.fromDate) {
        return (
            <div className="flex items-center justify-center h-full py-10 px-4">
                <div className="text-center text-[--text-secondary]">
                    <i className="fa fa-bar-chart text-4xl mb-3 opacity-30 block" />
                    <p className="text-base font-medium">Date range not configured</p>
                    <p className="text-sm mt-1 opacity-75">Configure a date range to visualize worklog data</p>
                </div>
            </div>
        );
    }

    if (!data || !data.datasets.length) {
        return (
            <div className="flex items-center justify-center h-full py-10 px-4">
                <div className="text-center text-[--text-secondary]">
                    <i className="fa fa-bar-chart text-4xl mb-3 opacity-30 block" />
                    <p className="text-base font-medium">No worklog data available</p>
                    <p className="text-sm mt-1 opacity-75">No worklogs found for the selected date range</p>
                </div>
            </div>
        );
    }

    return (
        <div className="worklog-bar-chart-gadget">
            <Bar data={data} options={options!} />
        </div>
    );
}

async function getWorklogChartData(dateRange: {
    fromDate: Date;
    toDate: Date;
}): Promise<{ data: ChartData; options: ChartOptions<'bar'> } | null> {
    const { fromDate, toDate } = dateRange;
    const { $utils } = inject('UtilsService');

    const datasets = await getWorklogDataset(dateRange);
    if (!datasets || !datasets.length) {
        return null;
    }

    const datesArr: Date[] = $utils.getDateArray(fromDate, toDate);

    const isSameMonth = datesArr[0].getMonth() === datesArr[datesArr.length - 1].getMonth();
    const labels: (string | number)[] = datesArr.map((d, i) => {
        if (isSameMonth) {
            return d.getDate();
        }
        return i === 0 || d.getDate() === 1 ? format(d, 'MMM d') : d.getDate();
    });

    return {
        data: { labels, datasets },
        options: getChartOptions(datesArr),
    };
}

function getChartOptions(dates: Date[]): ChartOptions<'bar'> {
    const { $userutils } = inject('UserUtilsService');

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 400,
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: true,
                filter: (item) => !!item.raw,
                callbacks: {
                    title(items) {
                        const index = items[0].parsed.x!;
                        return $userutils.formatDate(dates[index]);
                    },
                    footer(items) {
                        const total = items.reduce((sum, item) => sum + (item.raw as number), 0);
                        return `Total: ${total.toFixed(2)} hours`;
                    },
                },
            },
            legend: {
                position: 'bottom',
                labels: {
                    color: '#6c757d',
                    boxWidth: 14,
                    padding: 16,
                    font: { size: 12 },
                },
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: '#6c757d', font: { size: 11 } },
                grid: { color: 'rgba(0,0,0,0.06)' },
                title: { display: true, text: 'Date', color: '#6c757d', font: { size: 12 } },
            },
            y: {
                stacked: true,
                ticks: { color: '#6c757d', font: { size: 11 } },
                grid: { color: 'rgba(0,0,0,0.06)' },
                title: { display: true, text: 'Hours spent', color: '#6c757d', font: { size: 12 } },
            },
        },
    };
}

async function getWorklogDataset(range: { fromDate: Date; toDate: Date }): Promise<ChartDataset[] | null> {
    const { $worklog } = inject('WorklogService');

    const worklogs: WorklogEntry[] = await $worklog.getWorklogs(range);

    if (!worklogs.length) {
        return null;
    }

    const { fromDate } = range;
    const startTime = fromDate.getTime();

    const grouped = groupBy(worklogs, (w) => w.ticketNo);

    const datasets: ChartDataset[] = grouped.map(({ key, values }) => {
        const dataArr: number[] = [];
        values.forEach((cur) => {
            const dateStarted = cur.dateStarted instanceof Date ? cur.dateStarted : new Date(cur.dateStarted);
            const msPerDay = 24 * 60 * 60 * 1000;
            const days = Math.round(Math.abs(dateStarted.getTime() - startTime) / msPerDay);
            dataArr[days] = (dataArr[days] || 0) + cur.totalMins;
        });

        const color = getRandomColor();
        return {
            label: key,
            backgroundColor: color + 'cc',
            borderColor: color,
            borderWidth: 1,
            borderRadius: 3,
            borderSkipped: false,
            data: dataArr.map((m) => (m ? parseFloat((m / 60).toFixed(2)) : 0)),
        };
    });

    return datasets;
}

export default WorklogBarChart;
