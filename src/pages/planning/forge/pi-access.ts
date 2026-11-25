import { rejectWith, ResolverError } from '../../../common/resolver-result';
import type { PiAcceptance, PiArt, PiDocument, PiRisk, PiSummary, PiTeamDependency, PiTeamRef, PiUserRef } from '../pi-planner/pi-types';

export const restrictedTeamName = 'Restricted team';

export const noAccessToBoardMessage = 'You cannot add a team whose board you do not have access to.';
export const answerNotAllowedMessage = 'Only someone who can see the board of the team it is raised on can answer it.';

type ValidDocument = Omit<PiDocument, 'created' | 'createdBy' | 'updated' | 'updatedBy' | 'updatedByUser'>;

const unanswered: Pick<PiTeamDependency, 'status' | 'committedDate' | 'responseNote' | 'providerKeys' | 'respondedBy' | 'respondedAt'> = {
    status: 'requested',
    committedDate: null,
    responseNote: '',
    providerKeys: [],
    respondedBy: null,
    respondedAt: null,
};

const pendingAcceptance: PiAcceptance = { status: 'pending', by: null, at: null, note: '' };

function hiddenRef(ref: PiTeamRef): PiTeamRef {
    return { boardId: ref.boardId, name: restrictedTeamName, restricted: true };
}

export function boardsOfDocument(doc: Pick<PiDocument, 'teams' | 'dependencies' | 'risks' | 'objectives' | 'votes'>): number[] {
    return [
        ...doc.teams.map((t) => t.boardId),
        ...doc.dependencies.flatMap((d) => [d.fromBoardId, d.toTeam.boardId]),
        ...doc.risks.flatMap((r) => [r.teamBoardId, r.targetTeam?.boardId]),
        ...doc.objectives.map((o) => o.teamBoardId),
        ...doc.votes.map((v) => v.teamBoardId),
    ].filter((id): id is number => typeof id === 'number');
}

export function boardsOfSummary(summary: PiSummary): number[] {
    return [...summary.boardIds, ...summary.externalBoardIds];
}

export function isVisiblePlan(teamBoardIds: number[], visible: Set<number>): boolean {
    return !teamBoardIds.length || teamBoardIds.some((id) => visible.has(id));
}

const isHidden = (boardId: number | null | undefined, visible: Set<number>) => typeof boardId === 'number' && !visible.has(boardId);

export function redactDocument<T extends ValidDocument>(doc: T, visible: Set<number>): T {
    return {
        ...doc,
        teams: doc.teams.map((t) => (visible.has(t.boardId) ? t : { ...t, ...hiddenRef(t) })),
        objectives: doc.objectives.filter((o) => !isHidden(o.teamBoardId, visible)),
        votes: doc.votes.filter((v) => !isHidden(v.teamBoardId, visible)),
        risks: doc.risks.filter((r) => !isHidden(r.teamBoardId, visible)).map((r) => (r.targetTeam && isHidden(r.targetTeam.boardId, visible) ? { ...r, targetTeam: hiddenRef(r.targetTeam) } : r)),
        dependencies: doc.dependencies.filter((d) => !isHidden(d.fromBoardId, visible)).map((d) => (isHidden(d.toTeam.boardId, visible) ? { ...d, toTeam: hiddenRef(d.toTeam) } : d)),
    };
}

export function redactSummary(summary: PiSummary, visible: Set<number>): PiSummary {
    return { ...summary, teams: summary.teams.map((t) => (visible.has(t.boardId) ? t : hiddenRef(t))) };
}

export function redactArt(art: PiArt, visible: Set<number>): PiArt {
    return { ...art, teams: art.teams.map((t) => (visible.has(t.boardId) ? t : hiddenRef(t))) };
}

function teamNames(doc: ValidDocument | null): Map<number, string> {
    const names = new Map<number, string>();
    if (!doc) {
        return names;
    }
    doc.dependencies.forEach((d) => names.set(d.toTeam.boardId, d.toTeam.name));
    doc.risks.forEach((r) => r.targetTeam && names.set(r.targetTeam.boardId, r.targetTeam.name));
    doc.teams.forEach((t) => names.set(t.boardId, t.name));
    return names;
}

function restoreRef(ref: PiTeamRef, visible: Set<number>, names: Map<number, string>): PiTeamRef {
    if (visible.has(ref.boardId)) {
        return { boardId: ref.boardId, name: ref.name };
    }
    const name = names.get(ref.boardId);
    if (!name) {
        throw new ResolverError(403, noAccessToBoardMessage);
    }
    return { boardId: ref.boardId, name };
}

/**
 * The client only receives what the user may see, so the parts of hidden teams are taken from the stored plan.
 * A client cannot add, change or remove anything of a team whose board the user cannot see.
 */
