export const maxPropertyBytes = 32000;

export class PropertyTooLargeError extends Error {
    constructor(label: string) {
        super(`${label} is too large to be saved in Jira (limit 32 KB). Remove some entries and try again.`);
        this.name = 'PropertyTooLargeError';
    }
}

export function getJsonSize(value: unknown): number {
    return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function assertPropertySize(value: unknown, label: string): void {
    if (getJsonSize(value) > maxPropertyBytes) {
        throw new PropertyTooLargeError(label);
    }
}
