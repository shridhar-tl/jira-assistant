import { itemIdPattern, maxLinkedIssueKeys } from '../pi-planner/pi-items';
import type {
    PiAcceptance,
    PiArt,
    PiDocument,
    PiIteration,
    PiMilestone,
    PiObjective,
    PiProgramSettings,
    PiRisk,
    PiTeam,
    PiTeamDependency,
    PiTeamRef,
    PiUserRef,
    PiVote,
} from '../pi-planner/pi-types';

import {
    bool,
    dateKey,
    decimal,
    fail,
    integer,
    issueKey,
    issueKeys,
    list,
    nullable,
    oneOf,
    optionalText,
    pattern,
    record,
    text,
    timestamp,
    uniqueIds,
} from './input-validation';

export const piIdPattern = /^[a-z0-9-]{4,40}$/;

const accountIdPattern = /^[A-Za-z0-9:_-]{1,128}$/;
const issueTypeIdPattern = /^\d{1,20}$/;
const fieldIdPattern = /^[A-Za-z0-9_.-]{1,80}$/;
const groupIdPattern = /^[^\p{Cc}]{1,255}$/u;
const maxTeams = 100;
const maxItems = 500;
const maxIterations = 60;
const maxMilestones = 200;
const maxVotes = 500;
const maxSprints = 60;
const maxEditors = 500;
const maxLinkTypes = 20;
const maxJiraNameLength = 255;
const dependencyStatuses = ['requested', 'committed', 'declined', 'delivered'] as const;
const acceptanceStatuses = ['pending', 'accepted', 'declined'] as const;
const roamStatuses = ['open', 'resolved', 'owned', 'accepted', 'mitigated'] as const;

const boardId = (value: unknown, field: string) => integer(value, field, 1, Number.MAX_SAFE_INTEGER);
const itemId = (value: unknown, field: string) => pattern(value, field, itemIdPattern);

function httpsUrl(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const url = text(value, field, 2048);
    try {
        return new URL(url).protocol === 'https:' ? url : fail(field);
    } catch {
        return fail(field);
    }
}

function userRef(value: unknown, field: string): PiUserRef {
    const raw = record(value, field);
    const ref: PiUserRef = { id: pattern(raw.id, `${field} id`, accountIdPattern), displayName: text(raw.displayName, `${field} name`, maxJiraNameLength) };
    const avatarUrl = httpsUrl(raw.avatarUrl, `${field} avatar`);
    if (avatarUrl) {
        ref.avatarUrl = avatarUrl;
    }
    return ref;
}

function teamRef(value: unknown, field: string): PiTeamRef {
    const raw = record(value, field);
    return { boardId: boardId(raw.boardId, `${field} board`), name: text(raw.name, `${field} name`, maxJiraNameLength, { min: 1 }) };
}

function team(value: unknown): PiTeam {
    const raw = record(value, 'Team');
    return {
        ...teamRef({ boardId: raw.boardId, name: raw.name }, 'Team'),
        sprintIds: [...new Set(list(raw.sprintIds, 'Team sprints', maxSprints, (id) => integer(id, 'Sprint', 1, Number.MAX_SAFE_INTEGER)))],
    };
}

function iteration(value: unknown): PiIteration {
    const raw = record(value, 'Iteration');
    const result: PiIteration = {
        id: itemId(raw.id, 'Iteration id'),
        name: text(raw.name, 'Iteration name', 200, { min: 1 }),
        startDate: dateKey(raw.startDate, 'Iteration start'),
        endDate: dateKey(raw.endDate, 'Iteration end'),
        isIp: bool(raw.isIp, 'Innovation iteration'),
    };
    return result.startDate <= result.endDate ? result : fail('Iteration dates');
}

function milestone(value: unknown): PiMilestone {
    const raw = record(value, 'Milestone');
    return { id: itemId(raw.id, 'Milestone id'), date: dateKey(raw.date, 'Milestone date'), title: text(raw.title, 'Milestone title', 200, { min: 1 }), kind: oneOf(raw.kind, 'Milestone kind', ['event', 'release']) };
}

function objective(value: unknown): PiObjective {
    const raw = record(value, 'Objective');
    const result: PiObjective = {
        id: itemId(raw.id, 'Objective id'),
        teamBoardId: nullable(raw.teamBoardId, (v) => boardId(v, 'Objective team')),
        text: text(raw.text, 'Objective', 2000, { min: 1, multiline: true }),
        committed: bool(raw.committed, 'Objective commitment'),
        plannedValue: nullable(raw.plannedValue, (v) => decimal(v, 'Planned value', 0, 10)),
        actualValue: nullable(raw.actualValue, (v) => decimal(v, 'Actual value', 0, 10)),
        issueKeys: issueKeys(raw.issueKeys, 'Objective issues', maxLinkedIssueKeys),
    };
    if (raw.jiraKey !== undefined && raw.jiraKey !== null) {
        result.jiraKey = issueKey(raw.jiraKey, 'Objective issue');
    }
    return result;
}

