import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { isToday } from 'date-fns';

import { inject } from '@services';

import { ChangeTracker, showContextMenu } from '@components';

import { GadgetActionType } from '@constants';

import { WorklogContext } from '../common/context';
import { UserDateWiseWorklog, type DateWiseWorklogItem } from '../components/shared';
import DateRangePicker from '../controls/DateRangePicker';
import { formatTs } from '../services/utils-service';

import { GadgetContainer, dashboardEventEmitter, useBaseGadget, type BaseGadgetProps } from './BaseGadget';
import { GadgetTitle } from './constants';

function DateWiseWorklog(props: BaseGadgetProps) {
    const selectedDayRef = useRef<DateWiseWorklogItem | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);

    const gadgetHook = useBaseGadget(props, {
        title: GadgetTitle.DateWiseWorklog,
        hideExport: false,
    });

    const { setIsLoading, addWorklog, editWorklog, performAction, settingsRef, saveSettings } = gadgetHook;
    const { $worklog, $message } = inject('WorklogService', 'MessageService');
    const worklogContext = useContext(WorklogContext) as any;

    const refreshData = useCallback(() => {
        setLastUpdated(new Date());
    }, []);

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

    const uploadWorklog = useCallback(async () => {
        if (!selectedDayRef.current) return;
        const toUpload = selectedDayRef.current.ticketList.filter((t) => !t.worklogId).map((t) => t.id);
        if (!toUpload.length) return;

        setIsLoading(true);
        try {
            await $worklog.uploadWorklogs(toUpload);
            performAction(GadgetActionType.WorklogModified);
        } catch (err: any) {
            if (err.message) {
                $message.error(err.message);
            }
        } finally {
            refreshData();
            setIsLoading(false);
        }
    }, [$worklog, $message, setIsLoading, refreshData, performAction]);

    const addNewWorklog = useCallback(() => {
        if (!selectedDayRef.current) return;
        let date = new Date(selectedDayRef.current.dateLogged);
        if (isToday(date)) {
            date = new Date();
        }

        let hrsRemaining: string | null = null;
        if (selectedDayRef.current.pendingUpload > 0) {
            hrsRemaining = formatTs(selectedDayRef.current.pendingUpload, true);
        }
        addWorklog({ startTime: date, timeSpent: hrsRemaining, allowOverride: !!hrsRemaining });
    }, [addWorklog]);

    const showContext = useCallback(
        (e: React.MouseEvent, b: DateWiseWorklogItem) => {
            selectedDayRef.current = b;
            showContextMenu(e, [
                { label: 'Upload worklog', icon: 'fa fa-clock', command: uploadWorklog },
                { label: 'Add worklog', icon: 'fa fa-bookmark', command: addNewWorklog },
            ]);
        },
        [uploadWorklog, addNewWorklog],
    );

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
            <UserDateWiseWorklog
                lastUpdated={lastUpdated}
                settings={settingsRef.current}
                showContext={showContext}
                editWorklog={editWorklog}
                setLoader={setIsLoading}
            />
            <ChangeTracker
                key={worklogContext?.timerEntry?.key}
                enabled={!gadgetHook.isLoading && worklogContext?.needReload}
                onChange={refreshData}
            />
        </GadgetContainer>
    );
}

export default DateWiseWorklog;
