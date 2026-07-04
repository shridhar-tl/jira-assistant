import { getComponentFor, normalizeType } from '@/display-controls';
import { getPathValue } from '@/utils';

import { inject } from '@services';

import { valuePropsMap } from '../editor/controls/config/display-options/formatting';
import { getQueryInfo } from '../store/pivot-config';

export async function fetchData(scope: any) {
    const { jql, fields } = getQueryInfo(scope.fields);

    const { $jira } = inject('JiraService');
    const result = await $jira.searchTickets(jql, fields);

    return result.map(({ id, key, fields }: any) => normalizeArrays({ ...fields, id, issuekey: key }));
}

function normalizeArrays(fields: any) {
    if (fields.worklog) {
        fields.worklog = fields.worklog.worklogs;
    }

    if (fields.comment) {
        fields.comment = fields.comment.comments;
    }

    return fields;
}

export function getCellProps(cell: any) {
    const {
        schema: { type },
        format,
    } = cell;
    const renderer = getComponentFor(type);
    const props = format && valuePropsMap[format];

    if (props) {
        renderer.props = props;
    }

    return {
        renderer,
    };
}

export function getGroupByFunction(field: any) {
    const { keyField } = normalizeType(field);
    const { key } = field;

    if (!keyField) {
        return (issue: any) => issue[key];
    }

    if (typeof keyField === 'function') {
        return (issue: any) => keyField(issue[key]);
    } else if (keyField) {
        return (issue: any) => issue[key]?.[keyField as any];
    } else {
        return (issue: any) => issue[key];
    }
}

export function getIssueFilterFunction(field: any, groupKey: any) {
    const { keyField } = normalizeType(field);
    const { key } = field;

    return getIssueFieldComparer(key, keyField, groupKey);
}

function getKeyFieldValue(obj: any, keyField: any) {
    if (!keyField) {
        return obj;
    }

    if (typeof keyField === 'function') {
        return keyField(obj);
    } else if (typeof keyField === 'string') {
        return obj?.[keyField];
    } else {
        throw new Error(`Key field is of unknown type: ${typeof keyField}`);
    }
}

function getIssueFieldComparer(key: string, keyField: any, value: any) {
    const func = (issue: any) => getKeyFieldValue(getPathValue(issue, key), keyField) === value;

    // Need to be used only while debugging
    // func.comparisonKey = key;
    // func.comparisonValue = value;

    return func;
}

export function getGroupKeyComparer(value: any) {
    const func = (grp: any) => grp.key === value;

    return func;
}