function acceptance(value: unknown): PiAcceptance {
    const raw = record(value, 'Acceptance');
    return {
        status: oneOf(raw.status, 'Acceptance', acceptanceStatuses),
        by: nullable(raw.by, (v) => userRef(v, 'Accepted by')),
        at: nullable(raw.at, (v) => timestamp(v, 'Accepted at')),
        note: optionalText(raw.note, 'Acceptance note', 2000, { multiline: true }),
    };
}

function risk(value: unknown): PiRisk {
    const raw = record(value, 'Risk');
    const result: PiRisk = {
        id: itemId(raw.id, 'Risk id'),
        title: text(raw.title, 'Risk title', 200, { min: 1 }),
        description: optionalText(raw.description, 'Risk description', 4000, { multiline: true }),
        impact: optionalText(raw.impact, 'Risk impact', 2000, { multiline: true }),
        ownerId: nullable(raw.ownerId, (v) => pattern(v, 'Risk owner', accountIdPattern)),
        ownerName: optionalText(raw.ownerName, 'Risk owner name', maxJiraNameLength),
        teamBoardId: nullable(raw.teamBoardId, (v) => boardId(v, 'Risk team')),
        targetTeam: nullable(raw.targetTeam, (v) => teamRef(v, 'Risk target team')),
        resolveBy: nullable(raw.resolveBy, (v) => dateKey(v, 'Resolve by')),
        acceptance: nullable(raw.acceptance, acceptance),
        dependencyId: nullable(raw.dependencyId, (v) => itemId(v, 'Risk dependency')),
        issueKeys: issueKeys(raw.issueKeys, 'Risk issues', maxLinkedIssueKeys),
        roam: raw.roam === undefined ? 'open' : oneOf(raw.roam, 'ROAM status', roamStatuses),
        raisedBy: nullable(raw.raisedBy, (v) => userRef(v, 'Raised by')),
        raisedAt: nullable(raw.raisedAt, (v) => timestamp(v, 'Raised at')),
    };
    if (raw.jiraKey !== undefined && raw.jiraKey !== null) {
        result.jiraKey = issueKey(raw.jiraKey, 'Risk issue');
    }
    return result;
}

function dependency(value: unknown): PiTeamDependency {
    const raw = record(value, 'Dependency');
    return {
        id: itemId(raw.id, 'Dependency id'),
        title: text(raw.title, 'Dependency title', 200, { min: 1 }),
        description: optionalText(raw.description, 'Dependency details', 2000, { multiline: true }),
        fromBoardId: boardId(raw.fromBoardId, 'Dependency team'),
        toTeam: teamRef(raw.toTeam, 'Providing team'),
        neededBy: nullable(raw.neededBy, (v) => dateKey(v, 'Needed by')),
        status: oneOf(raw.status, 'Dependency status', dependencyStatuses),
        committedDate: nullable(raw.committedDate, (v) => dateKey(v, 'Committed date')),
        responseNote: optionalText(raw.responseNote, 'Answer', 2000, { multiline: true }),
        dependantKeys: issueKeys(raw.dependantKeys, 'Dependant issues', maxLinkedIssueKeys),
        providerKeys: issueKeys(raw.providerKeys, 'Providing issues', maxLinkedIssueKeys),
        raisedBy: nullable(raw.raisedBy, (v) => userRef(v, 'Raised by')),
        raisedAt: nullable(raw.raisedAt, (v) => timestamp(v, 'Raised at')),
        respondedBy: nullable(raw.respondedBy, (v) => userRef(v, 'Answered by')),
        respondedAt: nullable(raw.respondedAt, (v) => timestamp(v, 'Answered at')),
    };
}

function vote(value: unknown): PiVote {
    const raw = record(value, 'Vote');
    return {
        id: itemId(raw.id, 'Vote id'),
        teamBoardId: nullable(raw.teamBoardId, (v) => boardId(v, 'Vote team')),
        vote: integer(raw.vote, 'Vote', 1, 5),
        date: timestamp(raw.date, 'Vote date'),
        note: optionalText(raw.note, 'Vote note', 2000, { multiline: true }),
    };
}

