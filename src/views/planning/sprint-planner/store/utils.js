import { inject } from "../../../../services/injector-service";
import moment from 'moment';
import { isWeekEndDay } from "../utils";

export async function getInitialPlaningData() {
    const { $jira } = inject('JiraService');
    const sprintBoards = await $jira.getRapidViews();
    return { sprintBoards };
}

export function getDaysListBasedOnSprints(sprints, workingDays) {
    const groups = [];
    const days = [];

    const daysMap = { groups, days };

    for (let i = 0; i < sprints.length; i++) {
        const sprint = sprints[i];
        const { id, name, startDate, endDate } = sprint;

        let $end = moment(endDate);
        if ($end.hours() < 13) { // This is to avoid days repeating in two sprints
            $end = $end.add(-1, 'day');
        }
        const end = $end.endOf('day');
        let current = moment(startDate).startOf('day');
        let daysCount = 0;
        let workingDaysCount = 0;

        while (!current.isAfter(end)) {
            const key = current.format('YYYYMMDD');
            const date = current.date();
            const week = current.toDate().format('DD').toUpperCase();
            const dateObj = current.toDate();
            const isWeekEnd = isWeekEndDay(dateObj, workingDays);
            days.push({ key, date, week, dateObj, isWeekEnd });
            daysCount++;
            if (!isWeekEnd) {
                workingDaysCount++;
            }
            current = current.add(1, 'day');
        }

        groups.push({ sprintId: id, name, daysCount, workingDaysCount });
    }

    return daysMap;
}

export async function getLeaveDetails({ leaveCalendar, holidayCalendar, startOfDay, endOfDay }, planStartDate, planEndDate) { //,workHours
    const leaveCalIds = leaveCalendar?.map(({ id }) => id) || [];
    const holidayCalIds = holidayCalendar?.map(({ id }) => id) || [];

    const allCalendarIds = [...leaveCalIds, ...holidayCalIds];

    if (!allCalendarIds.length) {
        return { resourceLeaveDays: {}, resourceHolidays: {} };
    }

    const { $wiki } = inject('ConfluenceService');

    const calendars = await $wiki.getCalendarEvents(allCalendarIds, planStartDate, planEndDate);

    const resourceLeaveDays = leaveCalIds.reduce(getLeavesObject(calendars, false, startOfDay, endOfDay), []);
    const resourceHolidays = holidayCalIds.reduce(getLeavesObject(calendars, true), []);

    return { resourceLeaveDays, resourceHolidays };
}

function getLeavesObject(calendars, isHoliday) {
    return (obj, calId) => {
        const events = calendars[calId];

        return events.reduce((evn, cur) => {
            const { allDay, start, end, invitees } = cur;
            const hours = 4;
            // ToDo: handle hours with start of day and end of day

            if (!isHoliday && !invitees?.length) {
                return evn; // ToDo: May be handle it as public leave if needed
            }

            let _start = moment(start).startOf('day');
            const _end = moment(end).endOf('day');

            const leaves = isHoliday ? evn : {};

            while (_start.isBefore(_end)) {
                const dayKey = _start.format('YYYYMMDD');

                if (allDay) {
                    leaves[dayKey] = { allDay };
                } else {
                    leaves[dayKey] = { hours };
                }

                _start = _start.add(1, 'day');
            }

            if (isHoliday) {
                return leaves; // In case of holiday, this would be list of all the holidays
            }

            const userIdProperty = 'id';

            return invitees.reduce((invt, usr) => {
                const userId = usr[userIdProperty];
                let userLeaves = invt[userId];

                if (!userLeaves) {
                    userLeaves = { ...leaves };
                } else {
                    userLeaves = { ...userLeaves, ...leaves };
                }

                invt[userId] = userLeaves;

                return invt;
            }, evn);
        }, obj);
    };
}