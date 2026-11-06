import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { inject } from '@services';

import { loadHeatmapDataset } from './data-loader';
import { getCalendarRange, resolveDateRange } from './date-range';
import { buildHeatmapModel } from './load-calculator';
import { getDataSettingsKey, isScopeConfigured } from './settings';
import type { HeatmapDataset, HeatmapDateRange, HeatmapModel, HeatmapRangeMode, WorkloadHeatmapSettings } from './types';

interface RangeNavigation {
    mode: HeatmapRangeMode;
    offset: number;
}

interface RangeState {
    range: HeatmapDateRange;
    warning?: string;
}

export interface WorkloadHeatmapState {
    model: HeatmapModel | null;
    range: HeatmapDateRange | null;
    rangeWarning?: string;
    offset: number;
    canNavigate: boolean;
    isLoading: boolean;
    error: string | null;
    isConfigured: boolean;
    setOffset: (offset: number) => void;
    reload: () => void;
}

const loadErrorMessage = 'Unable to fetch the issues from Jira. Verify the configured JQL and user groups and try again.';

function getCapacityPerDay(): number {
    const { $session } = inject('SessionService');
    const maxHours = $session.CurrentUser?.maxHours;
    return (maxHours && maxHours > 0 ? maxHours : 8) * 3600;
}

export default function useWorkloadHeatmap(settings: WorkloadHeatmapSettings): WorkloadHeatmapState {
    const [dataset, setDataset] = useState<HeatmapDataset | null>(null);
    const [rangeState, setRangeState] = useState<RangeState | null>(null);
    const [navigation, setNavigation] = useState<RangeNavigation>({ mode: settings.rangeMode, offset: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadVersion, setReloadVersion] = useState(0);

    const settingsRef = useRef(settings);
    settingsRef.current = settings;
    const requestIdRef = useRef(0);

    const isConfigured = isScopeConfigured(settings);
    const dataKey = getDataSettingsKey(settings);
    const offset = navigation.mode === settings.rangeMode ? navigation.offset : 0;
    const boardId = settings.board?.id;

    useEffect(() => {
        if (!isScopeConfigured(settingsRef.current)) {
            setDataset(null);
            return;
        }

        const requestId = ++requestIdRef.current;
        setIsLoading(true);
        setError(null);

        loadHeatmapDataset(settingsRef.current)
            .then((result) => {
                if (requestId === requestIdRef.current) {
                    setDataset(result);
                }
            })
            .catch((err: unknown) => {
                console.error('Failed to load workload heatmap data:', err);
                if (requestId === requestIdRef.current) {
                    setDataset(null);
                    setError(loadErrorMessage);
                }
            })
            .finally(() => {
                if (requestId === requestIdRef.current) {
                    setIsLoading(false);
                }
            });
    }, [dataKey, reloadVersion]);

    useEffect(() => {
        let cancelled = false;
        const { rangeMode, board } = settingsRef.current;

        resolveDateRange(rangeMode, board, offset)
            .then((result) => {
                if (!cancelled) {
                    setRangeState(result);
                }
            })
            .catch((err: unknown) => {
                console.error('Failed to resolve workload heatmap date range:', err);
                if (!cancelled) {
                    setRangeState({ range: getCalendarRange('week', 0) });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [settings.rangeMode, boardId, offset, reloadVersion]);

    const model = useMemo(
        () => (dataset && rangeState ? buildHeatmapModel(dataset, settings, rangeState.range, getCapacityPerDay()) : null),
        [dataset, rangeState, settings],
    );

    const setOffset = useCallback(
        (value: number) => setNavigation({ mode: settingsRef.current.rangeMode, offset: Math.max(0, value) }),
        [],
    );

    const reload = useCallback(() => setReloadVersion((v) => v + 1), []);

    return {
        model,
        range: rangeState?.range || null,
        rangeWarning: rangeState?.warning,
        offset,
        canNavigate: settings.rangeMode !== 'sprint',
        isLoading,
        error,
        isConfigured,
        setOffset,
        reload,
    };
}
