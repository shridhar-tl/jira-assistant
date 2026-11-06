import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getErrorMessage } from '@utils/helpers';

import { inject } from '@services';

import { loadErrorMessage } from './constants';
import { getStatusList, searchReportIssues, type IssueSearchResult } from './data-loader';
import { fetchStatusHistories, planHistoryFetch, type HistoryPlan } from './history-loader';
import { getDataSettingsKey, getWorkingTimeSettings, isScopeConfigured } from './settings';
import { buildTimeInStatusModel } from './status-calculator';
import type { PendingGuard, StatusInfo, TimeInStatusDataset, TimeInStatusModel, TimeInStatusSettings } from './types';

export interface TimeInStatusState {
    model: TimeInStatusModel | null;
    dataset: TimeInStatusDataset | null;
    guard: PendingGuard | null;
    isLoading: boolean;
    loadingText: string | null;
    error: string | null;
    isConfigured: boolean;
    reload: () => void;
    runAnyway: () => void;
}

interface PendingLoad {
    search: IssueSearchResult;
    statuses: StatusInfo[];
    plan: HistoryPlan;
}

function isCloudInstance(): boolean {
    const { $session } = inject('SessionService');
    return !!$session.CurrentUser?.isAtlasCloud;
}

async function completeLoad({ search, statuses, plan }: PendingLoad): Promise<TimeInStatusDataset> {
    const fetched = await fetchStatusHistories(plan.stale, isCloudInstance());

    return {
        issues: search.issues,
        userGroups: search.userGroups,
        transitions: { ...plan.cached, ...fetched.transitions },
        statuses,
        loadStats: {
            totalIssues: search.issues.length,
            cachedIssues: search.issues.length - plan.stale.length,
            fetchedIssues: plan.stale.length,
            partialIssueKeys: fetched.partialIssueKeys,
            usedFallback: fetched.usedFallback,
        },
        now: Date.now(),
    };
}

export default function useTimeInStatus(settings: TimeInStatusSettings): TimeInStatusState {
    const [dataset, setDataset] = useState<TimeInStatusDataset | null>(null);
    const [guard, setGuard] = useState<PendingGuard | null>(null);
    const [loadingText, setLoadingText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadVersion, setReloadVersion] = useState(0);

    const settingsRef = useRef(settings);
    settingsRef.current = settings;
    const requestIdRef = useRef(0);
    const pendingRef = useRef<PendingLoad | null>(null);

    const isConfigured = isScopeConfigured(settings);
    const dataKey = getDataSettingsKey(settings);

    const finishLoad = useCallback(async (requestId: number, pending: PendingLoad) => {
        setLoadingText(pending.plan.stale.length ? `Fetching status history of ${pending.plan.stale.length} issue(s)...` : 'Calculating...');
        const result = await completeLoad(pending);
        if (requestId === requestIdRef.current) {
            setDataset(result);
        }
    }, []);

    const runLoad = useCallback(
        (load: (requestId: number) => Promise<void>) => {
            const requestId = ++requestIdRef.current;
            setError(null);

            load(requestId)
                .catch((err: unknown) => {
                    console.error('Failed to load time in status data:', err);
                    if (requestId === requestIdRef.current) {
                        setDataset(null);
                        setError(getErrorMessage(err, loadErrorMessage));
                    }
                })
                .finally(() => {
                    if (requestId === requestIdRef.current) {
                        setLoadingText(null);
                    }
                });
        },
        [],
    );

    useEffect(() => {
        pendingRef.current = null;
        setGuard(null);

        if (!isScopeConfigured(settingsRef.current)) {
            setDataset(null);
            return;
        }

        runLoad(async (requestId) => {
            setLoadingText('Fetching issues...');
            const current = settingsRef.current;
            const [search, statuses] = await Promise.all([searchReportIssues(current), getStatusList()]);
            const plan = await planHistoryFetch(search.issues);
            if (requestId !== requestIdRef.current) {
                return;
            }

            const pending: PendingLoad = { search, statuses, plan };
            if (!isCloudInstance() && plan.stale.length > current.dcIssueLimit) {
                pendingRef.current = pending;
                setDataset(null);
                setGuard({ issueCount: search.issues.length, staleCount: plan.stale.length, limit: current.dcIssueLimit });
                return;
            }

            await finishLoad(requestId, pending);
        });
    }, [dataKey, reloadVersion, runLoad, finishLoad]);

    const runAnyway = useCallback(() => {
        const pending = pendingRef.current;
        if (!pending) {
            return;
        }
        pendingRef.current = null;
        setGuard(null);
        runLoad((requestId) => finishLoad(requestId, pending));
    }, [runLoad, finishLoad]);

    const reload = useCallback(() => setReloadVersion((v) => v + 1), []);

    const { workingHoursOnly, groupBy } = settings;
    const model = useMemo(
        () => (dataset ? buildTimeInStatusModel(dataset, { groupBy, workingTime: workingHoursOnly ? getWorkingTimeSettings() : null }) : null),
        [dataset, workingHoursOnly, groupBy],
    );

    return {
        model,
        dataset,
        guard,
        isLoading: !!loadingText,
        loadingText,
        error,
        isConfigured,
        reload,
        runAnyway,
    };
}
