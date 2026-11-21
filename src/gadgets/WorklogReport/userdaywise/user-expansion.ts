const autoExpandLimit = 2;

export function isUserExpanded(
    userExpnState: Record<string, boolean | undefined>,
    expandKey: string,
    expandUsers: boolean | undefined,
    groupUserCount: number,
    ticketCount: number,
): boolean {
    return userExpnState[expandKey] ?? (!!expandUsers || groupUserCount <= autoExpandLimit || ticketCount <= autoExpandLimit);
}
