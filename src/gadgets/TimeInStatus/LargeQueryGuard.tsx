import { Button } from '@components';

import { dcGuardMessage } from './constants';
import TimeInStatusInfo from './TimeInStatusInfo';
import type { PendingGuard } from './types';

interface LargeQueryGuardProps {
    guard: PendingGuard;
    onRunAnyway: () => void;
}

export default function LargeQueryGuard({ guard, onRunAnyway }: LargeQueryGuardProps) {
    const { issueCount, staleCount, limit } = guard;
    const cachedCount = issueCount - staleCount;

    const note = (
        <>
            <strong>{issueCount}</strong> issues match the query{cachedCount > 0 && ` (${cachedCount} already cached)`} and the history of{' '}
            <strong>{staleCount}</strong> of them has to be fetched, which is above the limit of {limit} configured for Jira Data Center.{' '}
            {dcGuardMessage}
            <div className="mt-2">
                <Button label={`Fetch ${staleCount} issues anyway`} size="sm" layout="outlined" variant="warning" onClick={onRunAnyway} />
            </div>
        </>
    );

    return <TimeInStatusInfo note={note} noteTitle="Large query:" />;
}
