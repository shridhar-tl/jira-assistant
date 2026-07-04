import { useCallback, useEffect, useState } from 'react';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import { useWorklogStore } from '@/stores/worklog-store';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import IssueListTimer from '../../components/IssueListTimer';
import TimerControl from '../../components/TimerControl';

function WorklogTimerGadget() {
    const { curState, loadTracker } = useWorklogStore();
    const isTimerStarted = !!curState?.key;
    const [showTickets, setTicketsDisp] = useState(!isTimerStarted);

    useEffect(() => {
        window.addEventListener('focus', loadTracker);
        return () => window.removeEventListener('focus', loadTracker);
    }, [loadTracker]);

    const toggleTickets = useCallback(() => setTicketsDisp((t) => !t), []);

    return (
        <div className="min-h-75">
            {isTimerStarted && <TimerControl />}
            {isTimerStarted && (
                <div
                    className="w-full text-center mt-2.5 font-semibold rounded-lg py-0.5 bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={toggleTickets}
                >
                    <span className={`fa ${showTickets ? 'fa-caret-up' : 'fa-caret-down'} text-base mr-1`} />
                    {showTickets ? 'Hide tickets list' : 'Load tickets list'}
                </div>
            )}
            {(showTickets || !isTimerStarted) && <IssueListTimer />}
        </div>
    );
}

export default withInitParams(withSimpleAuth(WorklogTimerGadget));
