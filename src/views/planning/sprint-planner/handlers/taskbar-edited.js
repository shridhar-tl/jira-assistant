/* eslint-disable no-loop-func */
import moment from "moment";
import { getResourceAvailability } from "../utils";

export function updateTaskbar(event, { planData, resourceLeaveDays, resourceHolidays, settings: { workHours, workingDays } }) {
    const { modifiedTaskData } = event;
    const treeCount = modifiedTaskData?.length || 0;
    if (treeCount < 2) {
        return;
    }

    console.log(event);

    const [statusRow, ticketRow] = modifiedTaskData;
    const { id: issueKey } = ticketRow;
    const { id: statusId, startDate, endDate, progress, resources } = statusRow;

    planData = { ...planData };
    planData[issueKey] = planData[issueKey] ? { ...planData[issueKey] } : {};
    const issueData = planData[issueKey];
    issueData[statusId] = {
        startDate, endDate,
        progress,
        resources: resources?.map(({ id, unit }) => ({ id, unit }))
    };

    const allocationData = getResourceAllocationDetails(planData, workHours, workingDays, resourceLeaveDays, resourceHolidays);

    return { planData, allocationData };
}

function getResourceAllocationDetails(planData, workHours, workingDays, resourceLeaveDays, resourceHolidays) {
    return Object.keys(planData).reduce((data, issueKey) => {
        const issueData = planData[issueKey];

        return Object.keys(issueData).reduce((statusData, statusId) => {
            const { startDate, endDate, resources } = issueData[statusId]; //progress,

            if (!resources?.length) {
                return statusData;
            }

            for (const { id: resId, unit, start = startDate, end = endDate } of resources) {
                const resourceData = statusData[resId] || {};
                statusData[resId] = resourceData;

                forEachDay(start, end, (curKey, date) => {
                    const hour = getAvailableHours(resId, curKey, date, workHours, workingDays, resourceLeaveDays, resourceHolidays);
                    resourceData[curKey] = (resourceData[curKey] || 0) + (hour * unit / 100);
                });
            }

            return statusData;
        }, data);
    }, {});
}

function forEachDay(start, end, exec) {
    start = moment(start).startOf('day');
    end = moment(end).endOf('day');

    const daysCount = end.diff(start, 'days') + 1;

    for (let i = 0; i < daysCount; i++) {
        exec(start.format('YYYYMMDD'), start, i);
        start = start.add(1, 'day');
    }
}

function getAvailableHours(accountId, dayKey, $date, workHours, workingDays, resourceLeaveDays, resourceHolidays) {
    const leaveDays = resourceLeaveDays[accountId];

    return getResourceAvailability(dayKey, $date.toDate(), workHours, workingDays, leaveDays, resourceHolidays);
}
