export const publicHolidayKey = '--PUBLIC--';

export function calculateSprintWiseLeaves(resources, resourceLeaveDays, resourceHolidays, groups, days) {
    const result = {};
    let curDate = 0;

    groups.forEach(sprint => {
        const sprintInfo = {};
        result[sprint.sprintId] = sprintInfo;

        const endDay = curDate + sprint.daysCount;
        const daysInSprint = days.slice(curDate, endDay).map(d => d.key);
        curDate = endDay;

        sprintInfo[publicHolidayKey] = daysInSprint.sum(key => resourceHolidays[key]);

        resources.forEach(user => {
            const leavePlans = resourceLeaveDays[user.accountId];

            if (!leavePlans) {
                sprintInfo[user.accountId] = 0;
            } else {
                sprintInfo[user.accountId] = daysInSprint.sum(key => {
                    const plan = leavePlans[key];
                    if (!plan) {
                        return 0;
                    }

                    return plan.allDay ? 1 : .5;
                });
            }
        });
    });

    return result;
}
