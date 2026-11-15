import { inject } from '@services';

import type { BarColorMode, CardDensity, SubtaskMode } from '../shared/types';

export type PlannerView = 'board' | 'capacity' | 'leave' | 'forecast' | 'health' | 'roadmap' | 'resources' | 'dependencies';

export type RoadmapZoom = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type CardField = 'epic' | 'priority' | 'estimate' | 'assignee' | 'status' | 'flags' | 'labels';

export interface DependencyLinkSetting {
    name: string;
    outwardBlocks: boolean;
}

export interface PlannerSettings {
    boardIds: number[];
    view: PlannerView;
    subtaskMode: SubtaskMode;
    showClosedSprints: boolean;
    cardDensity: CardDensity;
    cardFields: CardField[];
    barColorMode: BarColorMode;
    draftByDefault: boolean;
    collapsedColumns: Record<string, string[]>;
    startDateField: string;
    dueDateField: string;
    leadTimeDays: number;
    syncNativeDates: boolean;
    roadmapLevels: number[];
    dependencyLinkTypes: DependencyLinkSetting[];
    dependencyAwareForecast: boolean;
    roadmapZoom: RoadmapZoom;
    backlogLimit: number;
    forecastSprintCount: number;
    showEpicStrip: boolean;
    showDependencyLines: boolean;
    panelSizes: Record<string, number>;
    storageConsentAt: string | null;
}

export const plannerSettingsKey = 'sprintPlanner';

export const allCardFields: { value: CardField; label: string }[] = [
    { value: 'epic', label: 'Parent / epic' },
    { value: 'priority', label: 'Priority' },
    { value: 'estimate', label: 'Estimate' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'status', label: 'Status' },
    { value: 'flags', label: 'Warning flags' },
    { value: 'labels', label: 'Labels' },
];

export const plannerViews: { value: PlannerView; label: string; icon: string; needsSprints: boolean }[] = [
    { value: 'board', label: 'Sprint board', icon: 'fa fa-columns', needsSprints: true },
    { value: 'capacity', label: 'Capacity', icon: 'fa fa-tachometer', needsSprints: false },
    { value: 'leave', label: 'Leave', icon: 'fa fa-calendar', needsSprints: false },
    { value: 'forecast', label: 'Forecast', icon: 'fa fa-magic', needsSprints: true },
    { value: 'health', label: 'Health', icon: 'fa fa-heartbeat', needsSprints: true },
    { value: 'roadmap', label: 'Roadmap', icon: 'fa fa-road', needsSprints: false },
    { value: 'resources', label: 'Resources', icon: 'fa fa-users', needsSprints: false },
    { value: 'dependencies', label: 'Dependencies', icon: 'fa fa-link', needsSprints: false },
];

const defaultSettings: PlannerSettings = {
    boardIds: [],
    view: 'board',
    subtaskMode: 'rollup',
    showClosedSprints: false,
    cardDensity: 'detailed',
    cardFields: ['epic', 'priority', 'estimate', 'assignee', 'flags'],
    barColorMode: 'status',
    draftByDefault: false,
    collapsedColumns: {},
    startDateField: '',
    dueDateField: 'duedate',
    leadTimeDays: 0,
    syncNativeDates: true,
    roadmapLevels: [1],
    dependencyLinkTypes: [{ name: 'Blocks', outwardBlocks: true }],
    dependencyAwareForecast: true,
    roadmapZoom: 'month',
    backlogLimit: 100,
    forecastSprintCount: 6,
    showEpicStrip: true,
    showDependencyLines: false,
    panelSizes: {},
    storageConsentAt: null,
};

export function normalizePlannerSettings(stored?: Partial<PlannerSettings> | null): PlannerSettings {
    const settings: PlannerSettings = { ...defaultSettings, ...(stored || {}) };
    settings.boardIds = Array.isArray(settings.boardIds) ? settings.boardIds.filter((id) => Number.isInteger(id)) : [];
    settings.view = plannerViews.some((v) => v.value === settings.view) ? settings.view : 'board';
    settings.cardFields = Array.isArray(settings.cardFields) ? settings.cardFields : defaultSettings.cardFields;
    settings.collapsedColumns = settings.collapsedColumns && typeof settings.collapsedColumns === 'object' ? settings.collapsedColumns : {};
    settings.dependencyLinkTypes = Array.isArray(settings.dependencyLinkTypes) && settings.dependencyLinkTypes.length
        ? settings.dependencyLinkTypes
        : defaultSettings.dependencyLinkTypes;
    settings.roadmapLevels = Array.isArray(settings.roadmapLevels) && settings.roadmapLevels.length ? settings.roadmapLevels : [1];
    settings.leadTimeDays = Math.max(0, Math.floor(Number(settings.leadTimeDays) || 0));
    settings.backlogLimit = Math.min(500, Math.max(25, Math.floor(Number(settings.backlogLimit) || defaultSettings.backlogLimit)));
    settings.forecastSprintCount = Math.min(12, Math.max(1, Math.floor(Number(settings.forecastSprintCount) || 6)));
    settings.dueDateField = settings.dueDateField || 'duedate';
    settings.panelSizes = settings.panelSizes && typeof settings.panelSizes === 'object' ? settings.panelSizes : {};
    settings.storageConsentAt = typeof settings.storageConsentAt === 'string' ? settings.storageConsentAt : null;
    return settings;
}

export function getPlannerSettings(): PlannerSettings {
    const { $session } = inject('SessionService');
    return normalizePlannerSettings($session.pageSettings?.[plannerSettingsKey]);
}

export function savePlannerSettings(settings: PlannerSettings): Promise<void> {
    const { $config } = inject('ConfigService');
    return $config.saveSettings(plannerSettingsKey, settings);
}
