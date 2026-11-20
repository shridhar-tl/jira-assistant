const autoExpandUserThreshold = 2;

export function isUserExpanded(
    userExpnState: Record<string, boolean | undefined>,
    expandKey: string,
    expandUsers: boolean | undefined,
    groupUserCount: number,
): boolean {
    return userExpnState[expandKey] ?? (!!expandUsers || groupUserCount <= autoExpandUserThreshold);
}
