import { useCallback, useEffect, useState } from 'react';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import { useWorklogStore } from '@/stores/worklog-store';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import IssueListTimer from '../../components/IssueListTimer';
import TimerControl from '../../components/TimerControl';

function WorklogTimerGadget() {
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
        <div className="min-h-75">
            {isTimerStarted && <TimerControl />}
            {isTimerStarted && (
                <div
                    className="w-full text-center mt-2.5 font-semibold rounded-lg py-0.5 bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={toggleTickets}
                >
                    <span className={`fa ${ticketsVisible ? 'fa-caret-up' : 'fa-caret-down'} text-base mr-1`} />
                    {ticketsVisible ? 'Hide tickets list' : 'Load tickets list'}
                </div>
            )}
            {ticketsVisible && <IssueListTimer />}
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorklogTimerGadget));
