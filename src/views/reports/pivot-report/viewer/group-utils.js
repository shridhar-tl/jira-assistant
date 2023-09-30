import { getGroupByFunction } from './common-utils';

export function getIssuesGroupFunction(field) {
    if (field.schema?.derived) {
        return getIssuesDerivedFieldsGroupFunction(field);
    } else {
        return getIssuesNormalFieldGroupFunction(field);
    }
}

function getIssuesNormalFieldGroupFunction(row) {
    const groupByFn = getGroupByFunction(row);

    return (issues, callback) => issues
        .groupBy(groupByFn)
        .map(({ key, values }) => callback(values[0][row.key], values, key));
}

function getIssuesDerivedFieldsGroupFunction(row) {
    if (row.key.includes('.')) {
        const [path, field] = row.key.split('.');
        const groupByFn = getGroupByFunction({ key: field, schema: row.schema });

        return (issues, callback) => {
            const resultObj = {};

            for (const issue of issues) {
                const rootObj = issue[path];

                if (Array.isArray(rootObj)) {
                    rootObj.groupBy(groupByFn).forEach(({ key, values }) => {
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
                            values.forEach(val => groupedItems.push(val));
                        }
                    });
                } else {
                    // ToDo: Currently all grouped mappings are array only
                }
            }

            return Object.values(resultObj)
                .map(({ key, value, issuesMap }) => callback(value, Object.values(issuesMap), key));
        };
    } else {
        // ToDo:
    }
}