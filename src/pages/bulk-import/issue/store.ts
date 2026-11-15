import { create } from 'zustand';

import type { ImportColumn, ImportProgress, ImportRow } from './types';

export type ImportPhase = 'idle' | 'loading' | 'importing';

interface IssueImportState {
    columns: ImportColumn[];
    rows: ImportRow[];
    source?: string;
    notices: string[];
    phase: ImportPhase;
    progress: ImportProgress;
    setData: (data: { columns: ImportColumn[]; rows: ImportRow[]; source: string; notices: string[] }) => void;
    setColumns: (columns: ImportColumn[]) => void;
    setRows: (updater: (rows: ImportRow[]) => ImportRow[]) => void;
    applyRowResults: (results: ImportRow[], force?: boolean) => void;
    setPhase: (phase: ImportPhase) => void;
    setProgress: (progress: ImportProgress) => void;
    reset: () => void;
}

const initialState = {
    columns: [] as ImportColumn[],
    rows: [] as ImportRow[],
    source: undefined,
    notices: [] as string[],
    phase: 'idle' as ImportPhase,
    progress: { current: 0, total: 0 },
};

export const useIssueImportStore = create<IssueImportState>((set) => ({
    ...initialState,
    setData: ({ columns, rows, source, notices }) => set({ columns, rows, source, notices }),
    setColumns: (columns) => set({ columns }),
    setRows: (updater) => set((state) => ({ rows: updater(state.rows) })),
    applyRowResults: (results, force) =>
        set((state) => {
            const resultMap = new Map(results.map((r) => [r.rowId, r]));
            return {
                rows: state.rows.map((row) => {
                    const result = resultMap.get(row.rowId);
                    return result && (force || result.revision === row.revision) ? result : row;
                }),
            };
        }),
    setPhase: (phase) => set({ phase }),
    setProgress: (progress) => set({ progress }),
    reset: () => set(initialState),
}));
