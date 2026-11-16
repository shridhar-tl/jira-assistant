export interface JiraUserProfile {
    self: string;
    displayName: string;
    accountId?: string;
    name?: string;
    key?: string;
    emailAddress?: string;
}

export const invalidJiraProfileCode = 'INVALID_JIRA_PROFILE';

export interface InvalidJiraProfileError {
    code: typeof invalidJiraProfileCode;
    message: string;
}

const invalidJiraProfileMessage = 'Server did not respond with a valid Jira user profile.';

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function isJiraUserProfile(profile: unknown): profile is JiraUserProfile {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        return false;
    }

    const { self, displayName, accountId, name, key } = profile as Record<string, unknown>;

    return (
        isNonEmptyString(self) &&
        self.includes('/rest/api/') &&
        typeof displayName === 'string' &&
        (isNonEmptyString(accountId) || isNonEmptyString(name) || isNonEmptyString(key))
    );
}

export function isInvalidJiraProfileError(err: unknown): err is InvalidJiraProfileError {
    return !!err && typeof err === 'object' && (err as Partial<InvalidJiraProfileError>).code === invalidJiraProfileCode;
}

export function assertJiraUserProfile(profile: unknown): asserts profile is JiraUserProfile {
    if (!isJiraUserProfile(profile)) {
        const error: InvalidJiraProfileError = { code: invalidJiraProfileCode, message: invalidJiraProfileMessage };
        throw error;
    }
}