export function mergeHiddenParts(incoming: ValidDocument, existing: ValidDocument | null, visible: Set<number>): ValidDocument {
    const names = teamNames(existing);
    const existingTeams = new Map((existing?.teams || []).map((t) => [t.boardId, t]));
    const teams = incoming.teams.map((t) => {
        if (visible.has(t.boardId)) {
            return t;
        }
        const stored = existingTeams.get(t.boardId);
        if (!stored) {
            throw new ResolverError(403, noAccessToBoardMessage);
        }
        return stored;
    });
    const kept = new Set(teams.map((t) => t.boardId));
    teams.push(...(existing?.teams || []).filter((t) => !visible.has(t.boardId) && !kept.has(t.boardId)));

    const hiddenOf = <T>(items: T[] | undefined, boardOf: (item: T) => number | null | undefined) => (items || []).filter((item) => isHidden(boardOf(item), visible));
    const visibleOf = <T>(items: T[], boardOf: (item: T) => number | null | undefined) => items.filter((item) => !isHidden(boardOf(item), visible));

    return {
        ...incoming,
        teams,
        objectives: [...visibleOf(incoming.objectives, (o) => o.teamBoardId), ...hiddenOf(existing?.objectives, (o) => o.teamBoardId)],
        votes: [...visibleOf(incoming.votes, (v) => v.teamBoardId), ...hiddenOf(existing?.votes, (v) => v.teamBoardId)],
        risks: [
            ...visibleOf(incoming.risks, (r) => r.teamBoardId).map((r) => (r.targetTeam ? { ...r, targetTeam: restoreRef(r.targetTeam, visible, names) } : r)),
            ...hiddenOf(existing?.risks, (r) => r.teamBoardId),
        ],
        dependencies: [
            ...visibleOf(incoming.dependencies, (d) => d.fromBoardId).map((d) => ({ ...d, toTeam: restoreRef(d.toTeam, visible, names) })),
            ...hiddenOf(existing?.dependencies, (d) => d.fromBoardId),
        ],
    };
}

function sameKeys(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((key, index) => key === b[index]);
}

function dependencyAnswerChanged(a: PiTeamDependency, b: PiTeamDependency): boolean {
    return a.status !== b.status || a.committedDate !== b.committedDate || a.responseNote !== b.responseNote || !sameKeys(a.providerKeys, b.providerKeys);
}

function acceptanceChanged(a: PiAcceptance | null, b: PiAcceptance | null): boolean {
    return (a?.status || 'pending') !== (b?.status || 'pending') || (a?.note || '') !== (b?.note || '');
}

function answerAllowed(boardId: number | null | undefined, visible: Set<number>): void {
    if (typeof boardId !== 'number' || !visible.has(boardId)) {
        throw new ResolverError(403, answerNotAllowedMessage);
    }
}

function attributeDependency(next: PiTeamDependency, previous: PiTeamDependency | undefined, caller: PiUserRef | null, now: string, visible: Set<number>): PiTeamDependency {
    if (!previous) {
        return { ...next, ...unanswered, raisedBy: caller, raisedAt: now };
    }
    const base = { ...next, raisedBy: previous.raisedBy, raisedAt: previous.raisedAt };
    if (previous.toTeam.boardId !== next.toTeam.boardId) {
        return { ...base, ...unanswered };
    }
    if (!dependencyAnswerChanged(next, previous)) {
        return { ...base, status: previous.status, committedDate: previous.committedDate, respondedBy: previous.respondedBy, respondedAt: previous.respondedAt };
    }
    answerAllowed(next.toTeam.boardId, visible);
    const committed = next.status === 'committed' || next.status === 'delivered';
    return { ...base, committedDate: committed ? next.committedDate : null, respondedBy: caller, respondedAt: now };
}

function attributeRisk(next: PiRisk, previous: PiRisk | undefined, caller: PiUserRef | null, now: string, visible: Set<number>): PiRisk {
    if (!previous) {
        return { ...next, acceptance: next.targetTeam ? pendingAcceptance : null, raisedBy: caller, raisedAt: now };
    }
    const base = { ...next, raisedBy: previous.raisedBy, raisedAt: previous.raisedAt };
    if (!next.targetTeam) {
        return { ...base, acceptance: null };
    }
    if (previous.targetTeam?.boardId !== next.targetTeam.boardId) {
        return { ...base, acceptance: pendingAcceptance };
    }
    if (!acceptanceChanged(next.acceptance, previous.acceptance)) {
        return { ...base, acceptance: previous.acceptance };
    }
    answerAllowed(next.targetTeam.boardId, visible);
    const status = next.acceptance?.status || 'pending';
    return { ...base, acceptance: { status, note: next.acceptance?.note || '', by: status === 'pending' ? null : caller, at: status === 'pending' ? null : now } };
}

export function applyAttribution(next: ValidDocument, existing: ValidDocument | null, caller: PiUserRef | null, now: string, visible: Set<number>): ValidDocument {
    const previousDependencies = new Map((existing?.dependencies || []).map((d) => [d.id, d]));
    const previousRisks = new Map((existing?.risks || []).map((r) => [r.id, r]));
    return {
        ...next,
        dependencies: next.dependencies.map((d) => (isHidden(d.fromBoardId, visible) ? d : attributeDependency(d, previousDependencies.get(d.id), caller, now, visible))),
        risks: next.risks.map((r) => (isHidden(r.teamBoardId, visible) ? r : attributeRisk(r, previousRisks.get(r.id), caller, now, visible))),
    };
}

export function ensureAllVisible(boardIds: number[], visible: Set<number>, message: string): Promise<void> {
    return boardIds.every((id) => visible.has(id)) ? Promise.resolve() : rejectWith(403, message);
}
