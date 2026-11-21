import { format } from 'date-fns';

import { inject } from '@services';

import type { JiraJqlField } from '@types';

import { isParameterOption, isUserGroup } from '../store/report-parameters';
import type { DateRangeSelection, ReportParameter, ReportParameterDefinition, ReportParameters } from '../types';

type RangeBound = 'start' | 'end';

export interface JqlParameterUsage {
    name: string;
    field: string;
    isArray: boolean;
    bound?: RangeBound;
    wrapInParens: boolean;
    start: number;
    end: number;
}

interface JqlParametersParseResult {
    usages: JqlParameterUsage[];
    errors: string[];
}

export interface JqlParametersResult {
    parameters: Record<string, ReportParameterDefinition>;
    errors: string[];
}

const parameterCallPattern = /\bparameters\s*\(\s*(['"])((?:(?!\1).)*)\1\s*\)/gi;
const boundFunctionPattern = /\b(startDate|endDate)\s*\(\s*$/i;
const closingParenPattern = /^\s*\)/;
const clauseOperatorPattern =
    /(?<![\w"\]])("(?:[^"\\]|\\.)+"|cf\[\d+\]|[a-z_][\w.]*)\s*(not\s+in|in|was\s+not\s+in|was\s+in|was\s+not|was|!=|>=|<=|!~|=|>|<|~)\s*(\(\s*)?$/i;
const listOperatorPattern = /\bin$/i;
const customFieldClausePattern = /^cf\[\d+\]$/i;
const sprintCustomType = 'com.pyxis.greenhopper.jira:gh-sprint';
const sprintJavaType = 'com.atlassian.greenhopper.service.sprint.Sprint';
const minParamNameLength = 3;
const maxParamNameLength = 25;
const dateTypes = ['date', 'datetime'];

const javaTypeMapping: Record<string, string> = {
    'com.atlassian.jira.project.Project': 'project',
    'com.atlassian.jira.user.ApplicationUser': 'user',
    'java.util.Date': 'date',
    'com.atlassian.jira.issue.status.Status': 'status',
    'com.atlassian.jira.issue.priority.Priority': 'priority',
    'com.atlassian.jira.issue.issuetype.IssueType': 'issuetype',
    'com.atlassian.jira.issue.resolution.Resolution': 'resolution',
    'java.lang.Number': 'number',
};

const boundProps: Record<RangeBound, keyof DateRangeSelection> = { start: 'fromDate', end: 'toDate' };

export function getParameterNames(text?: string): string[] {
    return text ? [...text.matchAll(new RegExp(parameterCallPattern.source, 'gi'))].map((m) => m[2].trim()).filter(Boolean) : [];
}

export function parseJqlParameters(jql: string): JqlParametersParseResult {
    const usages: JqlParameterUsage[] = [];
    const errors: string[] = [];

    for (const match of jql.matchAll(new RegExp(parameterCallPattern.source, 'gi'))) {
        const name = match[2].trim();
        const callStart = match.index ?? 0;
        let start = callStart;
        let end = callStart + match[0].length;
        let before = jql.substring(0, callStart);

        if (isWithinStringLiteral(before)) {
            continue;
        }

        const nameError = validateParameterName(name);
        if (nameError) {
            errors.push(nameError);
            continue;
        }

        const boundMatch = boundFunctionPattern.exec(before);
        let bound: RangeBound | undefined;

        if (boundMatch) {
            const closing = closingParenPattern.exec(jql.substring(end));
            if (!closing) {
                errors.push(`The function ${boundMatch[1]} used with parameter "${name}" in JQL is not closed`);
                continue;
            }

            bound = boundMatch[1].toLowerCase() === 'startdate' ? 'start' : 'end';
            start = boundMatch.index;
            end += closing[0].length;
            before = before.substring(0, boundMatch.index);
        }

        const clause = clauseOperatorPattern.exec(before);
        if (!clause) {
            errors.push(`Parameter "${name}" in JQL must be compared with a field. e.g. project in parameters('${name}')`);
            continue;
        }

        const [, fieldText, operator, openParen] = clause;
        const isArray = listOperatorPattern.test(operator.replace(/\s+/g, ' '));

        if (bound && isArray) {
            errors.push(`Parameter "${name}" in JQL can not be used with the operator "${operator}" when used with a date range function`);
            continue;
        }

        usages.push({ name, field: unquoteClause(fieldText), isArray, bound, wrapInParens: isArray && !openParen, start, end });
    }

    return { usages, errors };
}

export async function resolveJqlParameters(jql: string): Promise<JqlParametersResult> {
    const { usages, errors } = parseJqlParameters(jql);
    const parameters: Record<string, ReportParameterDefinition> = {};

    if (!usages.length) {
        return { parameters, errors };
    }

    const jqlFields = await getJqlFields();

    usages.forEach((usage) => {
        const definition = getParameterDefinition(usage, jqlFields);
        const key = usage.name.toLowerCase();
        const existing = parameters[key];

        if (existing && !areCompatibleParameters(existing, definition)) {
            errors.push(`Parameter "${usage.name}" is used across incompatible fields or operators in JQL`);
            return;
        }

        parameters[key] = existing || definition;
    });

    return { parameters, errors };
}

export function mergeParameterDefinitions(
    target: Record<string, ReportParameterDefinition>,
    source: Record<string, ReportParameterDefinition>,
    errors: string[],
) {
    Object.entries(source).forEach(([key, definition]) => {
        const existing = target[key];

        if (!existing) {
            target[key] = definition;
        } else if (!areCompatibleParameters(existing, definition)) {
            errors.push(`Parameter "${definition.name}" is used across incompatible types`);
        } else {
            target[key] = {
                ...existing,
                fieldKey: existing.fieldKey || definition.fieldKey,
                itemType: existing.itemType || definition.itemType,
                customType: existing.customType || definition.customType,
                jqlField: existing.jqlField || definition.jqlField,
            };
        }
    });
}

export function validateParameterName(name: string): string | undefined {
    if (name.length < minParamNameLength) {
        return `Parameter name "${name}" is too short`;
    }

    if (name.length > maxParamNameLength) {
        return `Parameter name "${name}" is too big`;
    }

    return undefined;
}

export function applyJqlParameters(jql: string, parameters: ReportParameters): string {
    const { usages } = parseJqlParameters(jql);

    if (!usages.length) {
        return jql;
    }

    let result = '';
    let position = 0;

    usages.forEach((usage) => {
        result += jql.substring(position, usage.start) + toJqlValue(usage, parameters[usage.name.toLowerCase()]);
        position = usage.end;
    });

    return result + jql.substring(position);
}

function toJqlValue({ isArray, bound, wrapInParens }: JqlParameterUsage, param?: ReportParameter): string {
    if (bound) {
        const date = (param?.value as DateRangeSelection | undefined)?.[boundProps[bound]];
        return date ? quote(format(new Date(date), 'yyyy-MM-dd')) : '""';
    }

    const values = getJqlValues(param);

    if (!isArray) {
        return values[0] ?? '""';
    }

    const list = values.join(', ');

    return wrapInParens ? `(${list})` : list;
}

function getJqlValues(param?: ReportParameter): string[] {
    const value = param?.value;

    if (value === undefined || value === null || value === '') {
        return [];
    }

    if (value instanceof Date) {
        return [quote(format(value, param?.type === 'datetime' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'))];
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return [String(value)];
    }

    if (typeof value === 'string') {
        return [toJqlLiteral(value, param)];
    }

    if (!Array.isArray(value)) {
        return [];
    }

    return (value as unknown[]).flatMap((item): string[] => {
        if (isUserGroup(item)) {
            return item.users.map((user) => user.accountId || user.name).filter((id): id is string => !!id).map(quote);
        }

        if (isParameterOption(item)) {
            return [typeof item.value === 'number' ? String(item.value) : toJqlLiteral(item.value, param)];
        }

        return typeof item === 'string' ? [toJqlLiteral(item, param)] : [];
    });
}

function toJqlLiteral(value: string, param?: ReportParameter) {
    const isNumber = param?.type === 'number' || param?.customType === sprintCustomType;

    return isNumber && /^-?\d+(\.\d+)?$/.test(value.trim()) ? value.trim() : quote(value);
}

function quote(value: string) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Text like summary ~ "parameters('x')" is a value searched for and not a parameter
 */
function isWithinStringLiteral(textBefore: string) {
    const quotes = textBefore.replace(/\\./g, '').match(/"/g);

    return !!quotes && quotes.length % 2 === 1;
}

function unquoteClause(text: string) {
    return text.startsWith('"') ? text.substring(1, text.length - 1).replace(/\\(.)/g, '$1') : text;
}

async function getJqlFields(): Promise<JiraJqlField[]> {
    const { $jira } = inject('JiraService');

    try {
        return (await $jira.getJQLAutocomplete())?.visibleFieldNames || [];
    } catch (err) {
        console.error('Unable to pull the JQL fields to identify the type of the report parameters', err);
        return [];
    }
}

function findJqlField(clause: string, jqlFields: JiraJqlField[]) {
    const name = clause.toLowerCase();

    return jqlFields.find(
        ({ value, displayName, cfid }) =>
            unquoteClause(value || '').toLowerCase() === name ||
            cfid?.toLowerCase() === name ||
            (!customFieldClausePattern.test(name) && displayName?.toLowerCase() === name),
    );
}

function getParameterDefinition(usage: JqlParameterUsage, jqlFields: JiraJqlField[]): ReportParameterDefinition {
    const { name, field, isArray, bound } = usage;

    if (bound) {
        return { name, type: 'daterange' };
    }

    const jqlField = findJqlField(field, jqlFields);
    const javaType = jqlField?.types?.find((t) => javaTypeMapping[t]) || jqlField?.types?.[0];
    const type = (javaType && javaTypeMapping[javaType]) || 'string';
    const suggestionClause = jqlField?.auto === 'true' ? jqlField.cfid || unquoteClause(jqlField.value) : undefined;

    return {
        name,
        type,
        isArray: isArray || undefined,
        jqlField: suggestionClause,
        customType: jqlField?.types?.includes(sprintJavaType) ? sprintCustomType : undefined,
    };
}

function normalizeType(type: string) {
    return dateTypes.includes(type) ? 'date' : type;
}

function areCompatibleParameters(a: ReportParameterDefinition, b: ReportParameterDefinition) {
    return normalizeType(a.type) === normalizeType(b.type) && !!a.isArray === !!b.isArray;
}
