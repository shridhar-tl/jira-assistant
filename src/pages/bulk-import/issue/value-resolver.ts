import { format, isValid, parse } from 'date-fns';

import type { JiraUser } from '@services/jira-service';

import type { JiraAllowedValue, JiraFieldMeta, JiraSprintRef } from '@types';

import type { JiraLookup } from './jira-lookup';
import { getAllowedValueText, getAvatarUrl } from './jira-values';
import type { DisplayItem, FieldKind } from './types';

export interface ResolveEnv {
    lookup: JiraLookup;
    dateFormats: string[];
    dateTimeFormats: string[];
    formatDate: (date: Date) => string;
    formatDateTime: (date: Date) => string;
}

export interface ResolvedValue {
    display: DisplayItem[];
    payload?: unknown;
    error?: string;
    warning?: string;
}

export const issueKeyRegex = /^[A-Z][A-Z0-9_]*-\d+$/;

const maxSingleLineLength = 255;
const maxTextLength = 32767;
const estimateRegex = /^(\d+(\.\d+)?\s*[wdhm]\s*)+$/i;
const numberOnlyRegex = /^\d+(\.\d+)?$/;
const cascadeSeparator = /\s*(?:->|>)\s*/;
const allowedUrlProtocols = ['http:', 'https:', 'ftp:', 'mailto:', 'file:'];
const isoDateFormats = [
    'yyyy-MM-dd',
    'yyyy/MM/dd',
    'dd-MMM-yyyy',
    'dd/MMM/yy',
    'dd/MMM/yyyy',
    'dd MMM yyyy',
    'MMM d, yyyy',
    'MMMM d, yyyy',
];
const isoDateTimeFormats = [
    "yyyy-MM-dd'T'HH:mm:ss.SSSxx",
    "yyyy-MM-dd'T'HH:mm:ssxxx",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm",
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm',
    'yyyy-MM-dd hh:mm a',
    'dd/MMM/yy hh:mm a',
    'dd/MMM/yy HH:mm',
];

function invalid(error: string, input: string): ResolvedValue {
    return { display: [{ text: input }], error };
}

function normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function splitMultiValue(input: string, allowedValues?: JiraAllowedValue[]): string[] {
    let parts: string[];
    if (/[;\n]/.test(input)) {
        parts = input.split(/[;\n]/);
    } else if (input.includes(',') && !(allowedValues && findAllowedValue(input, allowedValues))) {
        parts = input.split(',');
    } else {
        parts = [input];
    }
    return [...new Set(parts.map((p) => p.trim()).filter(Boolean))];
}

export function findAllowedValue(input: string, allowedValues: JiraAllowedValue[]): JiraAllowedValue | undefined {
    const text = input.trim();
    const normalized = normalizeText(text);

    return (
        allowedValues.find((v) => v.id === text) ||
        allowedValues.find((v) => [v.name, v.value, v.key].some((s) => s !== undefined && normalizeText(s) === normalized))
    );
}

function allowedValuePayload(value: JiraAllowedValue): Record<string, string> {
    if (value.id) {
        return { id: value.id };
    }
    if (value.key) {
        return { key: value.key };
    }
    return value.name ? { name: value.name } : { value: value.value || '' };
}

function getAllowedValueError(value: JiraAllowedValue): string | undefined {
    if (value.disabled) {
        return `"${getAllowedValueText(value)}" is disabled in Jira`;
    }
    if (value.archived) {
        return `"${getAllowedValueText(value)}" is archived in Jira`;
    }
    return undefined;
}

function listAllowedValues(allowedValues: JiraAllowedValue[]): string {
    const names = allowedValues.filter((v) => !v.disabled && !v.archived).map(getAllowedValueText);
    const preview = names.slice(0, 10).join(', ');
    return names.length > 10 ? `${preview} and ${names.length - 10} more` : preview;
}

