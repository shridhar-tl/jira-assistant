export type EstimateUnitKind = 'points' | 'hours' | 'issues';

export interface EstimateUnit {
    kind: EstimateUnitKind;
    label: string;
    shortLabel: string;
}

interface EstimateStatistic {
    statFieldId?: string;
}

export interface SprintIssueEstimate {
    estimateStatistic?: EstimateStatistic;
    currentEstimateStatistic?: EstimateStatistic;
}

export interface SprintWithEstimateUnit {
    estimateUnit: EstimateUnit;
}

export const estimateUnits: Record<EstimateUnitKind, EstimateUnit> = {
    points: { kind: 'points', label: 'Story points', shortLabel: 'SP' },
    hours: { kind: 'hours', label: 'Hours', shortLabel: 'Hrs' },
    issues: { kind: 'issues', label: 'Issue count', shortLabel: 'Issues' },
};

const timeStatFields = new Set(['timeoriginalestimate', 'timeestimate']);
const issueCountStatField = 'issueCount';
const secondsPerHour = 3600;

export function detectEstimateUnit(issues: SprintIssueEstimate[]): EstimateUnit {
    const fieldId = issues
        .map((issue) => issue.currentEstimateStatistic?.statFieldId || issue.estimateStatistic?.statFieldId)
        .find(Boolean);

    if (fieldId && timeStatFields.has(fieldId)) {
        return estimateUnits.hours;
    }
    if (fieldId === issueCountStatField) {
        return estimateUnits.issues;
    }
    return estimateUnits.points;
}

export function roundEstimate(value: number): number {
    return Math.round(value * 100) / 100;
}

export function toEstimateValue(unit: EstimateUnit, rawValue?: number | null): number {
    if (!rawValue) {
        return 0;
    }
    return unit.kind === 'hours' ? roundEstimate(rawValue / secondsPerHour) : rawValue;
}

export function getCommonEstimateUnit(sprints: SprintWithEstimateUnit[]): EstimateUnit | undefined {
    const [first] = sprints;
    if (!first) {
        return undefined;
    }
    return sprints.every((sprint) => sprint.estimateUnit.kind === first.estimateUnit.kind) ? first.estimateUnit : undefined;
}

export function getEstimateValueLabel(unit?: EstimateUnit): string {
    return unit?.label ?? 'Estimate';
}

export function getEstimateNoun(unit?: EstimateUnit): string {
    return unit?.kind === 'points' ? 'SP' : 'estimate';
}
