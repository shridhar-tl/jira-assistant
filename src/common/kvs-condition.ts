const conditionFailurePattern = /condition|check.*fail|precondition|already exists|transaction_conflict/i;

export function storageFailureText(error: unknown): string {
    if (typeof error !== 'object' || error === null) {
        return String(error);
    }
    const record = error as Record<string, unknown>;
    return `${String(record.code ?? '')} ${String(record.message ?? '')}`;
}

/** Forge storage reports a failed transaction condition, or a clash with a concurrent transaction, only through the code and message of its error. */
export function isConditionFailure(error: unknown): boolean {
    return conditionFailurePattern.test(storageFailureText(error));
}
