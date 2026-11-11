import { memo, useCallback, useRef, useState, type ReactNode } from 'react';

import classNames from 'classnames';

import { Button, OverlayPanel } from '@components';

import BoardSprintCard from './BoardSprintCard';
import { cleanSprintSelection, getSprintSelectionSummary } from './sprint-utils';
import type { AgileBoard, BoardSprintSelection, SprintSelectionMap } from './types';

interface SprintSelectorProps {
    boards: AgileBoard[];
    value: SprintSelectionMap;
    onChange: (value: SprintSelectionMap) => void;
    emptyMessage?: ReactNode;
    sprintStates?: string;
    placeholder?: string;
}

const defaultEmptyMessage = 'No agile boards are configured. Choose one or more agile boards from the settings.';

function SprintSelector({ boards, value, onChange, emptyMessage, sprintStates, placeholder = 'Choose sprint' }: SprintSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<SprintSelectionMap>(value);
    const triggerRef = useRef<HTMLSpanElement>(null);

    const summary = getSprintSelectionSummary(value);
    const draftSummary = getSprintSelectionSummary(draft);
    const hasBoards = !!boards?.length;

    const open = () => {
        setDraft(value);
        setIsOpen(true);
    };

    const cancel = useCallback(() => setIsOpen(false), []);

    const apply = useCallback(() => {
        setIsOpen(false);
        onChange(cleanSprintSelection(draft));
    }, [draft, onChange]);

    const handleBoardChange = useCallback((boardId: number, selection: BoardSprintSelection) => {
        setDraft((prev) => ({ ...prev, [boardId]: selection }));
    }, []);

    const footer = (
        <div className="flex items-center gap-2">
            <span className="me-auto truncate text-xs text-(--text-secondary)">{draftSummary || 'No sprints selected'}</span>
            <Button layout="plain" size="sm" label="Cancel" onClick={cancel} />
            <Button
                size="sm"
                variant="primary"
                leftIcon={<i className="fa fa-check" />}
                label="Apply"
                onClick={apply}
                disabled={!hasBoards}
            />
        </div>
    );

    return (
        <>
            <span ref={triggerRef} className="inline-flex">
                <Button
                    layout="outlined"
                    size="sm"
                    leftIcon={<i className="fa fa-flag-checkered" />}
                    rightIcon={<i className={classNames('fa text-[10px]', isOpen ? 'fa-chevron-up' : 'fa-chevron-down')} />}
                    label={summary || placeholder}
                    title={summary ? `Sprints: ${summary}` : placeholder}
                    className="max-w-64"
                    onClick={() => (isOpen ? apply() : open())}
                />
            </span>
            <OverlayPanel
                isOpen={isOpen}
                target={triggerRef.current}
                onClose={apply}
                title="Choose sprints"
                footer={footer}
                placement="auto"
                width={boards?.length > 1 ? 'min(40rem, 94vw)' : 'min(22rem, 94vw)'}
                maxHeight="min(32rem, 70vh)"
                ariaLabel="Choose sprints"
            >
                {hasBoards ? (
                    <div className={classNames('grid gap-3', { 'sm:grid-cols-2': boards.length > 1 })}>
                        {boards.map((board) => (
                            <BoardSprintCard
                                key={board.id}
                                board={board}
                                selection={draft[board.id]}
                                sprintStates={sprintStates}
                                onChange={handleBoardChange}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-start gap-2 text-sm text-(--text-secondary)">
                        <i className="fa fa-exclamation-triangle mt-0.5 text-(--color-warning)" />
                        <span>{emptyMessage || defaultEmptyMessage}</span>
                    </div>
                )}
            </OverlayPanel>
        </>
    );
}

export default memo(SprintSelector);
