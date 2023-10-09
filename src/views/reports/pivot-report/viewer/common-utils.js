import { getPathValue } from "react-controls/common/utils";
import { inject } from "../../../../services";
import { getQueryInfo } from "../store/pivot-config";
import { getComponentFor, normalizeType } from "src/display-controls";
import { valuePropsMap } from "../editor/controls/config/display-options/formatting";

export async function fetchData(scope) {
    const { jql, fields } = getQueryInfo(scope.fields);

    const { $jira } = inject('JiraService');
    const result = await $jira.searchTickets(jql, fields);

    return result.map(({ id, key, fields }) => normalizeArrays({ ...fields, id, issuekey: key }));
}

function normalizeArrays(fields) {
    if (fields.worklog) {
        fields.worklog = fields.worklog.worklogs;
    }

    if (fields.comment) {
        fields.comment = fields.comment.comments;
    }

    return fields;
}

export function getCellProps(cell) {
    const { schema: { type }, format } = cell;
    const renderer = getComponentFor(type);
    const props = format && valuePropsMap[format];

    if (props) {
        renderer.props = props;
    }

    return {
        renderer
    };
}

export function getGroupByFunction(field) {
    const { keyField } = normalizeType(field);
    const { key } = field;

    if (!keyField) {
        return (issue) => issue[key];
    }

    if (typeof keyField === 'function') {
        return (issue) => keyField(issue[key]);
    } else if (keyField) {
        return (issue) => issue[key]?.[keyField];
    } else {
        return (issue) => issue[key];
    }
}

export function getIssueFilterFunction(field, groupKey) {
    const { keyField } = normalizeType(field);
    const { key } = field;

    return getIssueFieldComparer(key, keyField, groupKey);
}

function getKeyFieldValue(obj, keyField) {
    if (!keyField) {
        return obj;
    }

    if (typeof keyField === 'function') {
        return keyField(obj);
    } else if (typeof keyField === 'string') {
        return obj?.[keyField];
    } else {
        throw new Error(`Key field is of unknown type: ${typeof (keyField)}`);
    }
}

function getIssueFieldComparer(key, keyField, value) {
    const func = issue => getKeyFieldValue(getPathValue(issue, key), keyField) === value;

    // ToDo: Need to be used only while debugging
    // func.comparisonKey = key;
    // func.comparisonValue = value;

    return func;
}

export function getGroupKeyComparer(value) {
    const func = grp => grp.key === value;

    // ToDo: Need to be used only while debugging
    // func.comparisonValue = value;

    return func;
}