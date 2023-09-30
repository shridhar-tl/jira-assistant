import moment from "moment";
import { getUserName } from "src/common/utils";
import { inject } from "src/services";

export function currentUser() {
    const { $session } = inject('SessionService');
    return getUserName($session.CurrentUser?.jiraUser);
}

export function parameters(paramName) {
    return this.parameters[paramName.toLowerCase()];
}

export function as_date(value, format) {
    return moment(value, format).valueOf();
}

export function today(value) {
    return moment(now(value)).startOf('day').valueOf();
}

export function todayEOD(value) {
    return moment(now(value)).endOf('day').valueOf();
}

export function now(value) {
    value = parseDateModifier(value);

    let date = moment();

    if (value) {
        date = date.add(value.amount, value.unit);
    }

    return date.valueOf();
}

export function date_diff(date1, date2, unit) {
    moment(date1).diff(date2, unit).valueOf();
}

//#region Aggregation functions

export function sum(values) {
    return 0;
}

export function avg(values) {
    return 0;
}
export function min(values) {
    return 0;
}

export function max(values) {
    return 0;
}

export function first(values) {
    return null;
}

export function last(values) {
    return null;
}

//#endregion

function parseDateModifier(value) {
    if (!isNaN(value)) {
        return { amount: parseFloat(value), unit: 'days' };
    }
    const matches = new RegExp('^([+-])(\\d*)(y|Q|M|w|d|h|m)$', "g").exec(value);

    if (!matches) {
        return null;
    }

    const [, sign, amount, unit] = matches;

    return { amount: parseInt(sign + amount), unit };
}