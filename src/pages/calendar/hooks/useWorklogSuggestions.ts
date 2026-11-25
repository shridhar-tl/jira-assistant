import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { format, subDays } from 'date-fns';

import { useService } from '@/services/injector';

import { SettingsCategory, type Worklog, type WorklogCalendarEntry } from '@types';

import { DefaultEndOfDay, DefaultStartOfDay, DefaultWorkingDays } from '@constants/settings';

import { createSuggestionEvent, createSuggestionSummaryEvent, formatTimeSpent, getTimeSpentInSeconds } from '../calendar-utils';
import { loadIssueActivity, type IssueActivity } from '../suggestions/activity-loader';
import { computeSuggestions, type BusyEntry } from '../suggestions/suggestion-engine';
import type { CalendarEvent, CalendarSettings, WorklogSuggestion } from '../types';

interface SuggestionCallbacks {
    addWorklog: (entry: WorklogCalendarEntry) => void;
    editWorklog: (entry: WorklogCalendarEntry, previousTime?: Date) => void;
    openWorklogDialog: (worklog: Partial<Worklog>) => void;
    onWorklogChanged: () => void;
}

export type SuggestionLoadMode = 'navigate' | 'expand' | 'reload';

interface LoadedRange {
    start: number;
    end: number;
}

const dismissalsSettingName = 'worklogSuggestionDismissals';
const dismissalRetentionDays = 60;
const defaultTargetHours = 8;

function pruneDismissals(keys: string[]): string[] {
    const minDateKey = format(subDays(new Date(), dismissalRetentionDays), 'yyyy-MM-dd');
    return keys.filter((key) => key >= minDateKey);
}

function toBusyEntries(events: CalendarEvent[]): BusyEntry[] {
    return events
        .filter((e) => (e.data.entryType === 1 || e.data.entryType === 2) && !e.allDay)
        .map((e) => ({
            start: new Date(e.start),
            end: new Date(e.end),
            worklog: e.data.entryType === 1 ? (e.data.sourceObject as Worklog) : undefined,
        }));
}

