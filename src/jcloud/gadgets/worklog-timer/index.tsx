import { useCallback, useEffect, useState } from 'react';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import { useWorklogStore } from '@/stores/worklog-store';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import IssueListTimer from '../../components/IssueListTimer';
import NoSettingsConfig from '../../components/NoSettingsConfig';
import TimerControl from '../../components/TimerControl';
import { type DashboardItemProps, getDashboardHostType, isDashboardItemEdit } from '../../dashboard-host';

function WorklogTimerGadget({ jiraContext }: DashboardItemProps) {
    if (isDashboardItemEdit(jiraContext)) {
        return <NoSettingsConfig hostType={getDashboardHostType(jiraContext)} />;
    }

    return <WorklogTimer />;
}

function WorklogTimer() {
    const { curState, loadTracker } = useWorklogStore();
    const isTimerStarted = !!curState?.key;
    const [showTickets, setTicketsDisp] = useState<boolean | null>(null);

    useEffect(() => {
        loadTracker();
        window.addEventListener('focus', loadTracker);
        return () => window.removeEventListener('focus', loadTracker);
    }, [loadTracker]);

    // Until the user explicitly toggles, the list stays expanded only while no timer is running.
    const ticketsVisible = showTickets ?? !isTimerStarted;
    const toggleTickets = useCallback(() => setTicketsDisp(() => !ticketsVisible), [ticketsVisible]);

    return (
        <div className="min-h-75 px-2 pb-2 sm:px-3">
            {isTimerStarted && <TimerControl />}
            {isTimerStarted && (
                <button
                    type="button"
                    className="mx-auto flex w-full max-w-125 items-center justify-center gap-1.5 rounded-lg border border-(--border-primary) bg-(--bg-secondary) py-1.5 text-xs font-semibold text-(--text-secondary) cursor-pointer transition-colors hover:bg-(--bg-hover) hover:text-(--primary-color)"
                    onClick={toggleTickets}
                >
                    <span className={`fa ${ticketsVisible ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`} />
                    {ticketsVisible ? 'Hide tickets list' : 'Load tickets list'}
                </button>
            )}
            {ticketsVisible && <IssueListTimer />}
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorklogTimerGadget));
