import { groupBy } from '@/utils/array-utils';

import type { PivotFieldConfig } from '../types';

import { getGroupByFunction, isArrayField, isEmptyValue, toGroupKey } from './common-utils';

type Issue = Record<string, unknown>;
type GroupField = Pick<PivotFieldConfig, 'key' | 'schema'>;
type GroupCallback<T> = (value: unknown, issues: Issue[], key: string) => T;

interface ValueGroup {
    value: unknown;
    issues: Issue[];
}

export function getIssuesGroupFunction(field: GroupField) {
    if (field.schema?.derived) {
        return getIssuesDerivedFieldsGroupFunction(field);
    } else if (isArrayField(field)) {
        return getIssuesArrayFieldGroupFunction(field);
    } else {
        return getIssuesNormalFieldGroupFunction(field);
    }
}

function getIssuesNormalFieldGroupFunction(row: GroupField) {
    const groupByFn = getGroupByFunction(row);

    return <T>(issues: Issue[], callback: GroupCallback<T>) => {
        const groups = groupBy(issues, groupByFn);
        return groups.map(({ key, values }) => callback(values[0][row.key], values, key));
    };
}

/**
 * Issues having multiple values in an array field (like labels, components, sprints) are made part of group of every value
 */
function getIssuesArrayFieldGroupFunction(row: GroupField) {
    const { key } = row;

    return <T>(issues: Issue[], callback: GroupCallback<T>) => {
        const groups = new Map<string, ValueGroup>();

        for (const issue of issues) {
            const fieldValue = issue[key];
            const values: unknown[] = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
            if (!values.length) {
                values.push(null);
            }
            const addedKeys = new Set<string>();

            for (const value of values) {
                const groupKey = toGroupKey(value);
                if (addedKeys.has(groupKey)) {
                    continue;
                }
                addedKeys.add(groupKey);

                let group = groups.get(groupKey);
                if (!group) {
                    group = { value: isEmptyValue(value) ? null : [value], issues: [] };
                    groups.set(groupKey, group);
                }
                group.issues.push(issue);
            }
        }

        return [...groups.entries()].map(([groupKey, { value, issues }]) => callback(value, issues, groupKey));
    };
}

function getIssuesDerivedFieldsGroupFunction(row: GroupField) {
    if (!row.key.includes('.')) {
        return getIssuesNormalFieldGroupFunction(row);
    }

    const [path, field] = row.key.split('.');
    const groupByFn = getGroupByFunction({ key: field, schema: row.schema });

    return <T>(issues: Issue[], callback: GroupCallback<T>) => {
        const resultObj = new Map<string, { value: unknown; issuesMap: Map<string, Issue> }>();

        for (const issue of issues) {
            const rootObj = issue[path];
            const items: Issue[] = Array.isArray(rootObj) ? rootObj : rootObj ? [rootObj] : [];

            groupBy(items, groupByFn).forEach(({ key, values }) => {
                let groupedObj = resultObj.get(key);

                if (!groupedObj) {
                    groupedObj = { value: values[0][field], issuesMap: new Map() };
                    resultObj.set(key, groupedObj);
                }

                const issueKey = String(issue.issuekey);
                const groupedIssue = groupedObj.issuesMap.get(issueKey);
                if (!groupedIssue) {
                    groupedObj.issuesMap.set(issueKey, { ...issue, [path]: values });
                } else {
                    (groupedIssue[path] as Issue[]).push(...values);
                }
            });
        }

        return [...resultObj.entries()].map(([key, { value, issuesMap }]) => callback(value, [...issuesMap.values()], key));
    };
}
