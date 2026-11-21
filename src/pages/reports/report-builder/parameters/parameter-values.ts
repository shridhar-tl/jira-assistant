import type { SprintSelectionMap } from '@components';

export function serializeJson(value: unknown): string {
    return JSON.stringify(value ?? null);
}

export function deserializeJson(str: string): unknown {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

export function toSprintSelection(value: unknown): SprintSelectionMap {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as SprintSelectionMap) : {};
}