export function useWorklogSuggestions(enabled: boolean, events: CalendarEvent[], settings: CalendarSettings, callbacks: SuggestionCallbacks) {
    const { $session, $settings, $worklog, $message, $analytics } = useService(
        'SessionService',
        'SettingsService',
        'WorklogService',
        'MessageService',
        'AnalyticsService',
    );
    const currentUser = $session.CurrentUser;
    const userId = $session.userId;

    const [activities, setActivities] = useState<Record<string, IssueActivity>>({});
    const [range, setRange] = useState<LoadedRange | null>(null);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
    const loadedRangesRef = useRef<LoadedRange[]>([]);
    const generationRef = useRef(0);

    useEffect(() => {
        if (!enabled || !userId) {
            return;
        }
        $settings
            .getSetting(userId, SettingsCategory.PageSettings, dismissalsSettingName)
            .then((value: string[] | undefined) => {
                const kept = pruneDismissals(value || []);
                if (value && kept.length !== value.length) {
                    $settings.savePageSetting(userId, dismissalsSettingName, kept);
                }
                setDismissed(new Set(kept));
            })
            .catch((err) => console.error('Unable to load dismissed worklog suggestions', err));
    }, [enabled, userId]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadRange = useCallback(
        async (start: Date, end: Date, mode: SuggestionLoadMode) => {
            if (!enabled) {
                return;
            }

            const requested = { start: start.getTime(), end: end.getTime() };
            setRange((prev) =>
                prev && mode === 'expand' ? { start: Math.min(prev.start, requested.start), end: Math.max(prev.end, requested.end) } : requested,
            );

            if (mode === 'reload') {
                generationRef.current++;
                loadedRangesRef.current = [];
                setActivities({});
            } else if (loadedRangesRef.current.some((r) => r.start <= requested.start && r.end >= requested.end)) {
                return;
            }

            if (requested.start > Date.now()) {
                return;
            }

            const generation = generationRef.current;
            loadedRangesRef.current = [...loadedRangesRef.current, requested];
            try {
                const result = await loadIssueActivity(start, end);
                if (generation !== generationRef.current) {
                    return;
                }
                setActivities((prev) => ({ ...prev, ...Object.fromEntries(result.map((a) => [a.key, a])) }));
            } catch (err) {
                loadedRangesRef.current = loadedRangesRef.current.filter((r) => r !== requested);
                console.error('Unable to load worklog suggestions', err);
            }
        },
        [enabled],
    );

    const suggestions = useMemo(() => {
        if (!enabled || !range || !settings.showWorklogs) {
            return [];
        }

        const minHours = Number(currentUser.minHours) || Number(currentUser.maxHours) || defaultTargetHours;
        return computeSuggestions(Object.values(activities), toBusyEntries(events), {
            rangeStart: new Date(range.start),
            rangeEnd: new Date(range.end),
            startOfDay: currentUser.startOfDay || DefaultStartOfDay,
            endOfDay: currentUser.endOfDay || DefaultEndOfDay,
            workingDays: currentUser.workingDays?.length ? currentUser.workingDays : DefaultWorkingDays,
            targetHours: minHours,
            dismissed,
        });
    }, [enabled, range, settings.showWorklogs, activities, events, dismissed, currentUser]);

    const suggestionEvents = useMemo(() => {
        const byDay = new Map<string, WorklogSuggestion[]>();
        suggestions.forEach((s) => byDay.set(s.dateKey, [...(byDay.get(s.dateKey) || []), s]));

        return [
            ...suggestions.map((s) => createSuggestionEvent(s, settings)),
            ...Array.from(byDay.entries()).map(([dateKey, list]) => createSuggestionSummaryEvent(dateKey, list, settings)),
        ];
    }, [suggestions, settings]);

    const dismiss = useCallback(
        (items: WorklogSuggestion[]) => {
            if (!userId) {
                return;
            }
            const next = new Set(pruneDismissals([...dismissed]));
            items.forEach((s) => next.add(s.dismissKey));
            setDismissed(next);
            $settings.savePageSetting(userId, dismissalsSettingName, Array.from(next));
            $analytics.trackEvent('Worklog suggestion dismissed', 'User actions', undefined, items.length);
        },
        [userId, dismissed, $settings, $analytics],
    );

    const { addWorklog, editWorklog, openWorklogDialog, onWorklogChanged } = callbacks;

    const applySuggestion = useCallback(
        async (suggestion: WorklogSuggestion, quiet = false): Promise<boolean> => {
            const { id, targetWorklog, issueKey, start, timeSpentSecs } = suggestion;
            setBusyIds((prev) => new Set(prev).add(id));
            try {
                if (targetWorklog) {
                    const total = getTimeSpentInSeconds(targetWorklog.timeSpent) + timeSpentSecs;
                    const entry = await $worklog.changeWorklogTS(targetWorklog, formatTimeSpent(total));
                    editWorklog(entry);
                } else {
                    const entry = await $worklog.saveWorklog(
                        { ticketNo: issueKey, dateStarted: start, timeSpent: formatTimeSpent(timeSpentSecs) },
                        currentUser.autoUpload || undefined,
                    );
                    addWorklog(entry);
                }
                $analytics.trackEvent('Worklog suggestion accepted', 'User actions', targetWorklog ? 'Extend worklog' : 'New worklog');
                return true;
            } catch (err) {
                if (!quiet) {
                    $message.error(typeof err === 'string' ? err : `Unable to log work for ${issueKey}`);
                }
                console.error('Unable to accept worklog suggestion', err);
                return false;
            } finally {
                setBusyIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        },
        [$worklog, $message, $analytics, addWorklog, editWorklog, currentUser.autoUpload],
    );

    const acceptSuggestion = useCallback(
        async (suggestion: WorklogSuggestion) => {
            if (await applySuggestion(suggestion)) {
                onWorklogChanged();
            }
        },
        [applySuggestion, onWorklogChanged],
    );

    const reviewSuggestion = useCallback(
        (suggestion: WorklogSuggestion) => {
            if (suggestion.targetWorklog) {
                acceptSuggestion(suggestion);
                return;
            }
            openWorklogDialog({
                ticketNo: suggestion.issueKey,
                dateStarted: suggestion.start,
                timeSpent: formatTimeSpent(suggestion.timeSpentSecs),
            });
        },
        [acceptSuggestion, openWorklogDialog],
    );

    const acceptAll = useCallback(
        async (items: WorklogSuggestion[]) => {
            let failed = 0;
            for (const suggestion of items) {
                if (!(await applySuggestion(suggestion, true))) {
                    failed++;
                }
            }
            if (failed) {
                $message.warning(`${failed} of ${items.length} suggestion(s) could not be logged. Click on them to log manually.`);
            }
            if (failed < items.length) {
                onWorklogChanged();
            }
        },
        [applySuggestion, onWorklogChanged, $message],
    );

    return { suggestionEvents, busyIds, loadRange, dismiss, acceptSuggestion, reviewSuggestion, acceptAll };
}
