import {
    casRetry,
    childRefreshMs,
    counterRecordSuffix,
    directoryLimit,
    offlineThresholdMs,
    participantGroupOf,
    participantGroups,
    participantRecordKind,
    participantStatus,
    pokerEntities,
    pokerIndexes,
    roomLifetimeHours,
    rosterRecordKind,
    rosterRecordSuffix,
    transactionOperationLimit,
    voteEntryKind,
    voteHeaderKind,
    type ParticipantStatus,
} from '../constants';
import { BusyError, retryDelayMs } from '../rate-limit';
import { ConditionFailedError, type EntityCondition, type EntityGateway, type TransactionOperation } from './entity-gateway';
import {
    summarizeVotes,
    type DirectoryStore,
    type InvitationRecord,
    type InvitationStore,
    type JoinRequestRecord,
    type MemberPatch,
    type MemberRecord,
    type PresencePort,
    type RoomPatch,
    type RoomRecord,
    type RoomStore,
    type RoundStart,
    type SubmitVoteOutcome,
    type VoteRecord,
    type VoteSummaryFields,
} from './poker-engine';

type Entity = Record<string, unknown>;
type VoteValue = number | string;

interface RoomEntity extends Entity {
    roomId: string;
    roomName: string;
    scoreType: RoomRecord['scoreType'];
    moderatorId: string;
    moderatorKey: string;
    currentIssueId?: string;
    issues: RoomRecord['issues'];
    settings: RoomRecord['settings'];
    access: RoomRecord['access'];
    listed: string;
    memberCount: number;
    created: string;
    lastActivity: number;
    lastActivityIso: string;
    refreshedMs?: number;
    ver: number;
}

interface CounterEntity extends Entity {
    roomId: string;
    revision: number;
}

interface RosterEntity extends Entity {
    kind: typeof rosterRecordKind;
    roomId: string;
    members: Record<string, string>;
    ver: number;
}

interface ParticipantEntity extends Entity {
    kind: typeof participantRecordKind;
    roomId: string;
    memberKey: string;
    status: ParticipantStatus;
    roomGroup: string;
    name: string;
    email?: string;
    avatarId?: number | null;
    avatarUrl?: string;
    createdAt: string;
    createdMs: number;
    sid?: string;
    role?: MemberRecord['role'];
    joinedAt?: string;
    lastSeenAt?: string;
    lastSeenMs?: number;
    votedIssueIds?: string[];
    requestId?: string;
    reason?: string;
    invitedBy?: string;
    ver: number;
}

type MemberParticipant = ParticipantEntity & { sid: string };

interface VoteEntity extends Entity {
    kind: typeof voteHeaderKind;
    roomId: string;
    issueId: string;
    reveal: boolean;
    createdAt: string;
    revealedAt?: string;
    average?: number;
    maxVote?: number;
    finalScore?: VoteValue;
    syncedScore?: VoteValue;
    values: Record<string, VoteValue>;
}

interface VoteEntryEntity extends Entity {
    kind: typeof voteEntryKind;
    roomId: string;
    issueId: string;
    sid: string;
    value: VoteValue;
}

export interface ForgeStoreOptions {
    gateway: EntityGateway;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
    random?: () => number;
}

export interface ForgePokerAdapter {
    store: RoomStore;
    invitations: InvitationStore;
    directory: DirectoryStore;
    presence: PresencePort;
    findSidByKey(roomId: string, memberKey: string): Promise<string | null>;
}

const roomLifetimeMs = roomLifetimeHours * 3_600_000;
const sidCacheLimit = 5000;

const participantKeyOf = (roomId: string, memberKey: string) => `${roomId}:${memberKey}`;
const rosterKeyOf = (roomId: string) => `${roomId}:${rosterRecordSuffix}`;
const counterKeyOf = (roomId: string) => `${roomId}:${counterRecordSuffix}`;
const voteKeyOf = (roomId: string, issueId: string) => `${roomId}:${issueId}`;
const entryKeyOf = (roomId: string, issueId: string, sid: string) => `${roomId}:${issueId}:${sid}`;

function chunk<T>(items: T[], size: number): T[][] {
    const groups: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        groups.push(items.slice(index, index + size));
    }
    return groups;
}

function sameValues(left: Record<string, VoteValue>, right: Record<string, VoteValue>): boolean {
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every((key) => right[key] === left[key]);
}

function compact<T extends Entity>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function isStorable(entry: unknown): boolean {
    return entry !== undefined && entry !== null && !(typeof entry === 'string' && entry.trim() === '');
}

function storable<T extends Entity>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => isStorable(entry))) as T;
}

