import moment from "moment";

export function getDateArray(startDate, endDate) {
    const retVal = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        retVal.push(new Date(current));
        current = current.addDays(1);
    }
    return retVal;
}

export function getDateRange(fromDate, toDate, isHoliday) {
    const datesArr = getDateArray(fromDate, toDate);

    const dates = datesArr.map(d => ({
        prop: d.format('yyyyMMdd'),
        date: d,
        dispFormat: d.format('MMM yyyy').toUpperCase(),
        month: d.getMonth(),
        week: moment(d).week(),
        dayOfWeek: moment(d).day(),
        day: d.format('DD').toUpperCase(),
        dateNum: d.getDate(),
        isHoliday: isHoliday(d)
    }));

    return dates;
}

export function getWeekGroup(dates) {
    return dates.groupBy(d => (`${d.month}_${d.week}`)).map(({ values }) => {
        const days = values.length;
        let display = '';

        const { 0: start, [days - 1]: end } = values;

        const { week, dispFormat, dateNum: first, date: startDate } = start;
        const { dateNum: last, date: endDate } = end;

        if (days > 4) {
            display = `${dispFormat}, ${first} to ${last} (W-${week})`;
        } else if (days > 3) {
            display = `${dispFormat}, ${first}-${last}`;
        } else if (days > 2) {
            display = `${dispFormat.split(' ')[0]} (W-${week})`;
        } else {
            display = dispFormat.split(' ')[0];
        }

        return {
            display, days, values,
            start: moment(startDate).startOf('day').valueOf(),
            end: moment(endDate).endOf('day').valueOf()
        };
    });
}

/**
 * Calculates the precise number of working days between two dates.
 *
 * @param {moment.Moment} fromDate - The start date.
 * @param {moment.Moment} toDate - The end date.
 * @param {number[]} [workingDays=[]] - Array of working days (0 = Sunday, ..., 6 = Saturday).
 * @returns {number} - The precise number of working days.
 */
export function getDaysDiffForDateRange(fromDate, toDate, workingDays) {
    fromDate = moment(fromDate);

    if (!workingDays?.length) {
        return fromDate.diff(toDate, 'days', true) || 0;
    }

    toDate = moment(toDate);

    // If workingDays is empty, consider all days as working days
    const allWorking = workingDays.length === 0;

    // If fromDate is after toDate, swap them
    if (fromDate.isAfter(toDate)) {
        [fromDate, toDate] = [toDate, fromDate];
    }

    // If both dates are the same day
    if (fromDate.isSame(toDate, 'day')) {
        if (allWorking || workingDays.includes(fromDate.day())) {
            return toDate.diff(fromDate, 'days', true) || 0;
        } else {
            return 0;
        }
    }

    let totalDays = 0;

    // Clone dates to avoid mutating the originals
    let current = fromDate.clone();

    // First day (from fromDate to end of the day)
    if (allWorking || workingDays.includes(current.day())) {
        const endOfDay = current.clone().endOf('day');
        const diff = endOfDay.diff(current, 'days', true);
        totalDays += diff;
    }

    // Move to the start of the next day
    current = current.add(1, 'day').startOf('day');

    // Iterate through full days
    while (current.isBefore(toDate, 'day')) {
        if (allWorking || workingDays.includes(current.day())) {
            totalDays += 1;
        }
        current = current.add(1, 'day');
    }

    // Last day (from start of the day to toDate)
    if (current.isSame(toDate, 'day')) {
        if (allWorking || workingDays.includes(current.day())) {
            const startOfDay = current.clone().startOf('day');
            const diff = toDate.diff(startOfDay, 'milliseconds') / (1000 * 60 * 60 * 24);
            totalDays += diff;
        }
    }

    return totalDays || 0;
}