import { validateFilterText } from '../editor/controls/config/filter-options/validators';
import { usePivotConfig, useReportData } from '../store/pivot-config';
import { useFieldsList } from '../utils/fields';

export function isReportDefinitionValid() {
    const { jql, fields } = usePivotConfig.getState();
    const reportErrors: string[] = [];

    if (!jql?.trim()) {
        reportErrors.push('JQL is required to pull issues from Jira');
    }

    if (!fields?.length) {
        reportErrors.push('No fields selected to generate report');
    }

    const { fieldsMap } = useFieldsList.getState();
    const scope = {
        fieldsMap,
        fields: {},
        parameters: {},
    };

    fields.forEach((f, i) => validateField(f, i, 0, reportErrors, scope));

    if (!reportErrors.length) {
        return scope;
    }

    useReportData.setState({ reportErrors, isFetching: false, showParameters: false }, true);
}

function validateField(field: any, index: number, depth: number, reportErrors: string[], scope: any) {
    validateProps(field, index, depth, reportErrors, scope, field.colGroup);
}

function validateProps(field: any, index: number, depth: number, reportErrors: string[], scope: any, isColGroup?: boolean, path = '') {
    validateCommonProps(field, index, depth, reportErrors, scope, path);

    if (isColGroup) {
        validateColumn(field, index, depth, reportErrors, scope, path);
    } else {
        validateRowField(field, index, depth, reportErrors);
    }
}

function validateCommonProps(field: any, index: number, depth: number, reportErrors: string[], scope: any, path: string) {
    const { name, filter } = field;

    if (filter?.trim()) {
        const { isValid, errorMessage } = validateFilterText(filter, scope);
        if (!isValid) {
            reportErrors.push(`Field ${path}"${name}" at position ${index + 1} has error in filter query: (${errorMessage})`);
        }
    }
}

const invalidFieldsForRow = ['dateRange'];
function validateRowField(field: any, index: number, depth: number, reportErrors: string[]) {
    const { id, name } = field;

    if (invalidFieldsForRow.includes(id)) {
        reportErrors.push(
            `Field "${name}" at position ${index + 1} is currently not supported to be used as rows. Convert it to column group instead`,
        );
    }
}

// ToDo: Scope was not passed in old project. Newly passed here. need to validate to check if this causes issue
function validateColumn(field: any, index: number, depth: number, reportErrors: string[], scope: any, path = '') {
    const { name, subItems, enableGrouping } = field;
    const isGrouped = enableGrouping || !depth;

    if (isGrouped) {
        if (!subItems?.length) {
            reportErrors.push(
                `Grouping is enabled for field ${path}"${name}" at position ${index + 1}, but do not contain row values. Drag and drop the field(s) to be shown as value under "${name}"`,
            );
        }

        subItems?.forEach((f: any, i: number) =>
            validateProps(f, i, depth + 1, reportErrors, scope, true, `${path}"${name}" (Position: ${index}) -> `),
        );
    }
}