export function createForgePokerAdapter(options: ForgeStoreOptions): ForgePokerAdapter {
    const { gateway } = options;
    const now = options.now ?? (() => Date.now());
    const random = options.random ?? Math.random;
    const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

    function isExpired(room: RoomEntity): boolean {
        return now() - room.lastActivity > roomLifetimeMs;
    }

    function toRoomRecord(entity: RoomEntity, revision: number): RoomRecord {
        return {
            roomId: entity.roomId,
            roomName: entity.roomName,
            scoreType: entity.scoreType,
            moderatorId: entity.moderatorId,
            moderatorKey: entity.moderatorKey,
            currentIssueId: entity.currentIssueId ?? null,
            issues: entity.issues,
            settings: entity.settings,
            access: entity.access,
            memberCount: entity.memberCount,
            revision,
            created: entity.created,
            lastActivity: entity.lastActivityIso,
        };
    }

    function toRoomEntity(room: RoomRecord, ver: number, refreshedMs?: number): RoomEntity {
        return storable({
            roomId: room.roomId,
            roomName: room.roomName,
            scoreType: room.scoreType,
            moderatorId: room.moderatorId,
            moderatorKey: room.moderatorKey,
            currentIssueId: room.currentIssueId ?? undefined,
            issues: room.issues,
            settings: room.settings,
            access: room.access,
            listed: room.access.listed ? 'y' : 'n',
            memberCount: room.memberCount,
            created: room.created,
            lastActivity: Date.parse(room.lastActivity),
            lastActivityIso: room.lastActivity,
            refreshedMs,
            ver,
        });
    }

    async function readRevision(roomId: string): Promise<number> {
        const counter = await gateway.get<CounterEntity>(pokerEntities.counter, counterKeyOf(roomId));
        return counter?.revision ?? 0;
    }

    async function readRoomEntity(roomId: string): Promise<RoomEntity | null> {
        const entity = await gateway.get<RoomEntity>(pokerEntities.room, roomId);
        if (!entity || isExpired(entity)) {
            return null;
        }
        return entity;
    }

    async function casDelay(attempt: number): Promise<void> {
        await sleep(retryDelayMs(attempt, casRetry, random));
    }

    const sidKeys = new Map<string, string>();

    function rememberSid(roomId: string, sid: string, memberKey: string): void {
        const cacheKey = `${roomId}:${sid}`;
        if (sidKeys.size >= sidCacheLimit && !sidKeys.has(cacheKey)) {
            const oldest = sidKeys.keys().next().value;
            if (oldest !== undefined) {
                sidKeys.delete(oldest);
            }
        }
        sidKeys.set(cacheKey, memberKey);
    }

    async function readRoster(roomId: string): Promise<RosterEntity | null> {
        const roster = (await gateway.get<RosterEntity>(pokerEntities.participant, rosterKeyOf(roomId))) ?? null;
        if (roster) {
            for (const [sid, memberKey] of Object.entries(roster.members)) {
                rememberSid(roomId, sid, memberKey);
            }
        }
        return roster;
    }

    async function rosterSids(roomId: string): Promise<string[]> {
        return Object.keys((await readRoster(roomId))?.members ?? {});
    }

    async function keyOfSid(roomId: string, sid: string): Promise<string | null> {
        const cached = sidKeys.get(`${roomId}:${sid}`);
        if (cached) {
            return cached;
        }
        return (await readRoster(roomId))?.members[sid] ?? null;
    }

    function memberRecordOf(entity: ParticipantEntity): MemberRecord {
        return compact({
            sid: entity.sid as string,
            memberKey: entity.memberKey,
            name: entity.name,
            role: entity.role as MemberRecord['role'],
            avatarId: entity.avatarId ?? null,
            avatarUrl: entity.avatarUrl,
            votedIssueIds: entity.votedIssueIds ?? [],
            joinedAt: entity.joinedAt as string,
            lastSeenAt: entity.lastSeenAt as string,
        }) as MemberRecord;
    }

    function memberEntityOf(roomId: string, member: MemberRecord, ver: number, lastSeenMs: number): ParticipantEntity {
        return storable({
            kind: participantRecordKind,
            roomId,
            memberKey: member.memberKey,
            status: participantStatus.member,
            roomGroup: participantGroupOf(roomId, participantGroups.member),
            name: member.name,
            avatarId: member.avatarId,
            avatarUrl: member.avatarUrl,
            createdAt: member.joinedAt,
            createdMs: Date.parse(member.joinedAt),
            sid: member.sid,
            role: member.role,
            joinedAt: member.joinedAt,
            lastSeenAt: member.lastSeenAt,
            lastSeenMs,
            votedIssueIds: member.votedIssueIds,
            ver,
        });
    }

    function isMemberEntity(entity: ParticipantEntity | undefined): entity is MemberParticipant {
        return entity !== undefined && entity.status === participantStatus.member && entity.sid !== undefined;
    }

    async function readParticipant(roomId: string, memberKey: string): Promise<ParticipantEntity | undefined> {
        return await gateway.get<ParticipantEntity>(pokerEntities.participant, participantKeyOf(roomId, memberKey));
    }

    function conditionOn(existing: ParticipantEntity | undefined): EntityCondition[] {
        return existing ? [{ field: 'ver', operator: 'equalTo', value: existing.ver }] : [{ field: 'ver', operator: 'notExists' }];
    }

    async function readMembers(roomId: string, memberKeys: string[]): Promise<ParticipantEntity[]> {
        const found = await gateway.batchGet<ParticipantEntity>(
            pokerEntities.participant,
            memberKeys.map((memberKey) => participantKeyOf(roomId, memberKey)),
        );
        return [...found.values()].filter(isMemberEntity);
    }

    async function changeRoster(
        roomId: string,
        change: (members: Record<string, string>) => boolean,
        extra: () => Promise<TransactionOperation[]> | TransactionOperation[] = () => [],
    ): Promise<{ roster: RosterEntity; changed: boolean } | null> {
        for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
            const roster = await readRoster(roomId);
            if (!roster) {
                return null;
            }
            const members = structuredClone(roster.members);
            if (!change(members)) {
                return { roster, changed: false };
            }
            const next: RosterEntity = { kind: rosterRecordKind, roomId, members, ver: roster.ver + 1 };
            try {
                await gateway.transact([
                    { kind: 'set', entity: pokerEntities.participant, key: rosterKeyOf(roomId), value: next, when: [{ field: 'ver', operator: 'equalTo', value: roster.ver }] },
                    ...(await extra()),
                ]);
                for (const [sid, memberKey] of Object.entries(members)) {
                    rememberSid(roomId, sid, memberKey);
                }
                return { roster: next, changed: true };
            } catch (error) {
                if (!(error instanceof ConditionFailedError)) {
                    throw error;
                }
                await casDelay(attempt);
            }
        }
        throw new BusyError('The room is busy. Please retry.');
    }

    async function readEntries(roomId: string, issueId: string, sids: string[]): Promise<Record<string, VoteValue>> {
        const entries = await gateway.batchGet<VoteEntryEntity>(
            pokerEntities.vote,
            sids.map((sid) => entryKeyOf(roomId, issueId, sid)),
        );
        const values: Record<string, VoteValue> = {};
        for (const entry of entries.values()) {
            values[entry.sid] = entry.value;
        }
        return values;
    }

    function voteRecordOf(header: VoteEntity, values: Record<string, VoteValue>): VoteRecord {
        return compact({
            issueId: header.issueId,
            reveal: header.reveal,
            values,
            average: header.average,
            maxVote: header.maxVote,
            finalScore: header.finalScore,
            syncedScore: header.syncedScore,
            revealedAt: header.revealedAt,
            createdAt: header.createdAt,
        }) as VoteRecord;
    }

    async function hydrateVote(header: VoteEntity, sids: string[]): Promise<VoteRecord> {
        if (header.reveal) {
            return voteRecordOf(header, header.values ?? {});
        }
        return voteRecordOf(header, await readEntries(header.roomId, header.issueId, sids));
    }

    async function transactInBatches(operations: TransactionOperation[]): Promise<void> {
        for (const group of chunk(operations, transactionOperationLimit)) {
            await gateway.transact(group);
        }
    }

    async function deleteVoteData(roomId: string, issueId: string, sids: string[]): Promise<void> {
        const operations: TransactionOperation[] = sids.map((sid) => ({ kind: 'delete', entity: pokerEntities.vote, key: entryKeyOf(roomId, issueId, sid) }));
        operations.push({ kind: 'delete', entity: pokerEntities.vote, key: voteKeyOf(roomId, issueId) });
        await transactInBatches(operations);
    }

    async function refreshVoteHeaders(room: RoomEntity): Promise<void> {
        const headers = await gateway.batchGet<VoteEntity>(
            pokerEntities.vote,
            room.issues.map((issue) => voteKeyOf(room.roomId, issue.id)),
        );
        await transactInBatches(
            [...headers.values()].map((header) => ({
                kind: 'set',
                entity: pokerEntities.vote,
                key: voteKeyOf(room.roomId, header.issueId),
                value: header,
                when: [
                    { field: 'reveal', operator: 'equalTo', value: header.reveal },
                    header.finalScore === undefined
                        ? { field: 'finalScore', operator: 'notExists' }
                        : { field: 'finalScore', operator: 'equalTo', value: header.finalScore },
                ],
            })),
        );
    }

    async function refreshParticipants(roomId: string): Promise<void> {
        const roster = await readRoster(roomId);
        if (!roster) {
            return;
        }
        const operations: TransactionOperation[] = [
            { kind: 'set', entity: pokerEntities.participant, key: rosterKeyOf(roomId), value: roster, when: [{ field: 'ver', operator: 'equalTo', value: roster.ver }] },
        ];
        for (const member of await readMembers(roomId, Object.values(roster.members))) {
            operations.push({
                kind: 'set',
                entity: pokerEntities.participant,
                key: participantKeyOf(roomId, member.memberKey),
                value: member,
                when: [{ field: 'ver', operator: 'equalTo', value: member.ver }],
            });
        }
        await transactInBatches(operations);
    }

    async function refreshCounter(roomId: string): Promise<void> {
        const counter = await gateway.get<CounterEntity>(pokerEntities.counter, counterKeyOf(roomId));
        if (counter) {
            await gateway.transact([
                { kind: 'set', entity: pokerEntities.counter, key: counterKeyOf(roomId), value: counter, when: [{ field: 'revision', operator: 'equalTo', value: counter.revision }] },
            ]);
        }
    }

    async function refreshChildren(room: RoomEntity): Promise<void> {
        const steps = [() => refreshParticipants(room.roomId), () => refreshCounter(room.roomId), () => refreshVoteHeaders(room)];
        for (const step of steps) {
            try {
                await step();
            } catch (error) {
                if (!(error instanceof ConditionFailedError)) {
                    console.error('[poker] could not refresh the lifetime of room records', error);
                }
            }
        }
    }

    async function deleteVoteEntries(roomId: string, issueId: string, sids: string[]): Promise<void> {
        await transactInBatches(sids.map((sid) => ({ kind: 'delete' as const, entity: pokerEntities.vote, key: entryKeyOf(roomId, issueId, sid) })));
    }

    async function writeRoom(roomId: string, patch: RoomPatch, extra: TransactionOperation[] = [], tolerant = false): Promise<RoomRecord | null> {
        for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
            const current = await readRoomEntity(roomId);
            if (!current) {
                return null;
            }
            const base = toRoomRecord(current, 0);
            const merged: RoomRecord = { ...base, ...patch, access: patch.access ?? base.access };
            const refreshDue = now() - (current.refreshedMs ?? Date.parse(current.created)) > childRefreshMs;
            const next = toRoomEntity(merged, current.ver + 1, refreshDue ? now() : current.refreshedMs);
            try {
                await gateway.transact([
                    { kind: 'set', entity: pokerEntities.room, key: roomId, value: next, when: [{ field: 'ver', operator: 'equalTo', value: current.ver }] },
                    ...extra,
                ]);
                if (refreshDue) {
                    await refreshChildren(next);
                }
                return toRoomRecord(next, await readRevision(roomId));
            } catch (error) {
                if (!(error instanceof ConditionFailedError)) {
                    throw error;
                }
                await casDelay(attempt);
            }
        }
        if (tolerant) {
            return null;
        }
        throw new BusyError('The room is busy. Please retry.');
    }

    function isActivityOnly(patch: RoomPatch): boolean {
        const keys = Object.keys(patch);
        return keys.length === 1 && keys[0] === 'lastActivity';
    }

    const store: RoomStore = {
        async getRoom(roomId) {
            const entity = await readRoomEntity(roomId);
            return entity ? toRoomRecord(entity, await readRevision(roomId)) : null;
        },

        async createRoom(room, member) {
            if (await gateway.get(pokerEntities.room, room.roomId)) {
                return false;
            }
            const stamp = now();
            await gateway.transact([
                { kind: 'set', entity: pokerEntities.room, key: room.roomId, value: toRoomEntity(room, 1, stamp) },
                { kind: 'set', entity: pokerEntities.participant, key: participantKeyOf(room.roomId, member.memberKey), value: memberEntityOf(room.roomId, member, 1, stamp) },
                { kind: 'set', entity: pokerEntities.participant, key: rosterKeyOf(room.roomId), value: { kind: rosterRecordKind, roomId: room.roomId, members: { [member.sid]: member.memberKey }, ver: 1 } },
                { kind: 'set', entity: pokerEntities.counter, key: counterKeyOf(room.roomId), value: { roomId: room.roomId, revision: room.revision } },
            ]);
            rememberSid(room.roomId, member.sid, member.memberKey);
            return true;
        },

        async updateRoom(roomId, patch) {
            return await writeRoom(roomId, patch, [], isActivityOnly(patch));
        },

        async bumpRevision(roomId) {
            let known = 0;
            try {
                for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
                    const counter = await gateway.get<CounterEntity>(pokerEntities.counter, counterKeyOf(roomId));
                    known = counter?.revision ?? known;
                    const next = (counter?.revision ?? 0) + 1;
                    try {
                        await gateway.transact([
                            {
                                kind: 'set',
                                entity: pokerEntities.counter,
                                key: counterKeyOf(roomId),
                                value: { roomId, revision: next },
                                when: counter ? [{ field: 'revision', operator: 'equalTo', value: counter.revision }] : undefined,
                            },
                        ]);
                        return next;
                    } catch (error) {
                        if (!(error instanceof ConditionFailedError)) {
                            throw error;
                        }
                        await casDelay(attempt);
                    }
                }
            } catch (error) {
                console.error('[poker] could not advance the room revision', error);
            }
            return known + 1;
        },

        async removeRoom(roomId) {
            const room = await gateway.get<RoomEntity>(pokerEntities.room, roomId);
            const roster = await readRoster(roomId);
            const sids = Object.keys(roster?.members ?? {});
            const issueIds = (room?.issues ?? []).map((issue) => issue.id);
            if (room?.currentIssueId && !issueIds.includes(room.currentIssueId)) {
                issueIds.push(room.currentIssueId);
            }

            const headers = await gateway.batchGet<VoteEntity>(
                pokerEntities.vote,
                issueIds.map((issueId) => voteKeyOf(roomId, issueId)),
            );
            const operations: TransactionOperation[] = [];
            for (const header of headers.values()) {
                for (const sid of sids) {
                    operations.push({ kind: 'delete', entity: pokerEntities.vote, key: entryKeyOf(roomId, header.issueId, sid) });
                }
                operations.push({ kind: 'delete', entity: pokerEntities.vote, key: voteKeyOf(roomId, header.issueId) });
            }
            for (const memberKey of Object.values(roster?.members ?? {})) {
                operations.push({ kind: 'delete', entity: pokerEntities.participant, key: participantKeyOf(roomId, memberKey) });
            }

            for (const group of [participantGroups.invite, participantGroups.request]) {
                const entities = await gateway.query<ParticipantEntity>({
                    entity: pokerEntities.participant,
                    index: pokerIndexes.participantByRoomGroup,
                    partition: [participantGroupOf(roomId, group)],
                    limit: directoryLimit,
                });
                for (const entity of entities) {
                    operations.push({ kind: 'delete', entity: pokerEntities.participant, key: participantKeyOf(roomId, entity.memberKey) });
                }
            }

            operations.push({ kind: 'delete', entity: pokerEntities.counter, key: counterKeyOf(roomId) });
            operations.push({ kind: 'delete', entity: pokerEntities.participant, key: rosterKeyOf(roomId) });
            operations.push({ kind: 'delete', entity: pokerEntities.room, key: roomId });
            await transactInBatches(operations);
        },

        async getMember(roomId, sid) {
            const memberKey = await keyOfSid(roomId, sid);
            if (!memberKey) {
                return null;
            }
            const entity = await readParticipant(roomId, memberKey);
            return isMemberEntity(entity) && entity.sid === sid ? memberRecordOf(entity) : null;
        },

        async listMembers(roomId) {
            const roster = await readRoster(roomId);
            const memberKeys = Object.values(roster?.members ?? {});
            if (memberKeys.length === 0) {
                return [];
            }
            return (await readMembers(roomId, memberKeys)).map(memberRecordOf).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
        },

        async putMember(roomId, member) {
            await changeRoster(
                roomId,
                (members) => {
                    members[member.sid] = member.memberKey;
                    return true;
                },
                async () => {
                    const existing = await readParticipant(roomId, member.memberKey);
                    const entity = memberEntityOf(roomId, member, (existing?.ver ?? 0) + 1, now());
                    return [{ kind: 'set', entity: pokerEntities.participant, key: participantKeyOf(roomId, member.memberKey), value: entity, when: conditionOn(existing) }];
                },
            );
        },

        async updateMember(roomId, sid, patch: MemberPatch) {
            const memberKey = await keyOfSid(roomId, sid);
            if (!memberKey) {
                return null;
            }
            const key = participantKeyOf(roomId, memberKey);
            for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
                const current = await readParticipant(roomId, memberKey);
                if (!isMemberEntity(current) || current.sid !== sid) {
                    return null;
                }
                const next: ParticipantEntity = storable({
                    ...current,
                    name: patch.name ?? current.name,
                    role: patch.role ?? current.role,
                    avatarId: patch.avatarId !== undefined ? patch.avatarId : current.avatarId,
                    avatarUrl: patch.avatarUrl ?? current.avatarUrl,
                    lastSeenAt: patch.lastSeenAt ?? current.lastSeenAt,
                    lastSeenMs: patch.lastSeenAt !== undefined ? Date.parse(patch.lastSeenAt) : current.lastSeenMs,
                    votedIssueIds: patch.votedIssueIds ?? current.votedIssueIds,
                    ver: current.ver + 1,
                });
                try {
                    await gateway.transact([{ kind: 'set', entity: pokerEntities.participant, key, value: next, when: [{ field: 'ver', operator: 'equalTo', value: current.ver }] }]);
                    return memberRecordOf(next);
                } catch (error) {
                    if (!(error instanceof ConditionFailedError)) {
                        throw error;
                    }
                    await casDelay(attempt);
                }
            }
            throw new BusyError('The room is busy. Please retry.');
        },

        async removeMember(roomId, sid) {
            const memberKey = await keyOfSid(roomId, sid);
            if (!memberKey) {
                return;
            }
            await changeRoster(
                roomId,
                (members) => {
                    if (!members[sid]) {
                        return false;
                    }
                    delete members[sid];
                    return true;
                },
                () => [{ kind: 'delete', entity: pokerEntities.participant, key: participantKeyOf(roomId, memberKey) }],
            );
        },

        async getVote(roomId, issueId) {
            const header = await gateway.get<VoteEntity>(pokerEntities.vote, voteKeyOf(roomId, issueId));
            if (!header) {
                return null;
            }
            return await hydrateVote(header, await rosterSids(roomId));
        },

        async listVotes(roomId) {
            const room = await readRoomEntity(roomId);
            if (!room) {
                return [];
            }
            const sids = await rosterSids(roomId);
            const issueIds = room.issues.map((issue) => issue.id);
            if (room.currentIssueId && !issueIds.includes(room.currentIssueId)) {
                issueIds.push(room.currentIssueId);
            }
            const headers = await gateway.batchGet<VoteEntity>(
                pokerEntities.vote,
                issueIds.map((issueId) => voteKeyOf(roomId, issueId)),
            );
            return await Promise.all([...headers.values()].map((header) => hydrateVote(header, sids)));
        },

        async removeVote(roomId, issueId) {
            await deleteVoteData(roomId, issueId, await rosterSids(roomId));
        },

        async startRound(roomId: string, round: RoundStart) {
            if (round.removeIssueId) {
                await deleteVoteData(roomId, round.removeIssueId, await rosterSids(roomId));
            }
            const header: VoteEntity = { kind: voteHeaderKind, roomId, issueId: round.vote.issueId, reveal: false, createdAt: round.vote.createdAt, values: {} };
            await writeRoom(roomId, round.roomPatch, [{ kind: 'set', entity: pokerEntities.vote, key: voteKeyOf(roomId, header.issueId), value: header }]);
            await deleteVoteEntries(roomId, header.issueId, await rosterSids(roomId));
        },

        async submitVote(roomId: string, issueId: string, sid: string, value: VoteValue): Promise<SubmitVoteOutcome> {
            const headerKey = voteKeyOf(roomId, issueId);
            const header = await gateway.get<VoteEntity>(pokerEntities.vote, headerKey);
            if (!header) {
                return { kind: 'missing' };
            }
            if (header.reveal) {
                return { kind: 'revealed' };
            }

            const entry: VoteEntryEntity = { kind: voteEntryKind, roomId, issueId, sid, value };
            try {
                await gateway.transact([
                    { kind: 'check', entity: pokerEntities.vote, key: headerKey, when: [{ field: 'reveal', operator: 'equalTo', value: false }] },
                    { kind: 'set', entity: pokerEntities.vote, key: entryKeyOf(roomId, issueId, sid), value: entry },
                ]);
            } catch (error) {
                if (!(error instanceof ConditionFailedError)) {
                    throw error;
                }
                const latest = await gateway.get<VoteEntity>(pokerEntities.vote, headerKey);
                return latest ? { kind: 'revealed' } : { kind: 'missing' };
            }

            const values = await readEntries(roomId, issueId, await rosterSids(roomId));
            values[sid] = value;
            return { kind: 'stored', vote: voteRecordOf(header, values) };
        },

        async revealVote(roomId: string, issueId: string, _summary: VoteSummaryFields) {
            const headerKey = voteKeyOf(roomId, issueId);
            const header = await gateway.get<VoteEntity>(pokerEntities.vote, headerKey);
            if (!header) {
                return null;
            }
            const sids = await rosterSids(roomId);
            if (header.reveal) {
                return await hydrateVote(header, sids);
            }
            const room = await readRoomEntity(roomId);
            if (!room) {
                return null;
            }

            const settle = (values: Record<string, VoteValue>): VoteEntity => {
                const summary = summarizeVotes(values, sids, room.scoreType);
                return storable({
                    ...header,
                    reveal: true,
                    revealedAt: new Date(now()).toISOString(),
                    values,
                    average: summary.average,
                    maxVote: summary.maxVote,
                    finalScore: summary.finalScore,
                });
            };

            let values = await readEntries(roomId, issueId, sids);
            let revealed = settle(values);
            try {
                await gateway.transact([
                    { kind: 'set', entity: pokerEntities.vote, key: headerKey, value: revealed, when: [{ field: 'reveal', operator: 'equalTo', value: false }] },
                ]);
            } catch (error) {
                if (!(error instanceof ConditionFailedError)) {
                    throw error;
                }
                const latest = await gateway.get<VoteEntity>(pokerEntities.vote, headerKey);
                return latest ? await hydrateVote(latest, sids) : null;
            }

            const lateValues = await readEntries(roomId, issueId, sids);
            if (!sameValues(lateValues, values)) {
                values = lateValues;
                revealed = settle(values);
                await gateway.set(pokerEntities.vote, headerKey, revealed);
            }
            return voteRecordOf(revealed, revealed.values);
        },

        async setFinalScore(roomId, issueId, patch) {
            const headerKey = voteKeyOf(roomId, issueId);
            const header = await gateway.get<VoteEntity>(pokerEntities.vote, headerKey);
            if (!header || !header.reveal) {
                return null;
            }
            const updated: VoteEntity = { ...header, ...patch };
            try {
                await gateway.transact([
                    { kind: 'set', entity: pokerEntities.vote, key: headerKey, value: updated, when: [{ field: 'reveal', operator: 'equalTo', value: true }] },
                ]);
            } catch (error) {
                if (error instanceof ConditionFailedError) {
                    return null;
                }
                throw error;
            }
            return voteRecordOf(updated, updated.values ?? {});
        },

        async transferModerator(roomId, fromSid, toSid, toKey) {
            for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
                const room = await readRoomEntity(roomId);
                if (!room || room.moderatorId !== fromSid) {
                    return false;
                }
                const found = await gateway.batchGet<ParticipantEntity>(pokerEntities.participant, [participantKeyOf(roomId, toKey), participantKeyOf(roomId, room.moderatorKey)]);
                const target = found.get(participantKeyOf(roomId, toKey));
                const previous = found.get(participantKeyOf(roomId, room.moderatorKey));
                if (!isMemberEntity(target) || target.sid !== toSid) {
                    return false;
                }

                const operations: TransactionOperation[] = [
                    {
                        kind: 'set',
                        entity: pokerEntities.room,
                        key: roomId,
                        value: { ...room, moderatorId: toSid, moderatorKey: toKey, ver: room.ver + 1 },
                        when: [
                            { field: 'ver', operator: 'equalTo', value: room.ver },
                            { field: 'moderatorId', operator: 'equalTo', value: fromSid },
                        ],
                    },
                    {
                        kind: 'set',
                        entity: pokerEntities.participant,
                        key: participantKeyOf(roomId, toKey),
                        value: { ...target, role: 'mod', ver: target.ver + 1 },
                        when: [{ field: 'ver', operator: 'equalTo', value: target.ver }],
                    },
                ];
                if (isMemberEntity(previous) && previous.sid === fromSid) {
                    operations.push({
                        kind: 'set',
                        entity: pokerEntities.participant,
                        key: participantKeyOf(roomId, room.moderatorKey),
                        value: { ...previous, role: 'player', ver: previous.ver + 1 },
                        when: [{ field: 'ver', operator: 'equalTo', value: previous.ver }],
                    });
                }

                try {
                    await gateway.transact(operations);
                    return true;
                } catch (error) {
                    if (!(error instanceof ConditionFailedError)) {
                        throw error;
                    }
                    await casDelay(attempt);
                }
            }
            throw new BusyError('The room is busy. Please retry.');
        },

        async getJoinRequest(roomId, memberKey) {
            const entity = await readRequestEntity(roomId, memberKey);
            return entity ? requestRecordOf(entity) : null;
        },

        async listJoinRequests(roomId) {
            const entities = await gateway.query<ParticipantEntity>({
                entity: pokerEntities.participant,
                index: pokerIndexes.participantByRoomGroup,
                partition: [participantGroupOf(roomId, participantGroups.request)],
                limit: directoryLimit,
            });
            return entities.filter((entity) => entity.requestId).map(requestRecordOf);
        },

        async putJoinRequest(request) {
            for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
                const existing = await readParticipant(request.roomId, request.memberKey);
                if (isMemberEntity(existing)) {
                    return;
                }
                const entity: ParticipantEntity = storable({
                    kind: participantRecordKind,
                    roomId: request.roomId,
                    memberKey: request.memberKey,
                    status: participantStatus.requested,
                    roomGroup: participantGroupOf(request.roomId, participantGroups.request),
                    name: request.name,
                    avatarId: request.avatarId,
                    avatarUrl: request.avatarUrl,
                    createdAt: request.createdAt,
                    createdMs: Date.parse(request.createdAt),
                    requestId: request.requestId,
                    ver: (existing?.ver ?? 0) + 1,
                });
                try {
                    await gateway.transact([
                        { kind: 'set', entity: pokerEntities.participant, key: participantKeyOf(request.roomId, request.memberKey), value: entity, when: conditionOn(existing) },
                    ]);
                    return;
                } catch (error) {
                    if (!(error instanceof ConditionFailedError)) {
                        throw error;
                    }
                    await casDelay(attempt);
                }
            }
            throw new BusyError('The room is busy. Please retry.');
        },

        async updateJoinRequest(roomId, memberKey, patch) {
            for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
                const current = await readRequestEntity(roomId, memberKey);
                if (!current || current.status !== participantStatus.requested) {
                    return null;
                }
                const next: ParticipantEntity = storable({
                    ...current,
                    status: patch.status === 'rejected' ? participantStatus.rejected : current.status,
                    reason: patch.reason ?? current.reason,
                    ver: current.ver + 1,
                });
                try {
                    await gateway.transact([
                        {
                            kind: 'set',
                            entity: pokerEntities.participant,
                            key: participantKeyOf(roomId, current.memberKey),
                            value: next,
                            when: [
                                { field: 'ver', operator: 'equalTo', value: current.ver },
                                { field: 'status', operator: 'equalTo', value: participantStatus.requested },
                            ],
                        },
                    ]);
                    return requestRecordOf(next);
                } catch (error) {
                    if (!(error instanceof ConditionFailedError)) {
                        throw error;
                    }
                    await casDelay(attempt);
                }
            }
            throw new BusyError('The room is busy. Please retry.');
        },

        async removeJoinRequest(roomId, memberKey) {
            for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
                const entity = await readRequestEntity(roomId, memberKey);
                if (!entity) {
                    return;
                }
                try {
                    await gateway.transact([
                        { kind: 'delete', entity: pokerEntities.participant, key: participantKeyOf(roomId, memberKey), when: [{ field: 'ver', operator: 'equalTo', value: entity.ver }] },
                    ]);
                    return;
                } catch (error) {
                    if (!(error instanceof ConditionFailedError)) {
                        throw error;
                    }
                    await casDelay(attempt);
                }
            }
            throw new BusyError('The room is busy. Please retry.');
        },
    };

    async function readRequestEntity(roomId: string, memberKey: string): Promise<ParticipantEntity | undefined> {
        const entity = await readParticipant(roomId, memberKey);
        const isRequest = entity?.status === participantStatus.requested || entity?.status === participantStatus.rejected;
        return entity && isRequest && entity.requestId ? entity : undefined;
    }

    function requestRecordOf(entity: ParticipantEntity): JoinRequestRecord {
        return compact({
            requestId: entity.requestId as string,
            roomId: entity.roomId,
            memberKey: entity.memberKey,
            name: entity.name,
            avatarId: entity.avatarId ?? null,
            avatarUrl: entity.avatarUrl,
            status: entity.status === participantStatus.requested ? 'pending' : (entity.status as JoinRequestRecord['status']),
            createdAt: entity.createdAt,
            reason: entity.reason,
        }) as JoinRequestRecord;
    }

    function invitationRecordOf(entity: ParticipantEntity): InvitationRecord {
        return {
            roomId: entity.roomId,
            invitee: compact({ id: entity.memberKey, name: entity.name, email: entity.email, avatarUrl: entity.avatarUrl }) as InvitationRecord['invitee'],
            invitedBy: entity.invitedBy ?? '',
            createdAt: entity.createdAt,
        };
    }

    const invitations: InvitationStore = {
        async listInvitations(roomId) {
            const entities = await gateway.query<ParticipantEntity>({
                entity: pokerEntities.participant,
                index: pokerIndexes.participantByRoomGroup,
                partition: [participantGroupOf(roomId, participantGroups.invite)],
                limit: directoryLimit,
            });
            return entities.map(invitationRecordOf);
        },

        async getInvitation(roomId, userId) {
            const entity = await readParticipant(roomId, userId);
            return entity?.status === participantStatus.invited ? invitationRecordOf(entity) : null;
        },

        async putInvitation(invitation) {
            const memberKey = invitation.invitee.id;
            for (let attempt = 1; attempt <= casRetry.maxAttempts; attempt += 1) {
                const existing = await readParticipant(invitation.roomId, memberKey);
                if (isMemberEntity(existing)) {
                    return;
                }
                const entity: ParticipantEntity = storable({
                    kind: participantRecordKind,
                    roomId: invitation.roomId,
                    memberKey,
                    status: participantStatus.invited,
                    roomGroup: participantGroupOf(invitation.roomId, participantGroups.invite),
                    name: invitation.invitee.name,
                    email: invitation.invitee.email,
                    avatarUrl: invitation.invitee.avatarUrl,
                    createdAt: invitation.createdAt,
                    createdMs: Date.parse(invitation.createdAt),
                    invitedBy: invitation.invitedBy,
                    ver: (existing?.ver ?? 0) + 1,
                });
                try {
                    await gateway.transact([
                        { kind: 'set', entity: pokerEntities.participant, key: participantKeyOf(invitation.roomId, memberKey), value: entity, when: conditionOn(existing) },
                    ]);
                    return;
                } catch (error) {
                    if (!(error instanceof ConditionFailedError)) {
                        throw error;
                    }
                    await casDelay(attempt);
                }
            }
            throw new BusyError('The room is busy. Please retry.');
        },

        async removeInvitation(roomId, userId) {
            const entity = await readParticipant(roomId, userId);
            if (entity?.status !== participantStatus.invited) {
                return;
            }
            try {
                await gateway.transact([
                    { kind: 'delete', entity: pokerEntities.participant, key: participantKeyOf(roomId, userId), when: [{ field: 'ver', operator: 'equalTo', value: entity.ver }] },
                ]);
            } catch (error) {
                if (!(error instanceof ConditionFailedError)) {
                    throw error;
                }
            }
        },
    };

    async function liveRooms(roomIds: string[]): Promise<RoomRecord[]> {
        const entities = await gateway.batchGet<RoomEntity>(pokerEntities.room, roomIds);
        return [...entities.values()].filter((entity) => !isExpired(entity)).map((entity) => toRoomRecord(entity, 0));
    }

    async function personRecords(memberKey: string, limit: number): Promise<ParticipantEntity[]> {
        return await gateway.query<ParticipantEntity>({
            entity: pokerEntities.participant,
            index: pokerIndexes.participantByPerson,
            partition: [memberKey],
            descending: true,
            limit,
        });
    }

    const directory: DirectoryStore = {
        async listListedRooms(limit) {
            const entities = await gateway.query<RoomEntity>({
                entity: pokerEntities.room,
                index: pokerIndexes.roomByListed,
                partition: ['y'],
                descending: true,
                limit,
            });
            return entities.filter((entity) => !isExpired(entity)).map((entity) => toRoomRecord(entity, 0));
        },

        async listRoomsOfMember(memberKey, limit) {
            const states = await personRecords(memberKey, limit);
            const rooms = await liveRooms([...new Set(states.filter(isMemberEntity).map((state) => state.roomId))]);
            return rooms.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
        },

        async listInvitationsFor(userId, limit) {
            const states = await personRecords(userId, limit);
            return states.filter((state) => state.status === participantStatus.invited).map(invitationRecordOf);
        },

        async listJoinRequestsBy(memberKey, limit) {
            const states = await personRecords(memberKey, limit);
            return states.filter((state) => state.requestId && (state.status === participantStatus.requested || state.status === participantStatus.rejected)).map(requestRecordOf);
        },

        async getRooms(roomIds) {
            return roomIds.length === 0 ? [] : await liveRooms(roomIds);
        },

        async hostNames(rooms) {
            const keys = rooms.map((room) => participantKeyOf(room.roomId, room.moderatorKey));
            const found = keys.length === 0 ? new Map<string, ParticipantEntity>() : await gateway.batchGet<ParticipantEntity>(pokerEntities.participant, keys);
            const names = new Map<string, string>();
            for (const room of rooms) {
                const host = found.get(participantKeyOf(room.roomId, room.moderatorKey));
                if (isMemberEntity(host) && host.sid === room.moderatorId) {
                    names.set(room.roomId, host.name);
                }
            }
            return names;
        },
    };

    const presence: PresencePort = {
        async onlineSids(_roomId, members) {
            const cutoff = now() - offlineThresholdMs;
            return new Set(members.filter((member) => Date.parse(member.lastSeenAt) >= cutoff).map((member) => member.sid));
        },
    };

    async function findSidByKey(roomId: string, memberKey: string): Promise<string | null> {
        const entity = await readParticipant(roomId, memberKey);
        if (!isMemberEntity(entity)) {
            return null;
        }
        rememberSid(roomId, entity.sid as string, memberKey);
        return entity.sid as string;
    }

    return { store, invitations, directory, presence, findSidByKey };
}
