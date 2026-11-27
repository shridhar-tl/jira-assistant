import { useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import { useWorklogStore } from '@/stores/worklog-store';

import { Button } from '@components';

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
        <div className="min-h-75 px-2 pb-2 sm:px-3 widget:flex widget:h-full widget:min-h-0 widget:flex-col widget:overflow-y-auto widget:p-0">
            {isTimerStarted && <TimerControl />}
            {isTimerStarted && (
                <Button
                    layout="outlined"
                    size="sm"
                    className="mx-auto w-full max-w-125 shrink-0 justify-center widget:max-w-none"
                    leftIcon={<span className={classNames('fa text-[10px]', ticketsVisible ? 'fa-chevron-up' : 'fa-chevron-down')} />}
                    label={ticketsVisible ? 'Hide tickets list' : 'Load tickets list'}
                    onClick={toggleTickets}
                />
            )}
            {ticketsVisible && <IssueListTimer />}
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorklogTimerGadget));
