import { usePokerStore } from '@/stores/poker-store';

import { Button } from '@components';

import { usePokerActions } from './actions';

interface ControlBoxProps {
    variant?: 'inline' | 'floating';
}

export default function ControlBox({ variant = 'inline' }: ControlBoxProps) {
    const { sid, moderatorId, currentIssueId, viewingIssueId } = usePokerStore();
    const { revealVote, startEstimation, restartEstimation } = usePokerActions();

    const isModerator = sid === moderatorId;
    const estimating = !!(viewingIssueId && viewingIssueId === currentIssueId);
    const hasIssue = !!viewingIssueId;

    if (!isModerator || !hasIssue) {
        return null;
    }

    const wrapperClass =
        variant === 'floating'
            ? 'flex w-full items-center justify-center gap-2'
            : 'flex flex-wrap items-center gap-2';

    return (
        <div className={wrapperClass}>
            {!estimating && (
                <Button
                    variant="success"
                    size="md"
                    onClick={startEstimation}
                    leftIcon={<span className="fa fa-play" />}
                    label="Start round"
                />
            )}
            {estimating && (
                <>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={revealVote}
                        leftIcon={<span className="fa fa-eye" />}
                        label="Reveal votes"
                    />
                    <Button
                        variant="warning"
                        size="md"
                        layout="outlined"
                        onClick={restartEstimation}
                        leftIcon={<span className="fa fa-refresh" />}
                        label="Restart"
                    />
                </>
            )}
        </div>
    );
}
