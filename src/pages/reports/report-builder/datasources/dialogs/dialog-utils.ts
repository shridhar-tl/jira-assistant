import { validateExpression, type DatasourceConfigureRequest } from '@components/report-builder';

import type { SelectedIssueField } from '../../config/jira-fields';

const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
const templatePattern = /\{\{([\s\S]*?)\}\}/g;

export function getExpressionError(value: string, emptyMessage: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return emptyMessage;
    const [first] = validateExpression(trimmed);
    return first ? `Invalid expression: ${first.message}` : null;
}

/** Checks the {{ expression }} placeholders of a JQL template. */
export function getTemplateError(template: string | undefined): string | null {
    if (!template) return null;
    const opens = template.split('{{').length - 1;
    const closes = template.split('}}').length - 1;
    if (opens !== closes) return 'Every {{ must be closed with }}.';
    for (const match of template.matchAll(templatePattern)) {
        const expression = match[1].trim();
        if (!expression) return 'A {{ }} placeholder is empty.';
        const [first] = validateExpression(expression);
        if (first) return `Invalid placeholder {{ ${expression} }}: ${first.message}`;
    }
    return null;
}

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
