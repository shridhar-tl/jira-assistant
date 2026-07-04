import { useEffect } from 'react';

import { FullContext } from '@forge/bridge';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import { useWorklogStore } from '@/stores/worklog-store';

import withSimpleAuth from '../../layouts/authorization/simple-auth';
import TimerControl from '../components/TimerControl';

interface IssueGlanceProps {
    jiraContext: FullContext;
}

function IssueGlance({ jiraContext }: IssueGlanceProps) {
    const issueKey = jiraContext?.extension?.issue?.key;
    const { loadTracker } = useWorklogStore();

    useEffect(() => {
        window.addEventListener('focus', loadTracker);
        return () => window.removeEventListener('focus', loadTracker);
    }, [loadTracker]);

    return (
        <div className="min-h-75">
            <TimerControl curIssueKey={issueKey} />
        </div>
    );
}

export default withInitParams(withSimpleAuth(IssueGlance));