function resolveAllowedValue(
    input: string,
    meta: JiraFieldMeta | undefined,
): { item?: DisplayItem; payload?: unknown; error?: string; warning?: string } {
    const allowedValues = meta?.allowedValues;

    if (!allowedValues) {
        // Allowed values are not available when the field is not on the screen. Value is sent as is and Jira validates it.
        const payload = /^\d+$/.test(input)
            ? { id: input }
            : meta?.schema.type === 'option' || meta?.schema.items === 'option'
              ? { value: input }
              : { name: input };
        return { item: { text: input }, payload, warning: 'Could not be verified before import. Jira validates the value during import.' };
    }

    const match = findAllowedValue(input, allowedValues);
    if (!match) {
        return { item: { text: input }, error: `"${input}" is not a valid value. Allowed values: ${listAllowedValues(allowedValues)}` };
    }

    return {
        item: { text: getAllowedValueText(match), avatarUrl: getAvatarUrl(match) },
        payload: allowedValuePayload(match),
        error: getAllowedValueError(match),
    };
}

function parseDate(input: string, formats: string[]): Date | undefined {
    const referenceDate = new Date();
    for (const fmt of formats) {
        const date = parse(input, fmt, referenceDate);
        if (isValid(date)) {
            return date;
        }
    }
    return undefined;
}

function getUserMatchText(user: JiraUser & { key?: string }): string[] {
    return [user.accountId, user.name, user.key, user.emailAddress, user.displayName]
        .filter((v): v is string => !!v)
        .map((v) => v.toLowerCase());
}

function getUserPayload(user: JiraUser): Record<string, string> {
    // Jira Cloud identifies users by accountId, whereas Jira Data Center / Server identifies users by username
    return user.accountId ? { accountId: user.accountId } : { name: user.name || '' };
}

async function resolveUser(
    input: string,
    env: ResolveEnv,
): Promise<{ item: DisplayItem; payload?: unknown; error?: string; warning?: string }> {
    const users = await env.lookup.findUsers(input);
    const normalized = input.toLowerCase();
    const exactMatches = users.filter((u) => getUserMatchText(u).includes(normalized));

    let user: JiraUser | undefined;
    let warning: string | undefined;

    if (exactMatches.length === 1) {
        user = exactMatches[0];
    } else if (exactMatches.length > 1) {
        return {
            item: { text: input },
            error: `${exactMatches.length} users match "${input}". Use email address or username to identify the user.`,
        };
    } else if (users.length === 1) {
        user = users[0];
        warning = `"${input}" is matched with "${user.displayName}"`;
    } else if (users.length > 1) {
        return {
            item: { text: input },
            error: `${users.length} users match "${input}". Use email address or username to identify the user.`,
        };
    }

    if (!user) {
        return { item: { text: input }, error: `No user found for "${input}"` };
    }

    const item = { text: user.displayName || input, avatarUrl: getAvatarUrl(user) };
    if (user.active === false) {
        return { item, error: `${user.displayName} is an inactive user` };
    }

    return { item, payload: getUserPayload(user), warning };
}

async function resolveGroup(input: string, env: ResolveEnv): Promise<{ item: DisplayItem; payload?: unknown; error?: string }> {
    const groups = await env.lookup.findGroups(input);
    const group = groups.find((g) => g.name.toLowerCase() === input.toLowerCase());
    if (!group) {
        return { item: { text: input }, error: `No group found with name "${input}"` };
    }
    return { item: { text: group.name }, payload: { name: group.name } };
}

async function resolveMultiple(
    values: string[],
    resolver: (value: string) => Promise<{ item?: DisplayItem; payload?: unknown; error?: string; warning?: string }>,
): Promise<ResolvedValue> {
    const results = await Promise.all(values.map(resolver));
    const errors = results.map((r) => r.error).filter(Boolean);
    const warnings = results.map((r) => r.warning).filter(Boolean);

    return {
        display: results.map((r, i) => r.item || { text: values[i] }),
        payload: results.map((r) => r.payload),
        error: errors.length ? errors.join('; ') : undefined,
        warning: warnings.length ? warnings.join('; ') : undefined,
    };
}

function resolveText(kind: FieldKind, meta: JiraFieldMeta | undefined, input: string): ResolvedValue {
    const display = [{ text: input }];
    const isSingleLine = kind === 'string';
    const maxLength = isSingleLine ? maxSingleLineLength : maxTextLength;

    if (isSingleLine && /[\r\n]/.test(input)) {
        return { display, error: `${meta?.name || 'This field'} cannot have line breaks` };
    }
    if (input.length > maxLength) {
        return { display, error: `Maximum ${maxLength} characters are allowed. Value has ${input.length} characters.` };
    }
    return { display, payload: input };
}

