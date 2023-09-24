import moment from 'moment';
import { inject } from 'src/services';
import DayColumn from 'src/display-controls/DayColumn';

export function generateDateRangeColumns(column, headerOpts, issues, depth, hasSiblings, processColumns) {
    const { dateRange, rangeType = 'days', filterField, subItems } = column;

    const dates = getDateRange(dateRange.fromDate, dateRange.toDate);

    if (rangeType === 'days') {
        const weeks = getWeekHeader(dates);
        const { header } = headerOpts;
        const currentHeader = header[depth];
        const datesHeader = header[depth + 1];

        return [
            dates.length,
            weeks.map(w => {
                const weekHeader = {
                    headerText: w.display,
                    colGroup: true,
                    enableGrouping: true,
                    depth,
                    tagProps: { colSpan: 0 },
                    transformFn: getDateRangeGroupTransformFn(w, filterField)
                };

                currentHeader.push(weekHeader);

                weekHeader.subItems = w.values.map(value => {
                    const dayHeader = {
                        enableGrouping: true,
                        value,
                        depth: depth + 1,
                        tagProps: {},
                        transformFn: getDateRangeGroupTransformFn(getStartAndEndDateForSubGroup(value), filterField),
                        renderer: { Component: DayColumn }
                    };

                    datesHeader.push(dayHeader);

                    const [childCount, child] = processColumns(subItems, headerOpts, issues, depth + 1);

                    if (childCount) {
                        dayHeader.tagProps.colSpan = childCount;
                        weekHeader.tagProps.colSpan += childCount;
                    } else {
                        weekHeader.tagProps.colSpan += 1;
                    }

                    dayHeader.subItems = child;

                    return dayHeader;
                });

                return weekHeader;
            })
        ];
    }
}

function getStartAndEndDateForSubGroup({ date }) {
    date = moment(date);
    return {
        start: date.startOf('day').valueOf(),
        end: date.endOf('day').valueOf()
    };
}

function getDateRangeGroupTransformFn({ start, end }, filterField) {
    if (!filterField) {
        return;
    }

    if (filterField.includes('.')) {
        const [prop, fieldName] = filterField.split('.');

        return (issues) => issues.map(issue => {
            let obj = issue[prop];
            if (!obj) {
                return null;
            }

            if (Array.isArray(obj)) {
                obj = obj.filter(item => {
                    const fieldValue = item[fieldName];

                    if (!fieldValue) {
                        return false;
                    }

                    return moment(fieldValue).isBetween(start, end, undefined, '[]');
                });

                if (!obj.length) {
                    return null;
                }
            }

            return ({
                ...issue,
                [prop]: obj
            });
        }).filter(Boolean);
    } else {
        return (issues) => issues.filter(issue => {
            const fieldValue = issue[filterField];

            if (!fieldValue) {
                return false;
            }

            return moment(fieldValue).isBetween(start, end, undefined, '[]');
        });
    }
}

function getDateRange(fromDate, toDate) {
    const { $utils, $userutils } = inject('UtilsService', 'UserUtilsService');
    const datesArr = $utils.getDateArray(fromDate, toDate);

    const dates = datesArr.map(d => ({
        prop: d.format('yyyyMMdd'),
        date: d,
        dispFormat: d.format('MMM yyyy').toUpperCase(),
        month: d.getMonth(),
        week: moment(d).week(),
        dayOfWeek: moment(d).day(),
        day: d.format('DD').toUpperCase(),
        dateNum: d.getDate(),
        isHoliday: $userutils.isHoliday(d)
    }));

    return dates;
}

function getWeekHeader(dates) {
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