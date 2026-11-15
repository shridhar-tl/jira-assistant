import { useMemo } from 'react';

import { inject } from '@services';

import { Button, OverlayPanel } from '@components';

import type { WorklogMergeGroup } from '@types';

import WorklogMergeGroupCard from './WorklogMergeGroupCard';

export type WorklogMergeDecision = 'merge' | 'asIs' | 'cancel';

interface WorklogMergeConfirmProps {
    target: HTMLElement;
    plan: WorklogMergeGroup[];
    totalCount: number;
    onDecision: (decision: WorklogMergeDecision) => void;
}

const panelWidth = 'min(30rem, 94vw)';
const panelMaxHeight = 'min(26rem, 60vh)';

export default function WorklogMergeConfirm({ target, plan, totalCount, onDecision }: WorklogMergeConfirmProps) {
    const { $session } = inject('SessionService');
    const roundingMins = $session.CurrentUser?.worklogRoundingMins;

    const { mergedCount, resultCount } = useMemo(() => {
        const merged = plan.reduce((total, grp) => total + grp.worklogs.length, 0);
        return { mergedCount: merged, resultCount: totalCount - merged + plan.length };
    }, [plan, totalCount]);

    const title = (
        <span className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-(--primary-light) text-(--primary-color)">
                <i className="fa fa-compress" />
            </span>
            <span className="text-sm font-semibold text-(--text-primary)">Merge worklogs before upload?</span>
        </span>
    );

    const footer = (
        <div className="flex flex-wrap items-center justify-end gap-2 w-full">
            <Button label="Cancel" size="sm" layout="plain" onClick={() => onDecision('cancel')} className="mr-auto cursor-pointer" />
            <Button
                label="Upload as is"
                size="sm"
                layout="outlined"
                leftIcon={<i className="fa fa-upload" />}
                onClick={() => onDecision('asIs')}
                className="cursor-pointer"
            />
            <Button
                label="Merge & upload"
                size="sm"
                variant="primary"
                leftIcon={<i className="fa fa-compress" />}
                onClick={() => onDecision('merge')}
                className="cursor-pointer"
            />
        </div>
    );

    return (
        <OverlayPanel
            isOpen
            target={target}
            onClose={() => onDecision('cancel')}
            title={title}
            footer={footer}
            placement="auto"
            width={panelWidth}
            maxHeight={panelMaxHeight}
            ariaLabel="Merge worklogs before upload"
        >
            <p className="text-xs text-(--text-secondary) mb-3">
                <span className="font-semibold text-(--text-primary)">{mergedCount}</span> of {totalCount} worklog(s) logged on the same
                ticket and day can be combined. Merging uploads{' '}
                <span className="font-semibold text-(--text-primary)">{resultCount}</span> worklog(s) instead of {totalCount}.
            </p>
            <ul className="space-y-2.5">
                {plan.map((grp) => (
                    <WorklogMergeGroupCard key={`${grp.ticketNo}-${grp.dateStarted.getTime()}`} group={grp} roundingMins={roundingMins} />
                ))}
            </ul>
        </OverlayPanel>
    );
}
