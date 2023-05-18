import { inject } from "../../../../services/injector-service";
import moment from 'moment';

export async function getInitialPlaningData() {
    const { $jira } = inject('JiraService');
    const sprintBoards = await $jira.getRapidViews();
    return { sprintBoards };
}

export function getDaysListBasedOnSprints(sprints) {
    const groups = [];
    const days = [];

    const daysMap = { groups, days };

    for (let i = sprints.length - 1; i >= 0; i--) {
        const sprint = sprints[i];
        const { id, name, startDate, endDate } = sprint;
        const end = moment(endDate).endOf('day');
        let current = moment(startDate).startOf('day');
        let daysCount = 0;

        while (!current.isAfter(end)) {
            const key = current.format('YYYYMMDD');
            const date = current.date();
            const week = current.toDate().format('DD').toUpperCase();
            days.push({ key, date, week });
            daysCount++;
            current = current.add(1, 'day');
        }

        groups.push({ sprintId: id, name, daysCount });
    }

    return daysMap;
}