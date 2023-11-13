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