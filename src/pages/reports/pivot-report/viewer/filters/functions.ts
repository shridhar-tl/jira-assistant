import { endOfDay, startOfDay as startOfDayUtil } from 'date-fns';
import moment from 'moment';

import { getUserName } from '@/utils';

import { inject } from '@services';

import { getParameterFilterValue } from '../../store/report-parameters';
import type { ReportParameters } from '../../types';

export function currentUser() {
    const { $session } = inject('SessionService');
    const user = $session.CurrentUser?.jiraUser;
    return getUserName(user);
}

export function parameters(this: { parameters: ReportParameters }, paramName: string) {
    return toComparableCase(getParameterFilterValue(this.parameters[paramName.toLowerCase()]));
}

function toComparableCase(value: any): any {
    if (Array.isArray(value)) {
        return value.map(toComparableCase);
    }

    if (typeof value === 'string') {
        return value.toLowerCase();
    }

    return value;
}

export function as_date(value: any, format?: string) {
    return moment(value, format).valueOf();
}

export function today(value?: any) {
    return startOfDayUtil(new Date(now(value))).getTime();
}

export function todayEOD(value?: any) {
    return endOfDay(new Date(now(value))).getTime();
}

export function eod(value?: any) {
    return endOfDay(new Date(now(value))).getTime();
}

export function startOfDay(value?: any) {
    return startOfDayUtil(new Date(now(value))).getTime();
}

export function startDate(dateRange: { fromDate: any }) {
    return dateRange?.fromDate ? moment(dateRange.fromDate).startOf('day').valueOf() : null;
}

export function endDate(dateRange: { toDate: any }) {
    return dateRange?.toDate ? moment(dateRange.toDate).endOf('day').valueOf() : null;
}

export function now(value?: any) {
    const parsed = parseDateModifier(value);

    let date = moment();

    if (parsed) {
        date = date.add(parsed.amount, parsed.unit);
    }

    return date.valueOf();
}

export function date_diff(date1: any, date2: any, unit?: moment.unitOfTime.Diff) {
    return moment(date1).diff(date2, unit).valueOf();
}

function presentValues(values: unknown): unknown[] {
    return (Array.isArray(values) ? values : [values]).filter((v) => v !== null && v !== undefined && v !== '');
}

function numericValues(values: unknown): number[] {
    return presentValues(values)
        .map(Number)
        .filter((v) => !Number.isNaN(v));
}

export function sum(values: unknown) {
    return numericValues(values).reduce((total, v) => total + v, 0);
}

export function avg(values: unknown) {
    const numbers = numericValues(values);
    return numbers.length ? sum(numbers) / numbers.length : null;
}

export function min(values: unknown) {
    const numbers = numericValues(values);
    return numbers.length ? Math.min(...numbers) : null;
}

export function max(values: unknown) {
    const numbers = numericValues(values);
    return numbers.length ? Math.max(...numbers) : null;
}

export function first(values: unknown) {
    return presentValues(values)[0] ?? null;
}

export function last(values: unknown) {
    const present = presentValues(values);
    return present.length ? present[present.length - 1] : null;
}

function parseDateModifier(value?: number): { amount: number; unit: moment.unitOfTime.Diff } | null {
    if (!isNaN(value as any)) {
        return { amount: parseFloat(value as any), unit: 'days' };
    }

    const matches = /^([+-])(\d*)(y|Q|M|w|d|h|m)$/.exec(value as any);

    if (!matches) {
        return null;
    }

    const [, sign, amount, unit] = matches as any;

    return { amount: parseInt(sign + amount), unit };
}
