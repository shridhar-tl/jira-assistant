import { useCallback, useEffect, useState } from 'react';

import { GadgetActionType, type GadgetActionTypeValue } from '@constants';

import Calendar from '../pages/calendar/Calendar';

import { GadgetContainer, dashboardEventEmitter, useBaseGadget, type BaseGadgetProps } from './BaseGadget';

interface CalendarGadgetProps extends BaseGadgetProps {
    viewMode?: string;
}

export function CalendarGadget(props: CalendarGadgetProps) {
    const { viewMode = 'timeGridWeek' } = props;
    const [refreshKey, setRefreshKey] = useState(0);
    const [headerSlotEl, setHeaderSlotEl] = useState<HTMLDivElement | null>(null);
    const [calendarTitle, setCalendarTitle] = useState<string>('');

    const gadgetHook = useBaseGadget(props, {
        title: 'Calendar',
    });

    const { performAction } = gadgetHook;

    useEffect(() => {
        const handler = (action: any) => {
            if (
                action?.type === GadgetActionType.AddWorklog ||
                action?.type === GadgetActionType.DeletedWorklog ||
                action?.type === GadgetActionType.WorklogModified
            ) {
                setRefreshKey((k) => k + 1);
            }
        };
        dashboardEventEmitter.on('change', handler);
        return () => {
            dashboardEventEmitter.removeListener('change', handler);
        };
    }, []);

    const handleWorklogChange = useCallback(
        (actionType: GadgetActionTypeValue) => {
            performAction(actionType);
        },
        [performAction],
    );

    const customActions = <div ref={setHeaderSlotEl} className="flex items-center gap-0.5" />;

    return (
        <GadgetContainer
            {...props}
            gadgetHook={gadgetHook}
            subTitle={calendarTitle}
            customActions={customActions}
        >
            <div className="h-full">
                <Calendar
                    viewMode={viewMode}
                    isGadget
                    refreshKey={refreshKey}
                    onWorklogChange={handleWorklogChange}
                    headerSlotEl={headerSlotEl}
                    onTitleChange={setCalendarTitle}
                />
            </div>
        </GadgetContainer>
    );
}
