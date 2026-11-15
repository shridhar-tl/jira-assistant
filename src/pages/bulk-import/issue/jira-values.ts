import type { JiraAllowedValue, JiraFieldMeta } from '@types';

import { getKindFromSchema } from './field-kinds';
import type { DisplayItem, FieldKind } from './types';

interface JiraValueObject {
    id?: string | number;
    key?: string;
    name?: string;
    value?: string;
    displayName?: string;
    accountId?: string;
    emailAddress?: string;
    state?: string;
    iconUrl?: string;
    avatarUrls?: Record<string, string>;
    child?: JiraValueObject;
    originalEstimate?: string;
    remainingEstimate?: string;
}

// Older Jira versions return sprint as a serialized string like "com.atlassian.greenhopper.service.sprint.Sprint@14b1c359[id=1,rapidViewId=1,state=CLOSED,name=Sprint 1,...]"
const legacySprintRegex = /\[id=(\d+),.*?state=(\w+),name=([^,\]]+)/;
const caseSensitiveKinds: FieldKind[] = ['string', 'text', 'url', 'labels', 'strings', 'comment', 'raw'];

function isObject(value: unknown): value is JiraValueObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getAvatarUrl(value: { iconUrl?: string; avatarUrls?: Record<string, string> }): string | undefined {
    const { iconUrl, avatarUrls } = value;
    return iconUrl || avatarUrls?.['16x16'] || avatarUrls?.['24x24'] || avatarUrls?.['32x32'] || avatarUrls?.['48x48'];
}

export function getAllowedValueText(value: JiraAllowedValue): string {
    return value.name || value.value || value.key || value.id || '';
}

export function parseLegacySprint(value: string): { id: number; state: string; name: string } | undefined {
    const match = legacySprintRegex.exec(value);
    return match ? { id: Number(match[1]), state: match[2], name: match[3] } : undefined;
}

export function toDisplayItems(value: unknown, formatDate?: (value: string) => string): DisplayItem[] {
    if (value === undefined || value === null || value === '') {
        return [];
    }

    if (Array.isArray(value)) {
        return value.flatMap((v) => toDisplayItems(v, formatDate));
    }

    if (typeof value === 'string') {
        const sprint = parseLegacySprint(value);
        if (sprint) {
            return [{ text: sprint.name }];
        }
        return [{ text: formatDate ? formatDate(value) : value }];
    }

    if (!isObject(value)) {
        return [{ text: String(value) }];
    }

    if (value.originalEstimate !== undefined || value.remainingEstimate !== undefined) {
        return [];
    }

    let text = value.displayName || value.name || value.value || value.key || String(value.id ?? '');
    if (value.child) {
        text = `${text} > ${value.child.value || value.child.name || ''}`;
    }

    return [{ text, avatarUrl: getAvatarUrl(value) }];
}

export function getComparableValues(value: unknown, kind: FieldKind): string[] {
    if (value === undefined || value === null || value === '') {
        return [];
    }

    if (Array.isArray(value)) {
        return value.flatMap((v) => getComparableValues(v, kind)).sort();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return [String(value)];
    }

    if (typeof value === 'string') {
        if (kind === 'sprint') {
            const sprint = parseLegacySprint(value);
            return sprint ? (sprint.state.toUpperCase() === 'CLOSED' ? [] : [String(sprint.id)]) : [value];
        }
        if (kind === 'datetime') {
            const time = new Date(value).getTime();
            return [Number.isNaN(time) ? value : String(time)];
        }
        if (kind === 'originalEstimate' || kind === 'remainingEstimate') {
            return [value.replace(/\s+/g, '').toLowerCase()];
        }
        return [caseSensitiveKinds.includes(kind) ? value.trim() : value.trim().toLowerCase()];
    }

    if (!isObject(value)) {
        return [];
    }

    if (kind === 'sprint') {
        return value.state?.toLowerCase() === 'closed' ? [] : [String(value.id)];
    }

    const identity =
        value.accountId || (value.id !== undefined ? String(value.id) : undefined) || value.name || value.key || value.value || '';
    const childIdentity = value.child ? `>${value.child.id ?? value.child.value ?? ''}` : '';

    return [`${identity}${childIdentity}`.toLowerCase()];
}

export function isSameValue(kind: FieldKind, payload: unknown, existing: unknown): boolean {
    const left = getComparableValues(payload, kind);
    const right = getComparableValues(existing, kind);
    return left.length === right.length && left.every((v, i) => v === right[i]);
}

function userPayload(user: JiraValueObject): Record<string, string> | undefined {
    if (user.accountId) {
        return { accountId: user.accountId };
    }
    return user.name ? { name: user.name } : undefined;
}

function idPayload(value: JiraValueObject): Record<string, string> | undefined {
    if (value.id !== undefined) {
        return { id: String(value.id) };
    }
    if (value.key) {
        return { key: value.key };
    }
    if (value.name) {
        return { name: value.name };
    }
    return value.value ? { value: value.value } : undefined;
}

function activeSprintId(value: unknown): number | undefined {
    const list = Array.isArray(value) ? value : [value];
    for (const item of list) {
        if (typeof item === 'string') {
            const sprint = parseLegacySprint(item);
            if (sprint && sprint.state.toUpperCase() !== 'CLOSED') {
                return sprint.id;
            }
        } else if (isObject(item) && item.state?.toLowerCase() !== 'closed' && item.id !== undefined) {
            return Number(item.id);
        }
    }
    return undefined;
}

export function toPayloadFromJiraValue(meta: JiraFieldMeta, value: unknown): unknown {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
        return undefined;
    }

    const kind = getKindFromSchema(meta.schema, meta.key);

    switch (kind) {
        case 'string':
        case 'text':
        case 'url':
        case 'number':
        case 'date':
        case 'datetime':
        case 'labels':
        case 'strings':
        case 'issuelink':
            return typeof value === 'object' && !Array.isArray(value) ? undefined : value;
        case 'user':
            return isObject(value) ? userPayload(value) : undefined;
        case 'users':
            return Array.isArray(value) ? value.filter(isObject).map(userPayload).filter(Boolean) : undefined;
        case 'group':
            return isObject(value) && value.name ? { name: value.name } : undefined;
        case 'groups':
            return Array.isArray(value) ? value.filter(isObject).map((g) => ({ name: g.name })) : undefined;
        case 'option':
            return isObject(value) ? idPayload(value) : undefined;
        case 'options':
            return Array.isArray(value) ? value.filter(isObject).map(idPayload).filter(Boolean) : undefined;
        case 'cascading':
            if (!isObject(value) || value.id === undefined) {
                return undefined;
            }
            return value.child?.id !== undefined
                ? { id: String(value.id), child: { id: String(value.child.id) } }
                : { id: String(value.id) };
        case 'sprint':
            return activeSprintId(value);
        default:
            if (isObject(value)) {
                return idPayload(value);
            }
            return Array.isArray(value) ? undefined : value;
    }
}
