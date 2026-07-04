import { groupBy } from '@/utils/array-utils';

import { getGroupByFunction } from './common-utils';

export function getIssuesGroupFunction(field: any) {
    if (field.schema?.derived) {
        return getIssuesDerivedFieldsGroupFunction(field);
    } else {
        return getIssuesNormalFieldGroupFunction(field);
    }
}

function getIssuesNormalFieldGroupFunction(row: any) {
    const groupByFn = getGroupByFunction(row);

    return (issues: any[], callback: (value: any, values: any[], key: any) => any) => {
        const groups = groupBy(issues, groupByFn);
        return groups.map(({ key, values }) => callback(values[0][row.key], values, key));
    };
}

function getIssuesDerivedFieldsGroupFunction(row: any) {
    if (row.key.includes('.')) {
        const [path, field] = row.key.split('.');
        const groupByFn = getGroupByFunction({ key: field, schema: row.schema });

        return (issues: any[], callback: (value: any, values: any[], key: any) => any) => {
            const resultObj: Record<string, any> = {};

            for (const issue of issues) {
                const rootObj = issue[path];

                if (Array.isArray(rootObj)) {
                    const groups = groupBy(rootObj, groupByFn);
                    groups.forEach(({ key, values }) => {
                        let groupedObj = resultObj[key];

                        if (!groupedObj) {
                            groupedObj = { key, value: values[0][field], issuesMap: {} };
                            resultObj[key] = groupedObj;
                        }

                        let groupedIssue = groupedObj.issuesMap[issue.issuekey];
                        if (!groupedIssue) {
                            groupedIssue = { ...issue, [path]: values };
                            groupedObj.issuesMap[issue.issuekey] = groupedIssue;
                        } else {
                            const groupedItems = groupedIssue[path];
                            values.forEach((val: any) => groupedItems.push(val));
                        }
                    });
                } else {
                    // ToDo: Currently all grouped mappings are array only
                }
            }

            return Object.values(resultObj).map(({ key, value, issuesMap }) => callback(value, Object.values(issuesMap), key));
        };
    } else {
        // ToDo:
    }
}
