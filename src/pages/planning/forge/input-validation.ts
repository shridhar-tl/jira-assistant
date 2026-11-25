import { ResolverError } from '../../../common/resolver-result';

export class InvalidInputError extends ResolverError {
    constructor(message: string) {
        super(400, message);
        this.name = 'InvalidInputError';
    }
}

export type PlainObject = Record<string, unknown>;

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?$/;
const issueKeyPattern = /^[A-Z][A-Z0-9_]*-\d+$/;
const controlChars = /\p{Cc}/gu;
const controlCharsExceptLineBreaks = /[^\P{Cc}\t\n\r]/gu;

export function fail(field: string, problem = 'is not valid'): never {
    throw new InvalidInputError(`${field} ${problem}.`);
}

export function record(value: unknown, field: string): PlainObject {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return fail(field);
    }
    return value as PlainObject;
}

export function text(value: unknown, field: string, max: number, options: { min?: number; multiline?: boolean } = {}): string {
    if (typeof value !== 'string') {
        return fail(field, 'must be text');
    }
    const cleaned = (options.multiline ? value.replace(controlCharsExceptLineBreaks, '') : value.replace(controlChars, ' ')).trim();
    if (cleaned.length > max) {
        return fail(field, `must be at most ${max} characters`);
    }
    if (cleaned.length < (options.min ?? 0)) {
        return fail(field, 'is required');
    }
    return cleaned;
}

export function optionalText(value: unknown, field: string, max: number, options: { multiline?: boolean } = {}): string {
    return value === undefined || value === null ? '' : text(value, field, max, options);
}

export function pattern(value: unknown, field: string, regex: RegExp): string {
    if (typeof value !== 'string' || !regex.test(value)) {
        return fail(field);
    }
    return value;
}

export function nullable<T>(value: unknown, read: (v: unknown) => T): T | null {
    return value === null || value === undefined ? null : read(value);
}

export function bool(value: unknown, field: string): boolean {
    if (typeof value !== 'boolean') {
        return fail(field, 'must be true or false');
    }
    return value;
}

export function integer(value: unknown, field: string, min: number, max: number): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
        return fail(field);
    }
    return value;
}

export function decimal(value: unknown, field: string, min: number, max: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        return fail(field);
    }
    return value;
}

export function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
    if (!allowed.includes(value as T)) {
        return fail(field);
    }
    return value as T;
}

export function list<T>(value: unknown, field: string, max: number, read: (item: unknown, index: number) => T): T[] {
    if (value === undefined || value === null) {
        return [];
    }
    if (!Array.isArray(value)) {
        return fail(field, 'must be a list');
    }
    if (value.length > max) {
        return fail(field, `can have at most ${max} entries`);
    }
    return value.map(read);
}

export function dateKey(value: unknown, field: string): string {
    if (typeof value !== 'string' || !dateKeyPattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
        return fail(field, 'must be a date');
    }
    return value;
}

export function timestamp(value: unknown, field: string): string {
    if (typeof value !== 'string' || (!isoPattern.test(value) && !dateKeyPattern.test(value)) || Number.isNaN(Date.parse(value))) {
        return fail(field, 'must be a date and time');
    }
    return value;
}

export function issueKeys(value: unknown, field: string, max: number): string[] {
    return [...new Set(list(value, field, max, (key) => pattern(key, field, issueKeyPattern)))];
}

export function issueKey(value: unknown, field: string): string {
    return pattern(value, field, issueKeyPattern);
}

export function uniqueIds<T extends { id: string }>(items: T[], field: string): T[] {
    const seen = new Set<string>();
    items.forEach((item) => {
        if (seen.has(item.id)) {
            fail(field, `has a duplicate id (${item.id})`);
        }
        seen.add(item.id);
    });
    return items;
}
