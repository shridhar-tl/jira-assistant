import type { DependencyLinkType } from '../shared/dependencies';
import type { Terminology } from '../shared/types';

export type CadenceMode = 'aligned' | 'teamSprints';

export type RoamStatus = 'open' | 'resolved' | 'owned' | 'accepted' | 'mitigated';

export type AcceptanceStatus = 'pending' | 'accepted' | 'declined';

export type TeamDependencyStatus = 'requested' | 'committed' | 'declined' | 'delivered';

export interface PiUserRef {
    id: string;
    displayName: string;
    avatarUrl?: string;
}

export interface PiTeamRef {
    boardId: number;
    name: string;
    restricted?: boolean;
}

export interface PiArt {
    id: string;
    name: string;
    description: string;
    teams: PiTeamRef[];
    version: number;
    created: string;
    createdBy: PiUserRef | null;
    updated: string;
    updatedBy: PiUserRef | null;
}

export interface PiTeam extends PiTeamRef {
    sprintIds: number[];
}

export interface PiIteration {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isIp: boolean;
}

export interface PiMilestone {
    id: string;
    date: string;
    title: string;
    kind: 'event' | 'release';
}

export interface PiObjective {
    id: string;
    teamBoardId: number | null;
    text: string;
    committed: boolean;
    plannedValue: number | null;
    actualValue: number | null;
    issueKeys: string[];
    jiraKey?: string;
}

export interface PiAcceptance {
    status: AcceptanceStatus;
    by: PiUserRef | null;
    at: string | null;
    note: string;
}

export interface PiRisk {
    id: string;
    title: string;
    description: string;
    impact: string;
    ownerId: string | null;
    ownerName: string;
    teamBoardId: number | null;
    targetTeam: PiTeamRef | null;
    resolveBy: string | null;
    acceptance: PiAcceptance | null;
    dependencyId: string | null;
    issueKeys: string[];
    roam: RoamStatus;
    raisedBy: PiUserRef | null;
    raisedAt: string | null;
    jiraKey?: string;
}

export interface PiTeamDependency {
    id: string;
    title: string;
    description: string;
    fromBoardId: number;
    toTeam: PiTeamRef;
    neededBy: string | null;
    status: TeamDependencyStatus;
    committedDate: string | null;
    responseNote: string;
    dependantKeys: string[];
    providerKeys: string[];
    raisedBy: PiUserRef | null;
    raisedAt: string | null;
    respondedBy: PiUserRef | null;
    respondedAt: string | null;
}

export interface PiVote {
    id: string;
    teamBoardId: number | null;
    vote: number;
    date: string;
    note: string;
}

export interface PiDocument {
    id: string;
    artId: string | null;
    name: string;
    startDate: string;
    endDate: string;
    teams: PiTeam[];
    iterations: PiIteration[];
    milestones: PiMilestone[];
    objectives: PiObjective[];
    risks: PiRisk[];
    dependencies: PiTeamDependency[];
    votes: PiVote[];
    version: number;
    created: string;
    createdBy: PiUserRef | null;
    updated: string;
    updatedBy: string;
    updatedByUser: PiUserRef | null;
}

export interface PiSummary {
    id: string;
    artId: string | null;
    name: string;
    startDate: string;
    endDate: string;
    boardIds: number[];
    teams: PiTeamRef[];
    externalBoardIds: number[];
    createdBy: PiUserRef | null;
    updated: string;
    updatedBy: PiUserRef | null;
    version: number;
}

export interface PiStorageMapping {
    mode: 'ja' | 'jira';
    issueTypeId: string | null;
}

export interface PiObjectiveStorage extends PiStorageMapping {
    plannedValueField: string | null;
    actualValueField: string | null;
}

export interface PiRiskStorage extends PiStorageMapping {
    roamField: string | null;
}

export interface PiEditors {
    restricted: boolean;
    accountIds: string[];
    groupIds: string[];
    names?: Record<string, string>;
}

export interface PiProgramSettings {
    version: number;
    terminology: Terminology;
    cadence: CadenceMode;
    ipSprint: boolean;
    objectiveStorage: PiObjectiveStorage;
    riskStorage: PiRiskStorage;
    editors: PiEditors;
    featureIssueTypes: string[];
    dependencyLinkTypes: DependencyLinkType[];
}

export interface PiListResult {
    arts: PiArt[];
    plans: PiSummary[];
    settings: PiProgramSettings;
    canEdit: boolean;
    hiddenPlans: number;
    hiddenArts: number;
}

export interface PiSaveResult<T> {
    ok: boolean;
    conflict?: boolean;
    latest?: T;
    doc?: PiDocument;
    art?: PiArt;
    settings?: PiProgramSettings;
}

export interface PiIncomingItem<T> {
    piId: string;
    piName: string;
    artId: string | null;
    fromBoardName: string;
    item: T;
}

export interface PiIncomingResult {
    dependencies: PiIncomingItem<PiTeamDependency>[];
    risks: PiIncomingItem<PiRisk>[];
}

export interface PiDependencyResponse {
    status: TeamDependencyStatus;
    committedDate: string | null;
    responseNote: string;
    providerKeys: string[];
}

export interface PiRiskResponse {
    acceptance: AcceptanceStatus;
    note: string;
    roam: RoamStatus;
    ownerId: string | null;
    ownerName: string;
}

export type PiItemResponse = { kind: 'dependency'; itemId: string; response: PiDependencyResponse } | { kind: 'risk'; itemId: string; response: PiRiskResponse };
