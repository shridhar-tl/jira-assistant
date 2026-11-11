import { memo, useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';

import { Button, Checkbox, RadioButtonGroup } from '@components';

import CustomSprintList from './CustomSprintList';
import { createBoardSelection, customSprintRange, getCustomSprintCount, sprintRangeOptions } from './sprint-utils';
import type { AgileBoard, BoardSprintSelection } from './types';

interface BoardSprintCardProps {
    board: AgileBoard;
    selection: BoardSprintSelection | undefined;
    sprintStates?: string;
    onChange: (boardId: number, selection: BoardSprintSelection) => void;
}

function BoardSprintCard({ board, selection, sprintStates, onChange }: BoardSprintCardProps) {
    const range = selection?.range ?? 0;
    const isSelected = !!selection?.selected;
    const customCount = getCustomSprintCount(selection);
    const [showSprints, setShowSprints] = useState(range === customSprintRange && !customCount);

    const update = useCallback(
        (changes: Partial<BoardSprintSelection>) => onChange(board.id, { ...createBoardSelection(board, selection), ...changes }),
        [board, selection, onChange],
    );

    const rangeItems = useMemo(
        () =>
            sprintRangeOptions.map((o) => ({
                value: String(o.value),
                label: o.value === customSprintRange && customCount ? `${o.label} (${customCount} selected)` : o.label,
            })),
        [customCount],
    );

    const handleRangeChange = (value: string) => {
        const newRange = Number(value);
        update({ range: newRange, selected: true });
        setShowSprints(newRange === customSprintRange);
    };

    const toggleSprint = (sprintId: number, checked: boolean) => {
        const custom = { ...selection?.custom };
        if (checked) {
            custom[sprintId] = true;
        } else {
            delete custom[sprintId];
        }
        update({ custom, range: customSprintRange, selected: true });
    };

    return (
        <div
            className={classNames('flex min-w-0 flex-col rounded-lg border transition-colors', {
                'border-(--primary-color) bg-(--bg-primary)': isSelected,
                'border-(--border-primary) bg-(--bg-secondary)': !isSelected,
            })}
        >
            <div className="flex items-center gap-2 border-b border-(--border-primary) px-3 py-2">
                <Checkbox checked={isSelected} onChange={(e) => update({ selected: e.value })} />
                <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold text-(--text-primary)"
                    title={board.name}
                    onClick={() => update({ selected: !isSelected })}
                >
                    {board.name}
                </button>
            </div>

            <div className={classNames('px-3 py-2', { 'opacity-70': !isSelected })}>
                {showSprints ? (
                    <div className="flex flex-col gap-2">
                        <CustomSprintList
                            boardId={board.id}
                            selected={selection?.custom || {}}
                            sprintStates={sprintStates}
                            onToggle={toggleSprint}
                        />
                        <div className="flex items-center justify-between">
                            <Button
                                layout="plain"
                                size="sm"
                                leftIcon={<i className="fa fa-arrow-left" />}
                                label="Ranges"
                                onClick={() => setShowSprints(false)}
                            />
                            <span className="text-xs text-(--text-secondary)">{customCount} selected</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <RadioButtonGroup
                            items={rangeItems}
                            value={String(range)}
                            onChange={(e) => handleRangeChange(e.value)}
                            name={`sprint_range_${board.id}`}
                            orientation="vertical"
                            ariaLabel={`Sprints of ${board.name}`}
                        />
                        {range === customSprintRange && (
                            <Button
                                layout="plain"
                                size="sm"
                                className="self-start"
                                leftIcon={<i className="fa fa-pencil" />}
                                label="Edit sprints"
                                onClick={() => setShowSprints(true)}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(BoardSprintCard);
