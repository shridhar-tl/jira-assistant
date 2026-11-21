import type { DatasourceConfigureRequest } from '@components/report-builder';

import type { SelectedIssueField } from '../../config/jira-fields';

const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function getNameError(name: string, request: DatasourceConfigureRequest): string | null {
    if (!identifierPattern.test(name)) return 'Enter a name using letters, digits and underscores, starting with a letter.';
    const taken = request.datasources.some((d) => d.id !== request.datasource.id && d.name.toLowerCase() === name.toLowerCase());
    return taken ? 'Another datasource already uses this name.' : null;
}

export function getDialogTitle(request: DatasourceConfigureRequest, noun: string): string {
    return request.mode === 'create' ? `Add ${noun}` : `Configure ${noun}`;
}

export function getApplyLabel(request: DatasourceConfigureRequest): string {
    return request.mode === 'create' ? 'Add datasource' : 'Apply';
}

export function getFieldAliasError(fields: SelectedIssueField[]): string | null {
    const seen = new Set<string>(['key', 'id']);
    for (const f of fields) {
        if (!identifierPattern.test(f.alias))
            return `"${f.alias || f.name}" is not a valid field name. Use letters, digits and underscores, starting with a letter.`;
        if (seen.has(f.alias)) return `The field name "${f.alias}" is used more than once.`;
        seen.add(f.alias);
    }
    return null;
}
