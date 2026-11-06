import { createContext, useContext } from 'react';

import type { HeatmapIssue, UserDayLoad } from './types';

export interface CellDetails {
    kind: 'cell';
    userName: string;
    date: Date;
    load: UserDayLoad;
}

export interface IssueListDetails {
    kind: 'issues';
    title: string;
    hint: string;
    issues: HeatmapIssue[];
}

export type OverlayDetails = CellDetails | IssueListDetails;

export interface HeatmapOverlayActions {
    open: (target: HTMLElement, details: OverlayDetails) => void;
    scheduleClose: () => void;
}

const noop = () => undefined;

export const HeatmapOverlayContext = createContext<HeatmapOverlayActions>({ open: noop, scheduleClose: noop });

export function useHeatmapOverlay(): HeatmapOverlayActions {
    return useContext(HeatmapOverlayContext);
}
