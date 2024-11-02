import moment from 'moment';
import { inject } from 'src/services';
import DayColumn from 'src/display-controls/DayColumn';
import { getDateRange, getWeekGroup } from 'src/utils/date';

export function generateDateRangeColumns(column, headerOpts, issues, depth, hasSiblings, processColumns) {
    const { dateRange, rangeType = 'days', filterField, showTotal, showTotalFirst, subItems } = column;

    const dates = getDateRangeArray(dateRange.fromDate, dateRange.toDate);

    const totalColumn = showTotal && {
        headerText: 'Total',
        colGroup: true,
        enableGrouping: true,
        depth,
        tagProps: { rowSpan: 2 },
        transformFn: getDateRangeGroupTransformFn({
            start: moment(dateRange.fromDate).startOf('day'),
            end: moment(dateRange.toDate).endOf('day')
        }, filterField)
    };

    if (rangeType === 'days') {
        const weeks = getWeekGroup(dates);
        const { header } = headerOpts;
        const currentHeader = header[depth];
        const datesHeader = header[depth + 1];

        if (totalColumn && showTotalFirst) {
            currentHeader.push(generateTotalColumn(totalColumn, headerOpts, subItems, depth + 1, issues, processColumns));
        }

        const groupHeaders = weeks.map(w => {
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
        });

        if (totalColumn && !showTotalFirst) {
            currentHeader.push(generateTotalColumn(totalColumn, headerOpts, subItems, depth + 1, issues, processColumns));
        }

        return [
            dates.length,
            groupHeaders
        ];
    }
}

function generateTotalColumn(totalColumn, headerOpts, subItems, depth, issues, processColumns) {
    const [childCount, child] = processColumns(subItems, headerOpts, issues, depth);

    if (childCount) {
        totalColumn.tagProps.colSpan = childCount;
    }

    totalColumn.subItems = child;

    return totalColumn;
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

function getDateRangeArray(fromDate, toDate) {
    const { $userutils } = inject('UserUtilsService');

    return getDateRange(fromDate, toDate, $userutils.isHoliday);
}
