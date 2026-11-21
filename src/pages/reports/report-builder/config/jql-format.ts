import { format } from 'date-fns';

interface UserLike {
    accountId?: string;
    name?: string;
    emailAddress?: string;
    key?: string;
}

interface GroupLike {
    users: UserLike[];
}

function isGroup(value: object): value is GroupLike {
    return Array.isArray((value as GroupLike).users);
}

function userIdentifier(user: UserLike): string | undefined {
    return user.accountId || user.name || user.key || user.emailAddress;
}

function quote(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function toJqlTerms(value: unknown): string[] {
    if (value === null || value === undefined || value === '') return [];
    if (Array.isArray(value)) return value.flatMap(toJqlTerms);
    if (value instanceof Date) return [quote(format(value, 'yyyy-MM-dd'))];
    if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
    if (typeof value === 'object') {
        if (isGroup(value)) return value.users.flatMap(toJqlTerms);
        const obj = value as Record<string, unknown>;
        const user = userIdentifier(obj as UserLike);
        if (user) return [quote(user)];
        if (obj.key !== undefined) return [quote(String(obj.key))];
        if (obj.id !== undefined) return [String(obj.id)];
        if (obj.value !== undefined) return toJqlTerms(obj.value);
        if (obj.name !== undefined) return [quote(String(obj.name))];
        return [];
    }
    return [quote(String(value))];
}

export function formatJqlValue(value: unknown): string {
    return Array.from(new Set(toJqlTerms(value))).join(', ');
}

export function getUserIdentifiers(value: unknown): string[] {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.flatMap(getUserIdentifiers);
    if (typeof value === 'string') return [value];
    if (typeof value === 'object') {
        if (isGroup(value)) return value.users.flatMap(getUserIdentifiers);
        const id = userIdentifier(value as UserLike);
        return id ? [id] : [];
    }
    return [];
}
