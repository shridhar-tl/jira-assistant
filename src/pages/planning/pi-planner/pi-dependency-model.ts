import type { Dependency } from '../shared/dependencies';

import { getDependencyHealth, getIssueProgress, type DependencyHealth, type IssueLookup, type IssueProgress } from './pi-progress';
import type { PiArt, PiDocument, PiIncomingResult, PiTeamDependency } from './pi-types';

export interface DependencyEntry {
    dependency: PiTeamDependency;
    piId: string;
    piName: string;
    fromTeamName: string;
    fromArtName: string | null;
    toArtName: string | null;
    /** Raised by a team of the open plan, so the plan owns it and can edit it. */
    isOwn: boolean;
    /** Raised on a team of the open plan, so the plan answers it. */
    isProvidedHere: boolean;
    crossArt: boolean;
    dependant: IssueProgress;
    provider: IssueProgress;
    health: DependencyHealth;
    riskId: string | null;
}

export interface TeamPairCount {
    fromName: string;
    toName: string;
    manual: DependencyEntry[];
    links: Dependency[];
    worst: DependencyHealth | 'link' | 'linkConflict';
}

const healthRank: Record<DependencyHealth, number> = { late: 5, declined: 4, atRisk: 3, awaiting: 2, onTrack: 1, delivered: 0 };

/** Not answered by the delivering team yet, and not already delivered by its stories. */
export function isAwaitingAnswer(entry: DependencyEntry): boolean {
    return entry.dependency.status === 'requested' && entry.health !== 'delivered';
}

export function getArtOfBoard(arts: PiArt[], boardId: number): PiArt | null {
    return arts.find((a) => a.teams.some((t) => t.boardId === boardId)) || null;
}

function isCrossArt(arts: PiArt[], sourceArtId: string | null, sourceBoardIds: number[], toBoardId: number): boolean {
    const sourceArt = sourceArtId ? arts.find((a) => a.id === sourceArtId) : null;
    if (sourceArt) {
        return !sourceArt.teams.some((t) => t.boardId === toBoardId);
    }
    const providerArt = getArtOfBoard(arts, toBoardId);
    return !!providerArt && !sourceBoardIds.includes(toBoardId);
}

/**
 * Team dependencies of the plan: those raised by its teams and those raised on its teams by other plans, which may belong to
 * other ARTs. A dependency is cross-ART when the providing team is not a team of the ART that raised it.
 */
export function buildDependencyEntries(doc: PiDocument, incoming: PiIncomingResult | null, arts: PiArt[], issues: IssueLookup, sprintEnds: Map<number, Date>): DependencyEntry[] {
    const ownBoards = doc.teams.map((t) => t.boardId);
    const artName = (id: string | null) => (id ? arts.find((a) => a.id === id)?.name || null : null);
    const toEntry = (dependency: PiTeamDependency, source: { piId: string; piName: string; artId: string | null; fromTeamName: string; boardIds: number[] }): DependencyEntry => {
        const provider = getIssueProgress(dependency.providerKeys, issues, sprintEnds);
        return {
            dependency,
            piId: source.piId,
            piName: source.piName,
            fromTeamName: source.fromTeamName,
            fromArtName: artName(source.artId),
            toArtName: getArtOfBoard(arts, dependency.toTeam.boardId)?.name || null,
            isOwn: source.piId === doc.id,
            isProvidedHere: ownBoards.includes(dependency.toTeam.boardId),
            crossArt: isCrossArt(arts, source.artId, source.boardIds, dependency.toTeam.boardId),
            dependant: getIssueProgress(dependency.dependantKeys, issues, sprintEnds),
            provider,
            health: getDependencyHealth(dependency, provider),
            riskId: source.piId === doc.id ? doc.risks.find((r) => r.dependencyId === dependency.id)?.id || null : null,
        };
    };

    const own = doc.dependencies.map((dependency) =>
        toEntry(dependency, {
            piId: doc.id,
            piName: doc.name,
            artId: doc.artId,
            fromTeamName: doc.teams.find((t) => t.boardId === dependency.fromBoardId)?.name || '',
            boardIds: ownBoards,
        }),
    );
    const raisedOnUs = (incoming?.dependencies || []).map((entry) =>
        toEntry(entry.item, { piId: entry.piId, piName: entry.piName, artId: entry.artId, fromTeamName: entry.fromBoardName, boardIds: [] }),
    );
    return [...own, ...raisedOnUs].sort((a, b) => healthRank[b.health] - healthRank[a.health] || (a.dependency.neededBy || '9').localeCompare(b.dependency.neededBy || '9'));
}

/** Dependencies between pairs of teams: raised team dependencies and issue links whose issues belong to different teams. */
export function buildTeamPairs(entries: DependencyEntry[], links: Dependency[], teamNameOfIssue: (key: string) => string | null): TeamPairCount[] {
    const pairs = new Map<string, TeamPairCount>();
    const pairOf = (fromName: string, toName: string) => {
        const id = `${fromName}>${toName}`;
        let pair = pairs.get(id);
        if (!pair) {
            pair = { fromName, toName, manual: [], links: [], worst: 'link' };
            pairs.set(id, pair);
        }
        return pair;
    };
    for (const entry of entries) {
        if (entry.fromTeamName) {
            pairOf(entry.fromTeamName, entry.dependency.toTeam.name).manual.push(entry);
        }
    }
    for (const link of links) {
        if (link.blockerDone) {
            continue;
        }
        const from = teamNameOfIssue(link.dependantKey);
        const to = teamNameOfIssue(link.blockerKey);
        if (from && to && from !== to) {
            pairOf(from, to).links.push(link);
        }
    }
    for (const pair of pairs.values()) {
        const manualWorst = pair.manual.reduce<DependencyHealth | null>((worst, e) => (!worst || healthRank[e.health] > healthRank[worst] ? e.health : worst), null);
        const linkConflict = pair.links.some((l) => l.conflict !== 'none');
        pair.worst = manualWorst && healthRank[manualWorst] >= healthRank.atRisk ? manualWorst : linkConflict ? 'linkConflict' : manualWorst || 'link';
    }
    return [...pairs.values()];
}
