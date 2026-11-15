import { useCallback, useEffect, useRef, useState } from 'react';

import { inject } from '@services';

import type { WorklogMergeGroup, WorklogUploadOptions } from '@types';

import WorklogMergeConfirm, { type WorklogMergeDecision } from '../components/shared/WorklogMergeConfirm';

interface PendingMergeConfirmation {
    target: HTMLElement;
    plan: WorklogMergeGroup[];
    totalCount: number;
}

export function useWorklogMerge() {
    const { $worklog, $session } = inject('WorklogService', 'SessionService');
    const [confirmation, setConfirmation] = useState<PendingMergeConfirmation | null>(null);
    const resolverRef = useRef<((decision: WorklogMergeDecision) => void) | null>(null);

    useEffect(
        () => () => {
            resolverRef.current?.('cancel');
            resolverRef.current = null;
        },
        [],
    );

    const handleDecision = useCallback((decision: WorklogMergeDecision) => {
        const resolve = resolverRef.current;
        resolverRef.current = null;
        setConfirmation(null);
        resolve?.(decision);
    }, []);

    const resolveUploadOptions = useCallback(
        async (ids: number[], target: HTMLElement): Promise<WorklogUploadOptions | null> => {
            if ($session.CurrentUser?.worklogMergeMode !== 'confirm' || ids.length < 2) {
                return {};
            }

            let plan: WorklogMergeGroup[];
            try {
                plan = await $worklog.getWorklogMergePlan(ids);
            } catch (err) {
                console.error('Unable to prepare the worklog merge preview:', err);
                return { merge: false };
            }
            if (!plan.length) {
                return { merge: false };
            }

            resolverRef.current?.('cancel');
            const decision = await new Promise<WorklogMergeDecision>((resolve) => {
                resolverRef.current = resolve;
                setConfirmation({ target, plan, totalCount: ids.length });
            });

            if (decision === 'cancel') {
                return null;
            }
            return { merge: decision === 'merge' };
        },
        [$worklog, $session],
    );

    const mergeConfirmation = confirmation ? (
        <WorklogMergeConfirm
            target={confirmation.target}
            plan={confirmation.plan}
            totalCount={confirmation.totalCount}
            onDecision={handleDecision}
        />
    ) : null;

    return { resolveUploadOptions, mergeConfirmation };
}
