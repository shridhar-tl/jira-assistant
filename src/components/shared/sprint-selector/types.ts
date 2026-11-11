export interface AgileBoard {
    id: number;
    name: string;
}

export interface AgileSprint {
    id: number;
    name: string;
    state: string;
    rapidId?: number | string;
    startDate?: Date;
    endDate?: Date;
    completeDate?: Date;
    previousSprintEnd?: Date;
    nextSprintStart?: Date;
}

export interface BoardSprintSelection {
    selected?: boolean;
    name: string;
    range: number;
    custom: Record<string, boolean>;
}

export type SprintSelectionMap = Record<string, BoardSprintSelection>;

export interface SprintRangeOption {
    value: number;
    label: string;
}