function resolveUrl(input: string): ResolvedValue {
    try {
        const url = new URL(input);
        if (allowedUrlProtocols.includes(url.protocol)) {
            return { display: [{ text: input }], payload: input };
        }
    } catch {
        // Invalid url is reported below
    }
    return invalid('Not a valid URL. Value should start with http:// or https://', input);
}

function resolveLabels(input: string): ResolvedValue {
    const labels = splitMultiValue(input);
    const withSpaces = labels.filter((l) => /\s/.test(l));
    if (withSpaces.length) {
        return { display: labels.map((text) => ({ text })), error: `Labels cannot contain spaces: ${withSpaces.join(', ')}` };
    }
    const tooLong = labels.find((l) => l.length > maxSingleLineLength);
    if (tooLong) {
        return { display: labels.map((text) => ({ text })), error: `Label is longer than ${maxSingleLineLength} characters` };
    }
    return { display: labels.map((text) => ({ text })), payload: labels };
}

function resolveCascading(input: string, meta: JiraFieldMeta | undefined): ResolvedValue {
    const [parentText, childText] = input.split(cascadeSeparator);
    const allowedValues = meta?.allowedValues;
    if (!allowedValues) {
        return invalid('Allowed values of this field are not available. Field must be on the screen to set its value.', input);
    }

    const parentOption = findAllowedValue(parentText, allowedValues);
    if (!parentOption) {
        return invalid(`"${parentText}" is not a valid value. Allowed values: ${listAllowedValues(allowedValues)}`, input);
    }

    if (!childText) {
        return {
            display: [{ text: getAllowedValueText(parentOption) }],
            payload: { id: parentOption.id },
            error: getAllowedValueError(parentOption),
        };
    }

    const childOption = findAllowedValue(childText, parentOption.children || []);
    if (!childOption) {
        return invalid(
            `"${childText}" is not a valid option under "${getAllowedValueText(parentOption)}". Use "Parent > Child" format.`,
            input,
        );
    }

    return {
        display: [{ text: `${getAllowedValueText(parentOption)} > ${getAllowedValueText(childOption)}` }],
        payload: { id: parentOption.id, child: { id: childOption.id } },
        error: getAllowedValueError(parentOption) || getAllowedValueError(childOption),
    };
}

async function resolveIssueLink(input: string, env: ResolveEnv): Promise<ResolvedValue> {
    const key = input.trim().toUpperCase();
    if (!issueKeyRegex.test(key)) {
        return invalid('Not a valid issue key', input);
    }
    const issue = await env.lookup.getIssue(key);
    if (!issue) {
        return invalid('Issue does not exist or you do not have access to it', input);
    }
    return { display: [{ text: key, issueKey: key }], payload: key };
}

async function resolveSprint(input: string, projectKey: string | undefined, env: ResolveEnv): Promise<ResolvedValue> {
    const text = input.trim();
    let sprints: JiraSprintRef[] = [];
    if (projectKey) {
        try {
            sprints = await env.lookup.getSprints(projectKey);
        } catch {
            sprints = [];
        }
    }

    const isId = /^\d+$/.test(text);
    const matches = isId
        ? sprints.filter((s) => String(s.id) === text)
        : sprints.filter((s) => normalizeText(s.name) === normalizeText(text));

    if (!matches.length) {
        if (isId) {
            return {
                display: [{ text }],
                payload: Number(text),
                warning: 'Sprint could not be verified. Jira validates it during import.',
            };
        }
        return invalid(
            `No sprint named "${text}" found${projectKey ? ` for project ${projectKey}` : ''}. Use the sprint id instead.`,
            input,
        );
    }

    if (matches.length > 1) {
        return invalid(`${matches.length} sprints are named "${text}". Use the sprint id instead.`, input);
    }

    const [sprint] = matches;
    if (sprint.closed || sprint.state?.toLowerCase() === 'closed') {
        return { display: [{ text: sprint.name }], error: 'Issues cannot be added to a closed sprint' };
    }

    return { display: [{ text: sprint.name }], payload: sprint.id };
}

