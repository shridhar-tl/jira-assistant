import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Chart } from 'primereact/chart';
import { inject } from '../../../services';
import { getRandomColor, prepareDateRange } from '../../../jcloud/utils';
import './Styles.scss';

function Gadget({ lastUpdated, setLoader, settings: { dateRange } }) {
    const [data, setData] = useState();

    useEffect(() => {
        if (dateRange?.fromDate) {
            setLoader?.(true);
            getWorklogChartData(prepareDateRange(dateRange)).then(setData).finally(() => setLoader?.(false));
        }
    }, [dateRange, lastUpdated, setData, setLoader]);

    if (!dateRange?.fromDate) {
        return (<div className="pad-15">Date range is not configured. Configure date range to visualize data</div>);
    }

    if (!data) {
        return (<div className="pad-15">No worklog data available for the selected date range</div>);
    }

    return (<div className="worklog-bar-chart-gadget">
        <Chart type="bar" data={data.data} options={data.options} />
    </div>);
}

async function getWorklogChartData(dateRange) {
    const { fromDate, toDate } = dateRange;
    const { $utils } = inject('UtilsService');

    const datasets = await getWorklogDataset(dateRange);
    if (!datasets) { return false; }

    const datesArr = $utils.getDateArray(fromDate, toDate);

    const isSameMonth = datesArr[0].getMonth() === datesArr[datesArr.length - 1].getMonth();
    const labels = datesArr.map(isSameMonth
        ? (d) => d.getDate()
        : (d, i) => (i === 0 || d.getDate() === 1 ? d.format('MMM dd') : d.getDate())
    );

    return {
        data: { labels, datasets },
        options: getChartOptions(datesArr)
    };
}

function getChartOptions(dates) {
    const { $userutils } = inject('UserUtils');
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: true,
                filter: (a) => !!a.raw,
                callbacks: {
                    title: function (arr) {
                        const index = arr[0].parsed.x;
                        const date = dates[index];
                        return $userutils.formatDate(date);
                    },
                    footer: (logs) => `Total: ${logs.map(({ raw }) => raw).sum()} hours`
                }
            },
            legend: {
                title: { text: 'Issues', fontColor: 'red' },
                position: 'bottom',
                labels: { color: '#495057' }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: '#495057' },
                grid: { color: '#ebedef' },
                label: { display: true, text: 'Hours spent' }
            },
            y: {
                stacked: true,
                ticks: { color: '#495057' },
                grid: { color: '#ebedef' },
                label: { display: true, text: 'Hours spent' }
            }
        }
    };
}

async function getWorklogDataset(range) {
    const { $worklog } = inject('WorklogService');

    const worklogs = await $worklog.getWorklogs(range);

    if (!worklogs.length) {
        return;
    }

    const { fromDate } = range;
    const start = moment(fromDate);
    const groupedData = worklogs.groupBy(w => w.ticketNo).map(({ key, values }) => {
        const data = values.reduce((all, cur) => {
            const days = Math.abs(start.diff(cur.dateStarted, 'days'));
            all[days] = (all[days] || 0) + cur.totalMins;
            return all;
        }, []).map(m => (m ? m / 60 : 0));

        return { label: key, backgroundColor: getRandomColor(), data };
    });

    return groupedData;
}

export default Gadget;

