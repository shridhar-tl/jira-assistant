import { getRiskDueState, isRiskClosed, type DueState } from './pi-progress';
import type { PiDocument, PiIncomingResult, PiRisk } from './pi-types';

export interface RiskEntry {
    risk: PiRisk;
    piId: string;
    piName: string;
    /** Raised in the open plan, so the plan can edit or delete it. */
    isOwn: boolean;
    /** Raised on a team of the open plan, so the plan accepts or declines it. */
    isOnUs: boolean;
    fromTeamName: string;
    due: DueState;
    awaitingAcceptance: boolean;
}

const dueRank: Record<DueState, number> = { overdue: 3, dueSoon: 2, ok: 1, none: 0, closed: -1 };

/** Risks raised in the plan and risks other plans raised on its teams, the most urgent first. */
export function buildRiskEntries(doc: PiDocument, incoming: PiIncomingResult | null, programName: string): RiskEntry[] {
    const ownBoards = new Set(doc.teams.map((t) => t.boardId));
    const toEntry = (risk: PiRisk, piId: string, piName: string, fromTeamName: string): RiskEntry => ({
        risk,
        piId,
        piName,
        isOwn: piId === doc.id,
        isOnUs: !!risk.targetTeam && ownBoards.has(risk.targetTeam.boardId),
        fromTeamName,
        due: getRiskDueState(risk),
        awaitingAcceptance: !!risk.targetTeam && (risk.acceptance?.status || 'pending') === 'pending' && !isRiskClosed(risk),
    });
    const own = doc.risks.map((risk) =>
        toEntry(risk, doc.id, doc.name, risk.teamBoardId ? doc.teams.find((t) => t.boardId === risk.teamBoardId)?.name || '' : programName),
    );
    const raisedOnUs = (incoming?.risks || []).map((entry) => toEntry(entry.item, entry.piId, entry.piName, entry.fromBoardName || programName));
    return [...own, ...raisedOnUs].sort((a, b) => dueRank[b.due] - dueRank[a.due] || (a.risk.resolveBy || '9').localeCompare(b.risk.resolveBy || '9'));
}

export function needsRiskAttention(entry: RiskEntry): boolean {
    return entry.due === 'overdue' || entry.due === 'dueSoon' || (entry.isOnUs && entry.awaitingAcceptance) || entry.risk.acceptance?.status === 'declined';
}
