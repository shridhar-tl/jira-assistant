import { useCallback, useMemo } from 'react';

import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';

import Carousel from '../../../components/Carousel';
import { inject } from '../../../services/injector';
import { connect } from '../datastore';
import './Style.css';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const CHART_COLORS = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
    '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
    '#6e40c9', '#1e7fcb', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

interface VisualizationProps {
    exportSheetName: string;
    boardId?: string;
    flatData: any[];
    groupField: string;
    isSprint: boolean;
    reportUserGrp: string;
}

function Visualization({ flatData, groupField, isSprint, reportUserGrp }: VisualizationProps) {
    const groupedData = useMemo(
        () => (flatData ? (flatData.groupBy((d: any) => d[groupField]) as Array<{ key: string; values: any[] }>) : null),
        [flatData, groupField],
    );

    if (!groupedData) {
        return <span>Loading</span>;
    }

    return (
        <div className="worklog-visualization-tab">
            {groupedData.length > 1 && (
                <GroupWiseCharts title={isSprint ? 'All Sprints' : 'All Groups'} data={flatData} />
            )}
            {groupedData.map((g) => (
                <GroupWiseCharts key={g.key} title={g.key} data={g.values} reportUserGrp={reportUserGrp} />
            ))}
        </div>
    );
}

function mapStateToProps(state: any, { boardId }: { boardId?: string }) {
    const isSprint = state.timeframeType === '1';
    const flatData = isSprint ? state[`flatWorklogs_${boardId}`] : state.flatWorklogs;
    const { reportUserGrp } = state;
    return { isSprint, flatData, groupField: isSprint ? 'sprintName' : 'groupName', reportUserGrp };
}

export default connect(Visualization, mapStateToProps);

interface GroupWiseChartsProps {
    title: string;
    data: any[];
    reportUserGrp?: string;
}

interface ChartConfig {
    title: string;
    groupField: string;
    legendTitle: string;
    data: any[];
}

function GroupWiseCharts({ title, data, reportUserGrp }: GroupWiseChartsProps) {
    const charts: ChartConfig[] = [];

    if (reportUserGrp !== '4') {
        charts.push({ title: 'Epic Wise', groupField: 'epicDisplay', legendTitle: 'Epic summary', data });
    }
    if (reportUserGrp !== '2') {
        charts.push({ title: 'Project Wise', groupField: 'projectName', legendTitle: 'Projects', data });
    }
    if (reportUserGrp !== '3') {
        charts.push({ title: 'Issue Type Wise', groupField: 'issueType', legendTitle: 'Issue types', data });
    }
    charts.push({ title: 'Status Wise', groupField: 'statusName', legendTitle: 'Statuses', data });

    const template = useCallback((prop: ChartConfig) => <CategorizedPieChart {...prop} />, []);

    return (
        <div className="group-wise-charts">
            <div className="group-chart-header">
                <h3>{title}</h3>
                <span className="chart-count">{charts.length} charts</span>
            </div>
            <Carousel value={charts} itemTemplate={template} />
        </div>
    );
}

interface GroupedDataItem {
    label: string;
    total: number;
    display: string;
    percentage: number;
}

function getChartOptions(
    groupedData: GroupedDataItem[],
    {
        title,
        legendTitle,
        totalTSDisplay,
    }: { title: string; legendTitle: string; totalTSDisplay: string },
) {
    return {
        maintainAspectRatio: false,
        layout: { autoPadding: false, padding: 10 },
        plugins: {
            legend: {
                labels: {
                    boxWidth: 14,
                    boxHeight: 14,
                    padding: 12,
                    font: { size: 12 },
                    color: '#64748b',
                },
                title: {
                    text: legendTitle,
                    display: true,
                    font: { size: 12, weight: 'bold' as const },
                    color: '#475569',
                },
                position: 'right' as const,
            },
            title: {
                display: true,
                text: title,
                align: 'center' as const,
                font: { size: 15, weight: 'bold' as const },
                color: '#1e293b',
                padding: { bottom: 12 },
            },
            tooltip: {
                mode: 'index' as const,
                intersect: true,
                filter: (a: any) => !!a.raw,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                padding: 10,
                callbacks: {
                    label: ({ dataIndex }: any) => {
                        const { display, percentage } = groupedData[dataIndex];
                        return `  Time spent: ${display} (${percentage}%)`;
                    },
                    footer: () => `Total: ${totalTSDisplay}`,
                },
            },
        },
    };
}

function buildChartData(data: any[], groupField: string, title: string, legendTitle: string) {
    const { $utils } = inject('UtilsService');
    const totalTimeSpent = data.reduce((sum: number, d: any) => sum + (d.timeSpent || 0), 0);

    const grouped = data.groupBy((d: any) => d[groupField] || '(Unavailable)') as Array<{
        key: string;
        values: any[];
    }>;

    const groupedData: GroupedDataItem[] = grouped.map(({ key, values }) => {
        const total = values.reduce((sum: number, v: any) => sum + (v.timeSpent || 0), 0);
        const display = $utils.formatSecs(total);
        const percentage = parseFloat(((total * 100) / totalTimeSpent).toFixed(2));
        return { label: key, total, display, percentage };
    });

    const chartData = {
        labels: groupedData.map(({ label }) => label),
        datasets: [
            {
                data: groupedData.map(({ total }) => total),
                backgroundColor: CHART_COLORS.slice(0, groupedData.length),
                borderColor: CHART_COLORS.slice(0, groupedData.length).map((c) => c + 'cc'),
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const chartOptions = getChartOptions(groupedData, {
        title,
        legendTitle,
        totalTSDisplay: $utils.formatSecs(totalTimeSpent),
    });

    return { chartData, chartOptions };
}

function CategorizedPieChart({ title, legendTitle, groupField, data }: ChartConfig) {
    const dataSource = useMemo(
        () => buildChartData(data, groupField, title, legendTitle),
        [data, groupField, title, legendTitle],
    );

    return (
        <div className="chart-container">
            <Pie data={dataSource.chartData} options={dataSource.chartOptions} />
        </div>
    );
}
