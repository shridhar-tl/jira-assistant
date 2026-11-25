import { create } from 'zustand';

import type { PlannerIssue } from '../shared/types';

import type { PiData } from './pi-loader';
import type { PiArt, PiDocument, PiIncomingResult, PiProgramSettings, PiSummary } from './pi-types';

export interface PiState {
    arts: PiArt[];
    plans: PiSummary[];
    settings: PiProgramSettings | null;
    canEdit: boolean;
    hiddenPlans: number;
    hiddenArts: number;
    isListLoading: boolean;
    listError: string | null;
    doc: PiDocument | null;
    data: PiData | null;
    incoming: PiIncomingResult | null;
    trackedIssues: Record<string, PlannerIssue>;
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;
}

export const usePiStore = create<PiState>(() => ({
    arts: [],
    plans: [],
    settings: null,
    canEdit: false,
    hiddenPlans: 0,
    hiddenArts: 0,
    isListLoading: false,
    listError: null,
    doc: null,
    data: null,
    incoming: null,
    trackedIssues: {},
    isLoading: false,
    error: null,
    isSaving: false,
}));
