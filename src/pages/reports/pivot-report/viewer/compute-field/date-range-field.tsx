import { endOfDay, isWithinInterval, startOfDay } from 'date-fns';

import { DayColumn } from '@/display-controls';

import { inject } from '@services';

import { getDateRange, getWeekGroup, type DateRangeItem, type WeekGroup as DateWeekGroup } from '@utils/date-utils';
import { convertToDate } from '@utils/helpers';

type Issue = Record<string, any>;
type TransformFn = ((issues: Issue[]) => Issue[]) | undefined;

interface DateInterval {
    start: Date | number;
    end: Date | number;
}

function isDateWithin(value: unknown, interval: DateInterval): boolean {
    const date = convertToDate(value);
    return !!date && isWithinInterval(date, interval);
}

interface RangeHeader {
    headerText?: string;
    value?: unknown;
    colGroup?: boolean;
    enableGrouping: boolean;
    depth: number;
    tagProps: { colSpan?: number; rowSpan?: number };
    transformFn: TransformFn;
    renderer?: { Component: typeof DayColumn };
    subItems?: unknown;
}

type WeekGroup = DateWeekGroup<DateRangeItem>;

export function generateDateRangeColumns(
    column: any,
    headerOpts: any,
    issues: any[],
    depth: number,
    hasSiblings: boolean,
    processColumns: any,
) {
    const { dateRange, rangeType = 'days', filterField, showTotal, showTotalFirst, subItems } = column;
    const { header } = headerOpts;
    const currentHeader: RangeHeader[] = header[depth];
    const subHeader: RangeHeader[] = header[depth + 1];

    const weeks = getWeekGroup(getDateRangeArray(dateRange.fromDate, dateRange.toDate));

    const addSubColumns = (parent: RangeHeader, items: unknown) => {
        const [childCount, child] = processColumns(items, headerOpts, issues, depth + 1);

        if (childCount) {
            parent.tagProps.colSpan = childCount;
        }
        parent.subItems = child;

        return childCount || 1;
    };

    let columnCount = 0;

    const totalColumn: RangeHeader | false = showTotal && {
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

    const addTotalColumn = () => {
        if (totalColumn) {
            columnCount += addSubColumns(totalColumn, subItems);
            currentHeader.push(totalColumn);
        }
    };

    if (showTotalFirst) {
        addTotalColumn();
    }

    const groupHeaders = (
        rangeType === 'week' ? getMonthGroups(weeks) : weeks.map((w) => ({ display: w.display, start: w.start, end: w.end, weeks: [w] }))
    ).map((group) => {
        const groupHeader: RangeHeader = {
            headerText: group.display,
            colGroup: true,
            enableGrouping: true,
            depth,
            tagProps: { colSpan: 0 },
            transformFn: getDateRangeGroupTransformFn(group, filterField),
        };

        currentHeader.push(groupHeader);

        const children = rangeType === 'week' ? group.weeks.map(createWeekHeader) : group.weeks[0].values.map(createDayHeader);

        groupHeader.subItems = children.map((child) => {
            subHeader.push(child);

            const count = addSubColumns(child, subItems);
            groupHeader.tagProps.colSpan! += count;
            columnCount += count;

            return child;
        });

        return groupHeader;
    });

    if (!showTotalFirst) {
        addTotalColumn();
    }

    function createDayHeader(value: DateRangeItem): RangeHeader {
        return {
            enableGrouping: true,
            value,
            depth: depth + 1,
            tagProps: {},
            transformFn: getDateRangeGroupTransformFn(getStartAndEndDateForSubGroup(value), filterField),
            renderer: { Component: DayColumn },
        };
    }

    function createWeekHeader(week: WeekGroup): RangeHeader {
        const first = week.values[0].dateNum;
        const last = week.values[week.values.length - 1].dateNum;

        return {
            headerText: first === last ? `W-${week.values[0].week} (${first})` : `W-${week.values[0].week} (${first} - ${last})`,
            colGroup: true,
            enableGrouping: true,
            depth: depth + 1,
            tagProps: {},
            transformFn: getDateRangeGroupTransformFn(week, filterField),
        };
    }

    return [columnCount, groupHeaders];
}

function getMonthGroups(weeks: WeekGroup[]) {
    const months: { display: string; start: number; end: number; weeks: WeekGroup[] }[] = [];

    weeks.forEach((week) => {
        const { dispFormat } = week.values[0];
        const lastMonth = months[months.length - 1];

        if (lastMonth?.display === dispFormat) {
            lastMonth.weeks.push(week);
            lastMonth.end = week.end;
        } else {
            months.push({ display: dispFormat, start: week.start, end: week.end, weeks: [week] });
        }
    });

    return months;
}

function getStartAndEndDateForSubGroup({ date }: { date: Date }): DateInterval {
    const d = new Date(date);
    return {
        start: startOfDay(d),
        end: endOfDay(d),
    };
}

function getDateRangeGroupTransformFn({ start, end }: DateInterval, filterField: string): TransformFn {
    if (!filterField) {
        return;
    }

    if (filterField.includes('.')) {
        const [prop, fieldName] = filterField.split('.');

        return (issues: Issue[]) =>
            issues
                .map((issue) => {
                    let obj = issue[prop];
                    if (!obj) {
                        return null;
                    }

                    if (Array.isArray(obj)) {
                        obj = obj.filter((item) => isDateWithin(item[fieldName], { start, end }));

                        if (!obj.length) {
                            return null;
                        }
                    }

                    return {
                        ...issue,
                        [prop]: obj,
                    };
                })
                .filter((issue): issue is Issue => !!issue);
    } else {
        return (issues: Issue[]) =>
            issues.filter((issue) => isDateWithin(issue[filterField], { start, end }));
    }
}

function getDateRangeArray(fromDate: Date, toDate: Date) {
    const { $userutils } = inject('UserUtilsService');

    return getDateRange(new Date(fromDate), new Date(toDate), $userutils.isHoliday);
}
