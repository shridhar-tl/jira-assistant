import { create } from 'zustand';

import type { PiData } from './pi-loader';
import type { PiDocument, PiProgramSettings, PiSummary } from './pi-types';

export interface PiState {
    plans: PiSummary[];
    settings: PiProgramSettings | null;
    canEdit: boolean;
    isListLoading: boolean;
    listError: string | null;
    doc: PiDocument | null;
    data: PiData | null;
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;
}

export const usePiStore = create<PiState>(() => ({
    plans: [],
    settings: null,
    canEdit: false,
    isListLoading: false,
    listError: null,
    doc: null,
    data: null,
    isLoading: false,
    error: null,
    isSaving: false,
}));
