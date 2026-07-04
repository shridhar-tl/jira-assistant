import { endOfDay, isWithinInterval, startOfDay } from 'date-fns';

import { DayColumn } from '@/display-controls';

import { inject } from '@services';

import { getDateRange, getWeekGroup } from '@utils/date-utils';

export function generateDateRangeColumns(
    column: any,
    headerOpts: any,
    issues: any[],
    depth: number,
    hasSiblings: boolean,
    processColumns: any,
) {
    const { dateRange, rangeType = 'days', filterField, showTotal, showTotalFirst, subItems } = column;

    const dates = getDateRangeArray(dateRange.fromDate, dateRange.toDate);

    const totalColumn: any = showTotal && {
        headerText: 'Total',
        colGroup: true,
        enableGrouping: true,
        depth,
        tagProps: { rowSpan: 2 },
        transformFn: getDateRangeGroupTransformFn(
            {
                start: startOfDay(new Date(dateRange.fromDate)),
                end: endOfDay(new Date(dateRange.toDate)),
            },
            filterField,
        ),
    };

    if (rangeType === 'days') {
        const weeks = getWeekGroup(dates);
        const { header } = headerOpts;
        const currentHeader = header[depth];
        const datesHeader = header[depth + 1];

        if (totalColumn && showTotalFirst) {
            currentHeader.push(generateTotalColumn(totalColumn, headerOpts, subItems, depth + 1, issues, processColumns));
        }

        const groupHeaders = weeks.map((w) => {
            const weekHeader: any = {
                headerText: w.display,
                colGroup: true,
                enableGrouping: true,
                depth,
                tagProps: { colSpan: 0 },
                transformFn: getDateRangeGroupTransformFn(w, filterField),
                subItems: [],
            };

            currentHeader.push(weekHeader);

            weekHeader.subItems = w.values.map((value: any) => {
                const dayHeader: any = {
                    enableGrouping: true,
                    value,
                    depth: depth + 1,
                    tagProps: {},
                    transformFn: getDateRangeGroupTransformFn(getStartAndEndDateForSubGroup(value), filterField),
                    renderer: { Component: DayColumn },
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

        return [dates.length, groupHeaders];
    }
}

function generateTotalColumn(totalColumn: any, headerOpts: any, subItems: any[], depth: number, issues: any[], processColumns: any) {
    const [childCount, child] = processColumns(subItems, headerOpts, issues, depth);

    if (childCount) {
        totalColumn.tagProps.colSpan = childCount;
    }

    totalColumn.subItems = child;

    return totalColumn;
}

function getStartAndEndDateForSubGroup({ date }: any) {
    const d = new Date(date);
    return {
        start: startOfDay(d),
        end: endOfDay(d),
    };
}

function getDateRangeGroupTransformFn({ start, end }: any, filterField: string) {
    if (!filterField) {
        return;
    }

    if (filterField.includes('.')) {
        const [prop, fieldName] = filterField.split('.');

        return (issues: any[]) =>
            issues
                .map((issue) => {
                    let obj = issue[prop];
                    if (!obj) {
                        return null;
                    }

                    if (Array.isArray(obj)) {
                        obj = obj.filter((item) => {
                            const fieldValue = item[fieldName];

                            if (!fieldValue) {
                                return false;
                            }

                            return isWithinInterval(new Date(fieldValue), { start, end });
                        });

                        if (!obj.length) {
                            return null;
                        }
                    }

                    return {
                        ...issue,
                        [prop]: obj,
                    };
                })
                .filter(Boolean);
    } else {
        return (issues: any[]) =>
            issues.filter((issue) => {
                const fieldValue = issue[filterField];

                if (!fieldValue) {
                    return false;
                }

                return isWithinInterval(new Date(fieldValue), { start, end });
            });
    }
}

function getDateRangeArray(fromDate: Date, toDate: Date) {
    const { $userutils } = inject('UserUtilsService');

    return getDateRange(fromDate, toDate, $userutils.isHoliday);
}
