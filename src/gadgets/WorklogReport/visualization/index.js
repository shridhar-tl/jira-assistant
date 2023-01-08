import React, { useCallback, useEffect, useState } from "react";
import { Chart } from 'primereact/chart';
import { Carousel } from 'primereact/carousel';
import { connect } from "../datastore";
import { inject } from "../../../services/injector-service";
import './Style.scss';

const Visualization = function ({ flatData, groupField, isSprint, reportUserGrp }) {
    const [groupedData, setGroupedData] = useState(false);
    useEffect(() => {
        setGroupedData(flatData.groupBy(d => d[groupField]));
    }, [flatData, groupField, setGroupedData]);

    if (!groupedData) {
        return (<span>Loading</span>);
    }

    return (<div className="worklog-visualization-tab">
        {groupedData.length > 1 && <GroupWiseCharts title={isSprint ? "All Sprints" : "All Groups"} data={flatData} />}
        {groupedData.map(g => <GroupWiseCharts key={g.key} title={g.key} data={g.values} reportUserGrp={reportUserGrp} />)}
    </div>);
};

function mapStateToProps(state, { boardId }) {
    const isSprint = state.timeframeType === '1';
    const { [isSprint ? `flatWorklogs_${boardId}` : 'flatWorklogs']: flatData, reportUserGrp } = state;

    return { isSprint, flatData, groupField: isSprint ? 'sprintName' : 'groupName', reportUserGrp };
}

export default connect(Visualization, mapStateToProps);

const GroupWiseCharts = function ({ title, data, reportUserGrp }) {
    const charts = [];

    if (reportUserGrp !== '4') {
        charts.push({ title: 'Epic Wise', groupField: 'epicDisplay', legendTitle: 'Epic summary', data });
    }
    if (reportUserGrp !== '2') {
        charts.push({ title: 'Project Wise', groupField: 'projectName', legendTitle: 'Projects', data });
    }
    if (reportUserGrp !== '3') {
        charts.push({ title: 'Issuetype Wise', groupField: 'issueType', legendTitle: 'Issue types', data });
    }
    charts.push({ title: "Status Wise", groupField: "statusName", legendTitle: "Statuses", data });

    const template = useCallback((prop) => (<CategorizedPieChart {...prop} />), []);

    return (<div className="group-wise-charts">
        <Carousel header={<h3>{title}</h3>} value={charts} itemTemplate={template} />
    </div>);
};

function getChartOptions(groupedData, { title, legendTitle, totalTSDisplay }) {
    return {
        maintainAspectRatio: false,
        layout: { autoPadding: false },
        plugins: {
            legend: {
                labels: {
                    boxWidth: 20,
                    color: '#495057'
                },
                title: {
                    text: legendTitle,
                    display: true
                },
                position: 'right'
            },
            title: {
                display: true,
                text: title,
                align: 'center',
                font: { size: '16px', weight: 'bold' }
            },
            tooltip: {
                mode: 'index',
                intersect: true,
                filter: (a) => !!a.raw,
                callbacks: {
                    label: ({ dataIndex }) => {
                        const { display, perc } = groupedData[dataIndex];
                        return `Timespent: ${display} (${perc}%)`;
                    },
                    footer: () => `Total: ${totalTSDisplay}`
                }
            },
        }
    };
}

function CategorizedPieChart({ title, legendTitle, groupField, data }) {
    const [dataSource, setData] = useState(false);

    useEffect(() => {
        const { $utils } = inject('UtilsService');
        const totalTimeSpent = data.sum('timeSpent');

        const groupedData = data.groupBy(d => d[groupField] || '(Unavailable)')
            .map(({ key, values }) => {
                const total = values.sum('timeSpent');
                const display = $utils.formatSecs(total);
                const perc = parseFloat(((total * 100) / totalTimeSpent).toFixed(2));

                return { label: key, total, display, perc };
            });


        const chartData = {
            labels: groupedData.map(({ label }) => label),
            datasets: [
                {
                    data: groupedData.map(({ total }) => total)
                }
            ]
        };

        setData({
            chartData, chartOptions: getChartOptions(groupedData, {
                title,
                legendTitle,
                totalTimeSpent,
                totalTSDisplay: $utils.formatSecs(totalTimeSpent)
            })
        });
    }, [data, groupField, title, legendTitle, setData]);

    if (!dataSource) {
        return (<span>Loading</span>);
    }

    return (<div className="chart-container" >
        <Chart type="pie" data={dataSource.chartData} options={dataSource.chartOptions} />
    </div >);
}