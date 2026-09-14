import { useCallback, useEffect, useMemo, useState } from 'react';

import { useWorklogStore } from '@/stores/worklog-store';

import { ChangeTracker } from '@components';

import { GadgetActionType } from '@constants';

import WorklogBarChart from '../components/shared/worklog-bar-chart';
import DateRangePicker from '../controls/DateRangePicker';

import { GadgetContainer, dashboardEventEmitter, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';

function WorklogBarChartGadget(props: BaseGadgetProps) {
    const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
    const { timerEntry, needReload } = useWorklogStore();

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.WorklogBarChart,
    });

    const { setIsLoading, settingsRef, saveSettings } = gadgetHook;

    const refreshData = useCallback(() => {
        setLastUpdated(new Date());
    }, []);

    const dateSelected = useCallback(
        (e: any) => {
            const date = e.value;
            settingsRef.current.dateRange = { fromDate: date[0], toDate: date[1], quickDate: e.range };
            if (date[1]) {
                refreshData();
                saveSettings();
            }
        },
        [settingsRef, refreshData, saveSettings],
    );

    useEffect(() => {
        const handler = (action: any) => {
            if (
                action?.type === GadgetActionType.AddWorklog ||
                action?.type === GadgetActionType.DeletedWorklog ||
                action?.type === GadgetActionType.WorklogModified
            ) {
                refreshData();
            }
        };
        dashboardEventEmitter.on('change', handler);
        return () => {
            dashboardEventEmitter.removeListener('change', handler);
        };
    }, [refreshData]);

    const dateRange = settingsRef.current.dateRange;

    const customActions = useMemo(() => {
        return <DateRangePicker value={dateRange} onChange={dateSelected} styles={{ marginRight: '35px' }} />;
    }, [dateRange, dateSelected]);

    return (
        <GadgetContainer
            {...props}
            gadgetHook={gadgetHook}
            refreshData={refreshData}
            customActions={customActions}
        >
            <WorklogBarChart lastUpdated={lastUpdated} settings={settingsRef.current} setLoader={setIsLoading} />
            <ChangeTracker key={timerEntry?.key} enabled={!gadgetHook.isLoading && needReload} onChange={refreshData} />
        </GadgetContainer>
    );
}

export default WorklogBarChartGadget;
