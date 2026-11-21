import { useCallback } from 'react';

import { isSameSprintSelection, RapidViewList, SprintSelector, toSelectedBoards, type SprintSelectionMap } from '@components';

import type { RapidView } from '@components/shared/RapidViewList';

import type { SprintsParameterValue } from '../../../types';
import { applyBoardsChange } from '../../../utils/sprints-parameter';

interface SprintsParameterProps {
    value?: SprintsParameterValue;
    range: number;
    onChange: (value?: SprintsParameterValue) => void;
}

const noBoardsMessage = 'Select one or more agile boards to choose the sprints from.';

export default function SprintsParameter({ value, range, onChange }: SprintsParameterProps) {
    const boards = value?.boards || [];

    const handleBoardsChange = useCallback(
        (selected: RapidView | RapidView[] | null) => {
            const newBoards = toSelectedBoards(selected);
            onChange(newBoards.length ? applyBoardsChange(value, newBoards, range) : undefined);
        },
        [value, range, onChange],
    );

    const handleSprintChange = useCallback(
        (selection: SprintSelectionMap) => {
            if (value && !isSameSprintSelection(selection, value.selection)) {
                onChange({ ...value, selection });
            }
        },
        [value, onChange],
    );

    return (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
                <RapidViewList value={boards} onChange={handleBoardsChange} multiple placeholder="Select agile boards" />
            </div>
            <SprintSelector boards={boards} value={value?.selection || {}} onChange={handleSprintChange} emptyMessage={noBoardsMessage} />
        </div>
    );
}
