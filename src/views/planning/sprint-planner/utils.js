import { DefaultWorkingDays } from "../../../constants/settings";

export function getResourceAvailability(dayKey, date, workHours, workingDays, leaveDays, resourceHolidays) {
    if (isHoliday(date, workingDays)) {
        return 0;
    }

    const leave = leaveDays?.[dayKey];
    const holiday = resourceHolidays[dayKey];
    let hour = workHours;
    if (leave?.allDay) {
        hour = 0;
    }
    else if (leave?.hour > 0) {
        hour -= leave?.hour;
    }

    if (hour > 0 && holiday) {
        if (holiday.allDay) {
            hour = 0;
        }
        else if (holiday.hour > 0) {
            hour -= holiday.hour;
        }
    }

    if (hour < 0) {
        hour = 0;
    }

    return hour;
}

export function isHoliday(date, workingDays) {
    const weekDay = date.getDay();
    workingDays = workingDays || DefaultWorkingDays;

    return workingDays.indexOf(weekDay) === -1;
}