import { inject } from '@services';

import {
    cleanSprintSelection,
    getSelectedBoardIds,
    getSprintSelectionKey,
    type AgileBoard,
} from '@components/shared/sprint-selector';

import { DefaultWorkingDays } from '@constants';

import { parseTimeToMinutes, timePattern } from './business-time';
import { allTimeDateRange, defaultDateRange, getDateRangeKey, normalizeDateRange } from './date-range';
import {
    defaultDcIssueLimit,
    defaultDisplayColumns,
    fieldGroupPrefix,
    jqlRequiredMessage,
    maxDcIssueLimit,
    sprintBoardRequiredMessage,
    optionalIssueColumns,
    timeInStatusPageSettingsKey,
} from './constants';
import type { StoredTimeInStatusSettings, TimeInStatusSettings, WorkingTimeSettings } from './types';

const defaultDayStart = '09:00';
const defaultDayEnd = '17:00';

function toTimeValue(value: string | undefined, fallback: string): string {
    return value && timePattern.test(value) ? value : fallback;
}

function toBoards(value: unknown): AgileBoard[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((b): b is AgileBoard => !!b && typeof b === 'object' && !!(b as AgileBoard).id)
        .map(({ id, name }) => ({ id: Number(id), name: String(name || id) }));
}

function getDefaultBoards(): AgileBoard[] {
    const { $session } = inject('SessionService');
    return toBoards($session.CurrentUser?.rapidViews);
}

export function getDefaultSettings(): TimeInStatusSettings {
    return {
        scopeMode: 'jql',
        jql: '',
        userGroups: null,
        periodMode: 'dateRange',
        dateRange: defaultDateRange,
        sprintBoards: getDefaultBoards(),
        sprintSelection: {},
        view: 'bottleneck',
        groupBy: 'none',
        timelineScale: 'relative',
        workingHoursOnly: false,
        dcIssueLimit: defaultDcIssueLimit,
        displayColumns: [...defaultDisplayColumns],
        sortField: null,
        isDesc: false,
    };
}

function migrateLegacySettings({ gridSettings, ...stored }: StoredTimeInStatusSettings): Partial<TimeInStatusSettings> {
    if (stored.scopeMode || !stored.jql) {
        return stored;
    }

    // Settings saved by the older "Status wise time spent" gadget only had the JQL and sort details
    return {
        ...stored,
        view: 'issues',
        dateRange: allTimeDateRange,
        displayColumns: optionalIssueColumns.map((c) => c.id),
        sortField: gridSettings?.sortField ?? null,
        isDesc: !!gridSettings?.isDesc,
    };
}

function pickKnownSettings(defaults: TimeInStatusSettings, values: Partial<TimeInStatusSettings>): TimeInStatusSettings {
    const result: TimeInStatusSettings = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof TimeInStatusSettings)[]) {
        if (values[key] !== undefined) {
            Object.assign(result, { [key]: values[key] });
        }
    }
    return result;
}

export function normalizeSettings(stored?: StoredTimeInStatusSettings | null): TimeInStatusSettings {
    const defaults = getDefaultSettings();
    if (!stored) {
        return defaults;
    }

    const settings = pickKnownSettings(defaults, migrateLegacySettings(stored));

    settings.jql = typeof settings.jql === 'string' ? settings.jql : '';
    if (settings.scopeMode !== 'groups') {
        settings.scopeMode = 'jql';
    }
    if (!Array.isArray(settings.userGroups)) {
        settings.userGroups = null;
    }
    if (settings.view !== 'issues') {
        settings.view = 'bottleneck';
    }
    if (settings.timelineScale !== 'calendar') {
        settings.timelineScale = 'relative';
    }
    if (typeof settings.groupBy !== 'string' || !settings.groupBy) {
        settings.groupBy = 'none';
    }
    if (!Array.isArray(settings.displayColumns)) {
        settings.displayColumns = defaults.displayColumns;
    }
    settings.dateRange = normalizeDateRange(settings.dateRange);
    if (settings.periodMode !== 'sprint') {
        settings.periodMode = 'dateRange';
    }
    settings.sprintBoards = toBoards(settings.sprintBoards);
    settings.sprintSelection =
        settings.sprintSelection && typeof settings.sprintSelection === 'object'
            ? cleanSprintSelection(settings.sprintSelection, settings.sprintBoards)
            : {};
    settings.dcIssueLimit = Math.min(maxDcIssueLimit, Math.max(1, Math.floor(Number(settings.dcIssueLimit) || defaultDcIssueLimit)));
    settings.workingHoursOnly = !!settings.workingHoursOnly;
    settings.isDesc = !!settings.isDesc;

    return settings;
}

export function getPageSettings(): TimeInStatusSettings {
    const { $session } = inject('SessionService');
    return normalizeSettings($session.pageSettings?.[timeInStatusPageSettingsKey]);
}

export function savePageSettings(settings: TimeInStatusSettings): Promise<void> {
    const { $config } = inject('ConfigService');
    return $config.saveSettings(timeInStatusPageSettingsKey, { ...settings, userGroups: null });
}

export function isScopeConfigured(settings: TimeInStatusSettings): boolean {
    return settings.scopeMode === 'groups' || !!settings.jql.trim();
}

export function isPeriodSelected(settings: TimeInStatusSettings): boolean {
    return settings.periodMode !== 'sprint' || getSelectedBoardIds(settings.sprintSelection).length > 0;
}

export function getSettingsError(settings: TimeInStatusSettings): string | null {
    if (!isScopeConfigured(settings)) {
        return jqlRequiredMessage;
    }
    if (settings.periodMode === 'sprint' && !settings.sprintBoards.length) {
        return sprintBoardRequiredMessage;
    }
    return null;
}

function getPeriodKey({ periodMode, dateRange, sprintSelection }: TimeInStatusSettings): string {
    return periodMode === 'sprint' ? `sprint:${getSprintSelectionKey(sprintSelection)}` : getDateRangeKey(dateRange);
}

/**
 * Working days and hours are taken from the general settings of the user.
 * Invalid hours fall back to a standard working day.
 */
export function getWorkingTimeSettings(): WorkingTimeSettings {
    const { $session } = inject('SessionService');
    const user = $session.CurrentUser;
    let dayStart = toTimeValue(user?.startOfDay, defaultDayStart);
    let dayEnd = toTimeValue(user?.endOfDay, defaultDayEnd);

    if (parseTimeToMinutes(dayEnd) <= parseTimeToMinutes(dayStart)) {
        dayStart = defaultDayStart;
        dayEnd = defaultDayEnd;
    }

    return {
        workingDays: user?.workingDays?.length ? [...user.workingDays] : [...DefaultWorkingDays],
        dayStart,
        dayEnd,
    };
}

export function getGroupFieldId(groupBy: string): string | null {
    return groupBy.startsWith(fieldGroupPrefix) ? groupBy.substring(fieldGroupPrefix.length) : null;
}

export function getDataSettingsKey(settings: TimeInStatusSettings): string {
    const { scopeMode, userGroups, jql, groupBy } = settings;
    const needsGroups = scopeMode === 'groups' || groupBy === 'userGroup';
    const groups = needsGroups ? userGroups?.map((g) => [g.name, g.id, (g.users || []).map((u) => u.accountId || u.name)]) : null;
    return JSON.stringify({
        scopeMode,
        needsGroups,
        groups,
        jql: jql.trim(),
        period: getPeriodKey(settings),
        groupField: getGroupFieldId(groupBy),
    });
}
