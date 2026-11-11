import { inject } from '@services';

import { DefaultWorkingDays } from '@constants';

import { boardRequiredMessage, heatmapPageSettingsKey, jqlRequiredMessage } from './constants';
import type { WorkloadHeatmapSettings } from './types';

export function getDefaultSettings(): WorkloadHeatmapSettings {
    const { $session } = inject('SessionService');
    const workingDays = $session.CurrentUser?.workingDays;

    return {
        scopeMode: 'groups',
        userGroups: null,
        jql: '',
        rangeMode: 'twoWeeks',
        board: null,
        sprintId: null,
        sprintIssuesOnly: true,
        workingDays: workingDays?.length ? [...workingDays] : [...DefaultWorkingDays],
        startDateField: '',
        leadTimeDays: 0,
        includeSubtasks: true,
        projects: [],
        issueTypes: [],
    };
}

export function normalizeSettings(stored?: Partial<WorkloadHeatmapSettings> | null): WorkloadHeatmapSettings {
    const defaults = getDefaultSettings();
    if (!stored) {
        return defaults;
    }

    const settings: WorkloadHeatmapSettings = { ...defaults, ...stored };

    // Sprint range of older versions only used the dates of the active sprint without filtering the issues
    if (stored.sprintIssuesOnly === undefined && stored.rangeMode === 'sprint') {
        settings.sprintIssuesOnly = false;
    }
    settings.sprintIssuesOnly = !!settings.sprintIssuesOnly;
    settings.sprintId = typeof settings.sprintId === 'number' && settings.sprintId > 0 ? settings.sprintId : null;

    if (!Array.isArray(settings.userGroups)) {
        settings.userGroups = null;
    }
    if (!Array.isArray(settings.projects)) {
        settings.projects = [];
    }
    if (!Array.isArray(settings.issueTypes)) {
        settings.issueTypes = [];
    }
    if (!Array.isArray(settings.workingDays) || !settings.workingDays.length) {
        settings.workingDays = defaults.workingDays;
    }
    if (settings.rangeMode === 'sprint' && !settings.board) {
        settings.rangeMode = defaults.rangeMode;
    }
    settings.leadTimeDays = Math.max(0, Math.floor(Number(settings.leadTimeDays) || 0));

    return settings;
}

export function getPageSettings(): WorkloadHeatmapSettings {
    const { $session } = inject('SessionService');
    return normalizeSettings($session.pageSettings?.[heatmapPageSettingsKey]);
}

export function savePageSettings(settings: WorkloadHeatmapSettings): Promise<void> {
    const { $config } = inject('ConfigService');
    return $config.saveSettings(heatmapPageSettingsKey, { ...settings, userGroups: null });
}

export function isScopeConfigured(settings: WorkloadHeatmapSettings): boolean {
    return settings.scopeMode === 'groups' || !!settings.jql.trim();
}

export function getSettingsError(settings: WorkloadHeatmapSettings): string | null {
    if (!isScopeConfigured(settings)) {
        return jqlRequiredMessage;
    }
    if (settings.rangeMode === 'sprint' && !settings.board) {
        return boardRequiredMessage;
    }
    return null;
}

export function getDataSettingsKey(settings: WorkloadHeatmapSettings): string {
    const { scopeMode, userGroups, jql, startDateField } = settings;
    const groups = userGroups?.map((g) => [g.name, g.id, (g.users || []).map((u) => u.accountId || u.name)]);
    return JSON.stringify({ scopeMode, groups, jql: jql.trim(), startDateField });
}
