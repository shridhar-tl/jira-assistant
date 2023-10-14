import moment from 'moment';
import { plannerTaskPropertyName } from '../store/constants';
import { getResourceAvailability } from '../utils';
/* eslint-disable no-unused-vars */

export function getAllocationDetails(newState, allState) {
    const { sprintWiseIssues } = newState;
    const { resourceLeaveDays, resourceHolidays, settings: { workHours, workingDays } } = allState;

    const allocationData = {};

    Object.values(sprintWiseIssues).forEach(issues => issues.forEach(issue => {
        const { key, properties: { [plannerTaskPropertyName]: taskDetails } } = issue;

        if (!taskDetails?.length) {
            return;
        }

        taskDetails.forEach(task => {
            const { startDate, endDate, resources } = task;

            resources.forEach(({ id, unit = 100 }) => {
                let userWiseAllocation = allocationData[id];
                if (!userWiseAllocation) {
                    userWiseAllocation = {};
                    allocationData[id] = userWiseAllocation;
                }

                forEachDay(startDate, endDate, (curKey, date) => {
                    const hour = getAvailableHours(id, curKey, date, workHours, workingDays, resourceLeaveDays, resourceHolidays);
                    userWiseAllocation[curKey] = (userWiseAllocation[curKey] || 0) + (hour * unit / 100);
                });
            });
        });
    }));

    return allocationData;
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
