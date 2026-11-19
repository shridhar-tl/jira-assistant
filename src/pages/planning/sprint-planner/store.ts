import { create } from 'zustand';

import type { BoardData } from '../shared/board-loader';
import { setStorageConsent } from '../shared/storage-consent';
import type { RankPosition } from '../shared/jira-api';
import type { PlannedSegment, PlannerUser, SprintVelocity, StatusCategory } from '../shared/types';
import { getPlannerSettings, type PlannerSettings } from './planner-settings';

export interface IssueEdit {
    assignee?: PlannerUser | null;
    estimate?: number | null;
    startDate?: Date | null;
    dueDate?: Date | null;
}

export interface BoardFilters {
    text: string;
    assignees: string[];
    parents: string[];
    labels: string[];
    components: string[];
    issueTypes: string[];
    statusCategories: StatusCategory[];
}

export type DraftChange =
    | { id: string; kind: 'move'; label: string; keys: string[]; toColumn: string; rank: RankPosition }
    | { id: string; kind: 'fields'; label: string; key: string; fields: Record<string, unknown>; edit: IssueEdit }
    | { id: string; kind: 'segments'; label: string; key: string; segments: PlannedSegment[] }
    | { id: string; kind: 'link'; label: string; action: 'create' | 'delete'; typeName: string; inwardKey: string; outwardKey: string; linkId?: string };

export interface DraftResult {
    id: string;
    label: string;
    ok: boolean;
    message?: string;
}

export interface DraftState {
    enabled: boolean;
    changes: DraftChange[];
    snapshot: BoardData | null;
    results: DraftResult[];
    isApplying: boolean;
    progress: number;
}

export interface PlannerState {
    settings: PlannerSettings;
    activeBoardId: number | null;
    data: BoardData | null;
    isLoading: boolean;
    error: string | null;
    filters: BoardFilters;
    highlightParent: string | null;
    selection: string[];
    saving: Record<string, boolean>;
    draft: DraftState;
    velocity: SprintVelocity[] | null;
    velocityError: string | null;
    isVelocityLoading: boolean;
    teamReadOnlyReason: string | null;
}

export const emptyFilters: BoardFilters = {
    text: '',
    assignees: [],
    parents: [],
    labels: [],
    components: [],
    issueTypes: [],
    statusCategories: [],
};

function getInitialState(): PlannerState {
    const settings = getPlannerSettings();
    setStorageConsent(!!settings.storageConsentAt);
    return {
        settings,
        activeBoardId: settings.boardIds[0] ?? null,
        data: null,
        isLoading: false,
        error: null,
        filters: emptyFilters,
        highlightParent: null,
        selection: [],
        saving: {},
        draft: { enabled: settings.draftByDefault, changes: [], snapshot: null, results: [], isApplying: false, progress: 0 },
        velocity: null,
        velocityError: null,
        isVelocityLoading: false,
        teamReadOnlyReason: null,
    };
}

export const usePlannerStore = create<PlannerState>(() => getInitialState());

export function resetPlannerStore() {
    usePlannerStore.setState(getInitialState(), true);
}

export function hasActiveFilters(filters: BoardFilters): boolean {
    return (
        !!filters.text.trim() ||
        !!filters.assignees.length ||
        !!filters.parents.length ||
        !!filters.labels.length ||
        !!filters.components.length ||
        !!filters.issueTypes.length ||
        !!filters.statusCategories.length
    );
}
