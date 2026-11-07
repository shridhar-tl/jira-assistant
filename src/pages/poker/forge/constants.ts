export const pokerResolverFunction = 'poker';
export const pokerTokenResolverFunction = 'pokerRealtimeToken';

export const rosterRecordSuffix = 'roster';
export const counterRecordSuffix = 'revision';
export const voteHeaderKind = 'header';
export const voteEntryKind = 'entry';
export const participantRecordKind = 'participant';
export const rosterRecordKind = 'roster';

export const participantStatus = {
    invited: 'invited',
    requested: 'requested',
    rejected: 'rejected',
    member: 'member',
} as const;

export type ParticipantStatus = (typeof participantStatus)[keyof typeof participantStatus];

export const participantGroups = {
    member: 'member',
    invite: 'invite',
    request: 'request',
} as const;

export type ParticipantGroup = (typeof participantGroups)[keyof typeof participantGroups];

export function participantGroupOf(roomId: string, group: ParticipantGroup): string {
    return `${roomId}|${group}`;
}

export const pokerChannelPrefix = 'poker-room-';

export const pokerEntities = {
    room: 'poker-room',
    counter: 'poker-counter',
    participant: 'poker-participant',
    vote: 'poker-vote',
} as const;

export const pokerIndexes = {
    roomByListed: 'by-listed',
    participantByRoomGroup: 'by-room-group',
    participantByPerson: 'by-person',
} as const;

export const offlineThresholdMs = 120_000;
export const roomLifetimeHours = 24;
export const childRefreshMs = 3_600_000;
export const hostAwayGraceMs = 3 * 60_000;
export const directoryLimit = 100;
export const degradedResyncMs = 15_000;
export const recoveryMaxDelayMs = 60_000;
export const seenEventLimit = 500;
export const rateLimitedActionMessage = 'Atlassian is rate limiting Jira Assistant, so that action did not go through. Please try again in a moment.';
export const bulkJoinBatchSize = 25;
export const transactionOperationLimit = 25;
export const batchGetChunkSize = 25;

export const forgeEngineDefaults = {
    requireApproval: false,
    listed: true,
} as const;

export const serverRetry = {
    maxAttempts: 4,
    baseDelayMs: 250,
    maxDelayMs: 2000,
    jitterRatio: 0.3,
} as const;

export const casRetry = {
    maxAttempts: 14,
    baseDelayMs: 40,
    maxDelayMs: 400,
    jitterRatio: 0.5,
} as const;

export const realtimeTokenRefreshMarginSeconds = 120;
export const fallbackTokenLifetimeSeconds = 300;

export const busyMessage = 'Atlassian is rate limiting Jira Assistant right now. Please try again in a moment.';

export function pokerChannelOf(roomId: string): string {
    return `${pokerChannelPrefix}${roomId}`;
}
