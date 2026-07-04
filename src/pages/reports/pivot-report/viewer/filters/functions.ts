import { endOfDay, startOfDay as startOfDayUtil } from 'date-fns';
import moment from 'moment';

import { getUserName } from '@/utils';

import { inject } from '@services';

export function currentUser() {
    const { $session } = inject('SessionService');
    const user = $session.CurrentUser?.jiraUser;
    return getUserName(user);
}

export function parameters(this: any, paramName: string) {
    return toComparableCase(this.parameters[paramName.toLowerCase()]?.value);
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

export function sum(_values: any[]) {
    return 0;
}

export function avg(_values: any[]) {
    return 0;
}

export function min(_values: any[]) {
    return 0;
}

export function max(_values: any[]) {
    return 0;
}

export function first(_values: any[]) {
    return null;
}

export function last(_values: any[]) {
    return null;
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
