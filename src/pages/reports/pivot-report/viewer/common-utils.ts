import { getComponentFor, normalizeType } from '@/display-controls';
import { getPathValue } from '@/utils';

import { inject } from '@services';

import { valuePropsMap } from '../editor/controls/config/display-options/formatting';
import { getQueryFields } from '../store/pivot-config';
import type { PivotFieldConfig } from '../types';

type KeyField = string | string[] | ((value: unknown) => unknown) | undefined;
type FieldLike = Pick<PivotFieldConfig, 'key' | 'schema'>;

const groupKeyProps = ['accountId', 'id', 'key', 'name', 'value'];

export const noValueText = '(None)';

const aggregatedValueTypes: Record<string, string> = { count: 'number', merge: 'string' };

export async function fetchData(jql: string, scope: any) {
    const fields = getQueryFields(scope.fields);

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

/**
 * Returns the type used for rendering, formatting and aggregation. Time tracking fields are reported by Jira as number and are resolved to timespent.
 */
export function getFieldType(field: FieldLike): string | undefined {
    return normalizeType(field).type || field.schema?.type;
}

export function isArrayField(field: FieldLike): boolean {
    return !field.schema?.derived && field.schema?.type === 'array';
}

export function isEmptyValue(value: unknown): boolean {
    return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
}

/**
 * Converts the value of a field to a string which uniquely identifies it, so that the same value pulled as part of different issues falls in same group
 */
export function toGroupKey(value: unknown): string {
    if (isEmptyValue(value)) {
        return '';
    }

    if (typeof value !== 'object') {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map(toGroupKey).join('|');
    }

    const obj = value as Record<string, unknown>;
    const prop = groupKeyProps.find((p) => obj[p] !== undefined && obj[p] !== null);

    return prop ? String(obj[prop]) : JSON.stringify(value);
}

export function countValues(values: unknown[], distinct?: boolean) {
    const available = values.filter((v) => v || v === 0);

    return distinct ? new Set(available.map(toGroupKey)).size : available.length;
}

export function getCellProps(cell: any) {
    const { format, agrFunc, enableGrouping } = cell;
    const aggregatedType = !enableGrouping && agrFunc ? aggregatedValueTypes[agrFunc] : undefined;
    const renderer = getComponentFor(aggregatedType || getFieldType(cell) || '');
    const props = format && valuePropsMap[format];

    if (props) {
        renderer.props = props;
    }

    return {
        renderer,
    };
}

export function getGroupByFunction(field: FieldLike) {
    const { keyField } = normalizeType(field);
    const { key } = field;

    return (issue: Record<string, unknown>) => toGroupKey(getKeyFieldValue(issue[key], keyField));
}

export function getIssueFilterFunction(field: FieldLike, groupKey: string) {
    const { keyField } = normalizeType(field);
    const { key } = field;

    if (isArrayField(field)) {
        return (issue: Record<string, unknown>) => {
            const values = getPathValue(issue, key);
            const items = Array.isArray(values) && values.length ? values : [null];

            return items.some((item) => toGroupKey(item) === groupKey);
        };
    }

    return (issue: Record<string, unknown>) => toGroupKey(getKeyFieldValue(getPathValue(issue, key), keyField)) === groupKey;
}

function getKeyFieldValue(obj: unknown, keyField: KeyField): unknown {
    if (!keyField || obj === null || obj === undefined) {
        return obj;
    }

    if (typeof keyField === 'function') {
        return keyField(obj);
    } else if (typeof keyField === 'string') {
        return (obj as Record<string, unknown>)[keyField];
    } else {
        throw new Error(`Key field is of unknown type: ${typeof keyField}`);
    }
}

export function getGroupKeyComparer(value: string) {
    return (grp: { key: string }) => grp.key === value;
}
