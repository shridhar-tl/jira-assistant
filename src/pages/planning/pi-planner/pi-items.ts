import type {
    AcceptanceStatus,
    PiAcceptance,
    PiDependencyResponse,
    PiItemResponse,
    PiDocument,
    PiRisk,
    PiRiskResponse,
    PiSummary,
    PiTeamDependency,
    PiUserRef,
    RoamStatus,
    TeamDependencyStatus,
} from './pi-types';

type StoredDocument = Partial<PiDocument> & Pick<PiDocument, 'id' | 'name' | 'startDate' | 'endDate'>;
const dependencyStatuses: readonly TeamDependencyStatus[] = ['requested', 'committed', 'declined', 'delivered'];
const acceptanceStatuses: readonly AcceptanceStatus[] = ['pending', 'accepted', 'declined'];
const roamStatuses: readonly RoamStatus[] = ['open', 'resolved', 'owned', 'accepted', 'mitigated'];
const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const issueKeyPattern = /^[A-Z][A-Z0-9_]*-\d+$/;
export const itemIdPattern = /^[A-Za-z0-9-]{1,60}$/;
export const maxLinkedIssueKeys = 50;

type StoredRisk = Partial<PiRisk> & Pick<PiRisk, 'id' | 'title'>;

export function normalizeRisk(risk: StoredRisk): PiRisk {
    return {
        id: risk.id,
        title: risk.title,
        description: risk.description || '',
        impact: risk.impact || '',
        ownerId: risk.ownerId ?? null,
        ownerName: risk.ownerName || '',
        teamBoardId: risk.teamBoardId ?? null,
        targetTeam: risk.targetTeam ?? null,
        resolveBy: risk.resolveBy ?? null,
        acceptance: risk.acceptance ?? null,
        dependencyId: risk.dependencyId ?? null,
        issueKeys: risk.issueKeys || [],
        roam: risk.roam || 'open',
        raisedBy: risk.raisedBy ?? null,
        raisedAt: risk.raisedAt ?? null,
        jiraKey: risk.jiraKey,
    };
}

/** Fills the fields added after a plan was first saved, so older plans load with the current shape. */
export function normalizeDocument(doc: StoredDocument): PiDocument {
    return {
        id: doc.id,
        artId: doc.artId ?? null,
        name: doc.name,
        startDate: doc.startDate,
        endDate: doc.endDate,
        teams: doc.teams || [],
        iterations: doc.iterations || [],
        milestones: doc.milestones || [],
        objectives: doc.objectives || [],
        risks: (doc.risks || []).map(normalizeRisk),
        dependencies: doc.dependencies || [],
        votes: doc.votes || [],
        version: doc.version || 0,
        created: doc.created || '',
        createdBy: doc.createdBy ?? null,
        updated: doc.updated || '',
        updatedBy: doc.updatedBy || '',
        updatedByUser: doc.updatedByUser ?? null,
    };
}

/** Boards that items of the plan are raised on although they are not teams of the plan, e.g. a team of another ART. */
export function getExternalBoardIds(doc: PiDocument): number[] {
    const own = new Set(doc.teams.map((t) => t.boardId));
    const boards = [...doc.dependencies.map((d) => d.toTeam.boardId), ...doc.risks.map((r) => r.targetTeam?.boardId).filter((id): id is number => !!id)];
    return [...new Set(boards.filter((id) => !own.has(id)))];
}

export function toPlanSummary(doc: PiDocument): PiSummary {
    return {
        id: doc.id,
        artId: doc.artId,
        name: doc.name,
        startDate: doc.startDate,
        endDate: doc.endDate,
        boardIds: doc.teams.map((t) => t.boardId),
        teams: doc.teams.map((t) => ({ boardId: t.boardId, name: t.name })),
        externalBoardIds: getExternalBoardIds(doc),
        createdBy: doc.createdBy,
        updated: doc.updated,
        updatedBy: doc.updatedByUser,
        version: doc.version,
    };
}

export function normalizeSummary(summary: Partial<PiSummary> & Pick<PiSummary, 'id' | 'name' | 'startDate' | 'endDate'>): PiSummary {
    return {
        id: summary.id,
        artId: summary.artId ?? null,
        name: summary.name,
        startDate: summary.startDate,
        endDate: summary.endDate,
        boardIds: summary.boardIds || [],
        teams: summary.teams || [],
        externalBoardIds: summary.externalBoardIds || [],
        createdBy: summary.createdBy ?? null,
        updated: summary.updated || '',
        updatedBy: summary.updatedBy ?? null,
        version: summary.version || 0,
    };
}

/** Whether two date ranges (yyyy-MM-dd keys) overlap. Keys compare correctly as strings. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return aStart <= bEnd && bStart <= aEnd;
}

function isString(value: unknown, maxLength: number): value is string {
    return typeof value === 'string' && value.length <= maxLength;
}

function isDependencyResponse(value: PiDependencyResponse): boolean {
    return (
        dependencyStatuses.includes(value.status) &&
        (value.committedDate === null || (isString(value.committedDate, 10) && dateKeyPattern.test(value.committedDate))) &&
        isString(value.responseNote, 2000) &&
        Array.isArray(value.providerKeys) &&
        value.providerKeys.length <= 50 &&
        value.providerKeys.every((key) => isString(key, 40) && issueKeyPattern.test(key))
    );
}

function isRiskResponse(value: PiRiskResponse): boolean {
    return (
        acceptanceStatuses.includes(value.acceptance) &&
        roamStatuses.includes(value.roam) &&
        isString(value.note, 2000) &&
        (value.ownerId === null || isString(value.ownerId, 128)) &&
        isString(value.ownerName, 200)
    );
}

/** Checks the shape of an answer sent by a client before it is written into the plan that owns the item. */
export function isValidItemResponse(value: PiItemResponse | null | undefined): value is PiItemResponse {
    if (!value || typeof value !== 'object' || !value.response || typeof value.response !== 'object' || !isString(value.itemId, 60) || !itemIdPattern.test(value.itemId)) {
        return false;
    }
    if (value.kind === 'dependency') {
        return isDependencyResponse(value.response);
    }
    return value.kind === 'risk' && isRiskResponse(value.response);
}

/** The answer of the providing team to a dependency. Only these fields can be changed by the team the dependency is raised on. */
export function applyDependencyResponse(dependency: PiTeamDependency, response: PiDependencyResponse, by: PiUserRef | null, at: string): PiTeamDependency {
    return {
        ...dependency,
        status: response.status,
        committedDate: response.status === 'committed' || response.status === 'delivered' ? response.committedDate : null,
        responseNote: response.responseNote.slice(0, 2000),
        providerKeys: [...new Set(response.providerKeys)].slice(0, maxLinkedIssueKeys),
        respondedBy: by,
        respondedAt: at,
    };
}

/** The answer of the team a risk is raised on. Only these fields can be changed by that team. */
export function applyRiskResponse(risk: PiRisk, response: PiRiskResponse, by: PiUserRef | null, at: string): PiRisk {
    const acceptance: PiAcceptance = {
        status: response.acceptance,
        by: response.acceptance === 'pending' ? null : by,
        at: response.acceptance === 'pending' ? null : at,
        note: response.note.slice(0, 2000),
    };
    return { ...risk, acceptance, roam: response.roam, ownerId: response.ownerId, ownerName: response.ownerName };
}
