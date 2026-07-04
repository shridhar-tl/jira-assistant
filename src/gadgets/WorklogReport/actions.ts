import { isToday } from 'date-fns';

import { getComponentFor } from '../../display-controls';
import { inject } from '../../services/injector';

import { getSettingsObj, getSprintsList } from './datastore';
import { generateRangeReport } from './range-report';
import { generateSprintReport } from './sprint-report';

export function setStateValue(setState: any) {
    return function (value: any) {
        setState(value);
    };
}

export function getSettingsToStore(_: any, getState: any) {
    return function (opts?: any) {
        return getSettingsObj(getState(), opts);
    };
}

export function fillSprintList(setState: any, getState: any) {
    return function () {
        setState(getSprintsList(getState()));
    };
}

export function groupsChanged(setState: any) {
    return function (userGroups: any[]) {
        if (userGroups && Array.isArray(userGroups)) {
            setState({ userGroups });
        }
    };
}

export function addWorklog(setState: any) {
    const {
        $session: {
            CurrentUser: { maxHours },
            UserSettings: { startOfDay },
        },
    } = inject('SessionService');
    const maxSecsPerDay = (maxHours || 8) * 60 * 60;

    return function (user: any, ticketNo: string, dateStarted: Date, logged: number) {
        let timeSpent: any = (maxSecsPerDay || 0) - (logged || 0);
        if (timeSpent < 60) {
            timeSpent = '01:00';
        }

        let logDate = dateStarted;
        if (isToday(dateStarted instanceof Date ? dateStarted : new Date(dateStarted))) {
            logDate = new Date();
        } else if (startOfDay) {
            logDate = new Date(dateStarted);
            const [hours, minutes] = startOfDay.split(':').map(Number);
            logDate.setHours(hours, minutes);
        }

        setState({ showWorklogPopup: true, worklogItem: { ticketNo, dateStarted: logDate, timeSpent } });
    };
}

export function worklogAdded(setState: any) {
    return function () {
        setState({ showWorklogPopup: false, worklogItem: null });
    };
}

export function hideWorklog(setState: any) {
    return function () {
        setState({ showWorklogPopup: false, worklogItem: null });
    };
}

export function fetchData(setState: any, getState: any) {
    return async function () {
        const { timeframeType } = getState();
        if (timeframeType === '1') {
            await generateSprintReport(setState, getState)();
        } else {
            await generateRangeReport(setState, getState)();
        }
    };
}

export function convertSecs(_: any, getState: any) {
    const { $utils } = inject('UtilsService');

    return (val: number) => {
        if (!val && val !== 0) {
            return val;
        }

        return $utils.convertSecs(val, { format: getState('logFormat') === '1' });
    };
}

export function flatGridSettingsChanged(setState: any) {
    return function (flatTableSettings: any) {
        setState({ flatTableSettings });
    };
}

const nativeTypes = ['date', 'datetime', 'string', 'number'];
const ignoredTypes = ['project', 'issuetype', 'parent', 'status', 'assignee', 'reporter', 'comment'];

export function getColumnSettings(_: any, getState: any) {
    const formatSecs = convertSecs(_, getState);
    const { $userutils } = inject('UserUtilsService');
    const { formatDateTime, formatDate } = $userutils;
    const typeBasedProps: any = {
        datetime: { format: (val: any) => formatDateTime(val) },
        date: { format: (val: any) => formatDate(val) },
    };

    return function (formatTicket: any) {
        const { userListMode, timeframeType, fields: { optional = [] } = {} } = getState();
        const includeGroup = userListMode === '2';
        const includeSprint = timeframeType === '1';
        const timeFormat = getState('logFormat') === '1' ? 'string' : 'number';

        const addlCols = optional.map((f: any) => {
            if (ignoredTypes.includes(f.key) || f.type === 'timespent') {
                return null;
            }

            const field: any = { field: `fields.${f.key}`, displayText: f.name, type: f.type, ...typeBasedProps[f.type] };

            if (nativeTypes.includes(f.type)) {
                return field;
            }

            const { Component, props } = getComponentFor(f.type);
            field.viewComponent = Component;
            field.props = props;

            return field;
        });

        return [
            includeGroup && { field: 'groupName', displayText: 'Group Name', type: 'string' },
            includeSprint && { field: 'sprintName', displayText: 'Sprint Name', type: 'string' },
            { field: 'projectName', displayText: 'Project Name', type: 'string' },
            { field: 'issueType', displayText: 'Issue Type', type: 'string' },
            {
                field: 'epicDisplay',
                displayText: 'Epic',
                type: 'string',
                format: (text: string, row: any) => formatTicket(text, row.epicUrl),
            },
            {
                field: 'parent',
                displayText: 'Parent',
                type: 'string',
                format: (text: string, row: any) => formatTicket(text, row.parentUrl),
            },
            {
                field: 'ticketNo',
                displayText: 'Ticket No',
                type: 'string',
                format: (text: string, row: any) => formatTicket(text, row.ticketUrl),
            },
            { field: 'statusName', displayText: 'Status', type: 'string' },
            { field: 'summary', displayText: 'Summary', type: 'string' },
            { field: 'logTime', displayText: 'Log Date & Time', type: 'datetime', format: (val: any) => formatDateTime(val) },
            { field: 'logCreated', displayText: 'Worklog Created', type: 'datetime', format: (val: any) => formatDateTime(val) },
            { field: 'logUpdated', displayText: 'Worklog Updated', type: 'datetime', format: (val: any) => formatDateTime(val) },
            { field: 'userDisplay', displayText: 'Log user', type: 'string' },
            { field: 'assignee', displayText: 'Assignee', type: 'string' },
            { field: 'reporter', displayText: 'Reporter', type: 'string' },
            { field: 'timeSpent', displayText: 'Hr. Spent', type: timeFormat, format: formatSecs },
            { field: 'originalestimate', displayText: 'Ori. Estm.', type: timeFormat, format: formatSecs },
            { field: 'totalLogged', displayText: 'Total Worklogs', type: timeFormat, format: formatSecs },
            { field: 'remainingestimate', displayText: 'Rem. Estm.', type: timeFormat, format: formatSecs },
            {
                field: 'estVariance',
                displayText: 'Estm. Variance',
                type: 'string',
                format: (value: number) => (value > 0 ? '+' : '') + formatSecs(value),
            },
            { field: 'comment', displayText: 'Comment' },
            { field: 'fields.project.key', displayText: 'Project Name test', type: 'string' },
            ...addlCols,
        ].filter(Boolean);
    };
}