function resolveEstimate(input: string): ResolvedValue {
    const text = input.trim();
    if (estimateRegex.test(text)) {
        return { display: [{ text }], payload: text };
    }
    if (numberOnlyRegex.test(text)) {
        return {
            display: [{ text }],
            payload: text,
            warning: 'No time unit specified. Jira uses the default unit configured in time tracking settings.',
        };
    }
    return invalid('Invalid estimate. Use the format like "3d 4h 30m" (w = weeks, d = days, h = hours, m = minutes)', input);
}

export async function resolveValue(
    kind: FieldKind,
    meta: JiraFieldMeta | undefined,
    input: string,
    env: ResolveEnv,
    projectKey?: string,
): Promise<ResolvedValue> {
    const text = input.trim();

    switch (kind) {
        case 'string':
        case 'text':
        case 'comment':
            return resolveText(kind, meta, input);
        case 'url':
            return resolveUrl(text);
        case 'number': {
            const value = Number(text);
            return Number.isFinite(value) ? { display: [{ text }], payload: value } : invalid('Value must be a number', input);
        }
        case 'date': {
            const date = parseDate(text, env.dateFormats);
            return date
                ? { display: [{ text: env.formatDate(date) }], payload: format(date, 'yyyy-MM-dd') }
                : invalid(`Invalid date. Use yyyy-mm-dd format (e.g. ${format(new Date(), 'yyyy-MM-dd')})`, input);
        }
        case 'datetime': {
            const date = parseDate(text, env.dateTimeFormats) || parseDate(text, env.dateFormats);
            return date
                ? { display: [{ text: env.formatDateTime(date) }], payload: format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxx") }
                : invalid(`Invalid date and time. Use yyyy-mm-dd hh:mm format (e.g. ${format(new Date(), 'yyyy-MM-dd HH:mm')})`, input);
        }
        case 'labels':
            return resolveLabels(text);
        case 'strings': {
            const values = splitMultiValue(text);
            return { display: values.map((v) => ({ text: v })), payload: values };
        }
        case 'user':
            return resolveMultiple([text], (v) => resolveUser(v, env)).then((r) => ({ ...r, payload: (r.payload as unknown[])[0] }));
        case 'users':
            return resolveMultiple(splitMultiValue(text), (v) => resolveUser(v, env));
        case 'group':
            return resolveMultiple([text], (v) => resolveGroup(v, env)).then((r) => ({ ...r, payload: (r.payload as unknown[])[0] }));
        case 'groups':
            return resolveMultiple(splitMultiValue(text), (v) => resolveGroup(v, env));
        case 'option': {
            const result = resolveAllowedValue(text, meta);
            return { display: [result.item || { text }], payload: result.payload, error: result.error, warning: result.warning };
        }
        case 'options':
            return resolveMultiple(splitMultiValue(text, meta?.allowedValues), async (v) => resolveAllowedValue(v, meta));
        case 'cascading':
            return resolveCascading(text, meta);
        case 'issuelink':
            return resolveIssueLink(text, env);
        case 'sprint':
            return resolveSprint(text, projectKey, env);
        case 'originalEstimate':
        case 'remainingEstimate':
            return resolveEstimate(text);
        default:
            return {
                display: [{ text: input }],
                payload: input,
                warning: 'Values of this field type are not verified by Jira Assistant. Value is sent to Jira as entered.',
            };
    }
}

export function getEmptyPayload(kind: FieldKind): unknown {
    return kind === 'labels' || kind === 'strings' || kind === 'users' || kind === 'groups' || kind === 'options' ? [] : null;
}

export function getDateFormats(userDateFormat?: string, userTimeFormat?: string): { dateFormats: string[]; dateTimeFormats: string[] } {
    const dateFormats = [...new Set([...(userDateFormat ? [userDateFormat] : []), ...isoDateFormats])];
    const userDateTime = userDateFormat && userTimeFormat ? [`${userDateFormat} ${userTimeFormat}`] : [];
    return { dateFormats, dateTimeFormats: [...new Set([...userDateTime, ...isoDateTimeFormats])] };
}
