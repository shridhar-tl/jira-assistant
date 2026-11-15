import type { DependencyLinkType } from '../shared/dependencies';
import type { Terminology } from '../shared/types';

export type CadenceMode = 'aligned' | 'teamSprints';

export type RoamStatus = 'open' | 'resolved' | 'owned' | 'accepted' | 'mitigated';

export interface PiTeam {
    boardId: number;
    name: string;
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

export interface PiRisk {
    id: string;
    title: string;
    description: string;
    ownerId: string | null;
    ownerName: string;
    teamBoardId: number | null;
    issueKeys: string[];
    roam: RoamStatus;
    jiraKey?: string;
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
    name: string;
    startDate: string;
    endDate: string;
    teams: PiTeam[];
    iterations: PiIteration[];
    milestones: PiMilestone[];
    objectives: PiObjective[];
    risks: PiRisk[];
    votes: PiVote[];
    version: number;
    updated: string;
    updatedBy: string;
}

export interface PiSummary {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    boardIds: number[];
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
    plans: PiSummary[];
    settings: PiProgramSettings;
    canEdit: boolean;
}

export interface PiSaveResult<T> {
    ok: boolean;
    conflict?: boolean;
    latest?: T;
    doc?: PiDocument;
    settings?: PiProgramSettings;
}