export function validateDocument(value: unknown): Omit<PiDocument, 'created' | 'createdBy' | 'updated' | 'updatedBy' | 'updatedByUser'> {
    const raw = record(value, 'Plan');
    const startDate = dateKey(raw.startDate, 'Plan start');
    const endDate = dateKey(raw.endDate, 'Plan end');
    if (startDate > endDate) {
        fail('Plan dates');
    }
    const teams = list(raw.teams, 'Teams', maxTeams, team);
    if (new Set(teams.map((t) => t.boardId)).size !== teams.length) {
        fail('Teams', 'contain the same board twice');
    }
    return {
        id: pattern(raw.id, 'Plan id', piIdPattern),
        artId: nullable(raw.artId, (v) => pattern(v, 'Program', piIdPattern)),
        name: text(raw.name, 'Plan name', 80, { min: 1 }),
        startDate,
        endDate,
        teams,
        iterations: uniqueIds(list(raw.iterations, 'Iterations', maxIterations, iteration), 'Iterations'),
        milestones: uniqueIds(list(raw.milestones, 'Milestones', maxMilestones, milestone), 'Milestones'),
        objectives: uniqueIds(list(raw.objectives, 'Objectives', maxItems, objective), 'Objectives'),
        risks: uniqueIds(list(raw.risks, 'Risks', maxItems, risk), 'Risks'),
        dependencies: uniqueIds(list(raw.dependencies, 'Dependencies', maxItems, dependency), 'Dependencies'),
        votes: uniqueIds(list(raw.votes, 'Votes', maxVotes, vote), 'Votes'),
        version: integer(raw.version ?? 0, 'Plan version', 0, Number.MAX_SAFE_INTEGER),
    };
}

export function validateArt(value: unknown): Pick<PiArt, 'id' | 'name' | 'description' | 'teams' | 'version'> {
    const raw = record(value, 'Program');
    const teams = list(raw.teams, 'Program teams', maxTeams, (t) => teamRef(t, 'Program team'));
    if (new Set(teams.map((t) => t.boardId)).size !== teams.length) {
        fail('Program teams', 'contain the same board twice');
    }
    return {
        id: pattern(raw.id, 'Program id', piIdPattern),
        name: text(raw.name, 'Program name', 80, { min: 1 }),
        description: optionalText(raw.description, 'Program description', 2000, { multiline: true }),
        teams,
        version: integer(raw.version ?? 0, 'Program version', 0, Number.MAX_SAFE_INTEGER),
    };
}

function storageMapping(value: unknown, field: string) {
    const raw = record(value, field);
    return {
        raw,
        mode: oneOf(raw.mode, `${field} mode`, ['ja', 'jira']),
        issueTypeId: nullable(raw.issueTypeId, (v) => pattern(v, `${field} issue type`, issueTypeIdPattern)),
    };
}

const optionalField = (value: unknown, field: string) => nullable(value, (v) => pattern(v, field, fieldIdPattern));

export function validateSettings(value: unknown): PiProgramSettings {
    const raw = record(value, 'Settings');
    const objectives = storageMapping(raw.objectiveStorage, 'Objective storage');
    const risks = storageMapping(raw.riskStorage, 'Risk storage');
    const editors = record(raw.editors, 'Editors');
    const accountIds = [...new Set(list(editors.accountIds, 'Editor accounts', maxEditors, (id) => pattern(id, 'Editor account', accountIdPattern)))];
    const names: Record<string, string> = {};
    if (editors.names !== undefined && editors.names !== null) {
        const rawNames = record(editors.names, 'Editor names');
        Object.entries(rawNames)
            .filter(([id]) => accountIds.includes(id))
            .forEach(([id, name]) => (names[id] = text(name, 'Editor name', maxJiraNameLength)));
    }
    return {
        version: integer(raw.version ?? 0, 'Settings version', 0, Number.MAX_SAFE_INTEGER),
        terminology: oneOf(raw.terminology, 'Terminology', ['neutral', 'safe']),
        cadence: oneOf(raw.cadence, 'Cadence', ['aligned', 'teamSprints']),
        ipSprint: bool(raw.ipSprint, 'Innovation sprint'),
        objectiveStorage: {
            mode: objectives.mode,
            issueTypeId: objectives.issueTypeId,
            plannedValueField: optionalField(objectives.raw.plannedValueField, 'Planned value field'),
            actualValueField: optionalField(objectives.raw.actualValueField, 'Actual value field'),
        },
        riskStorage: { mode: risks.mode, issueTypeId: risks.issueTypeId, roamField: optionalField(risks.raw.roamField, 'ROAM field') },
        editors: {
            restricted: bool(editors.restricted, 'Restricted editing'),
            accountIds,
            groupIds: [...new Set(list(editors.groupIds, 'Editor groups', maxEditors, (id) => pattern(id, 'Editor group', groupIdPattern)))],
            names,
        },
        featureIssueTypes: [...new Set(list(raw.featureIssueTypes, 'Feature issue types', 50, (id) => pattern(id, 'Feature issue type', issueTypeIdPattern)))],
        dependencyLinkTypes: list(raw.dependencyLinkTypes, 'Dependency link types', maxLinkTypes, (entry) => {
            const link = record(entry, 'Dependency link type');
            return { name: text(link.name, 'Link type name', maxJiraNameLength, { min: 1 }), outwardBlocks: bool(link.outwardBlocks, 'Link direction') };
        }),
    };
}
