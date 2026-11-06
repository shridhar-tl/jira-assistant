import { memo, useState } from 'react';

import { Button } from '@components';

import { GadgetAlert } from '../shared';

import { fallbackHistoryMessage, partialHistoryMessage } from './constants';
import type { HistoryLoadStats } from './types';

interface LoadNoticesProps {
    stats: HistoryLoadStats;
}

function LoadNotices({ stats }: LoadNoticesProps) {
    const [dismissed, setDismissed] = useState(false);
    const { partialIssueKeys, usedFallback } = stats;

    if (dismissed || (!partialIssueKeys.length && !usedFallback)) {
        return null;
    }

    return (
        <GadgetAlert
            variant="warning"
            className="shrink-0"
            action={<Button layout="plain" size="xs" leftIcon={<i className="fa fa-times" />} title="Dismiss" onClick={() => setDismissed(true)} />}
        >
            {usedFallback && fallbackHistoryMessage}{' '}
            {!!partialIssueKeys.length && (
                <>
                    {partialHistoryMessage} <strong>{partialIssueKeys.join(', ')}</strong>
                </>
            )}
        </GadgetAlert>
    );
}

export default memo(LoadNotices);
