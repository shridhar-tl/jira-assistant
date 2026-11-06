import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { format } from 'date-fns';

import { OverlayPanel } from '@components';

import CellIssueList from './CellIssueList';
import IssueListPopover from './IssueListPopover';
import { HeatmapOverlayContext, type HeatmapOverlayActions, type OverlayDetails } from './overlay-context';

interface HeatmapOverlayProps {
    children: ReactNode;
}

interface ActiveOverlay {
    target: HTMLElement;
    details: OverlayDetails;
}

const hideDelay = 250;

function getTitle(details: OverlayDetails): ReactNode {
    if (details.kind === 'issues') {
        return details.title;
    }
    return (
        <div className="flex flex-col">
            <span className="truncate">{details.userName}</span>
            <span className="text-xs font-normal text-(--text-secondary)">{format(details.date, 'EEEE, dd MMM yyyy')}</span>
        </div>
    );
}

export default function HeatmapOverlay({ children }: HeatmapOverlayProps) {
    const [active, setActive] = useState<ActiveOverlay | null>(null);
    const hideTimerRef = useRef<number | undefined>(undefined);

    const cancelClose = useCallback(() => window.clearTimeout(hideTimerRef.current), []);

    const close = useCallback(() => {
        window.clearTimeout(hideTimerRef.current);
        setActive(null);
    }, []);

    const scheduleClose = useCallback(() => {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = window.setTimeout(() => setActive(null), hideDelay);
    }, []);

    const open = useCallback(
        (target: HTMLElement, details: OverlayDetails) => {
            cancelClose();
            setActive({ target, details });
        },
        [cancelClose],
    );

    useEffect(() => () => window.clearTimeout(hideTimerRef.current), []);

    const actions = useMemo<HeatmapOverlayActions>(() => ({ open, scheduleClose }), [open, scheduleClose]);

    return (
        <HeatmapOverlayContext.Provider value={actions}>
            {children}
            <OverlayPanel
                isOpen={!!active}
                target={active?.target ?? null}
                onClose={close}
                title={active ? getTitle(active.details) : undefined}
                width={360}
                maxHeight={320}
                autoFocus={false}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
            >
                {active?.details.kind === 'cell' && <CellIssueList load={active.details.load} />}
                {active?.details.kind === 'issues' && <IssueListPopover hint={active.details.hint} issues={active.details.issues} />}
            </OverlayPanel>
        </HeatmapOverlayContext.Provider>
    );
}
