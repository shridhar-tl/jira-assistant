import { useCallback, useMemo, useState } from 'react';

import {
    getSelectedBoardIds,
    isSameSprintSelection,
    RapidViewList,
    SprintSelector,
    syncBoardSelection,
    toSelectedBoards,
    type AgileBoard,
    type SprintSelectionMap,
} from '@components';

import type { ParameterRuntimeUIProps } from '@components/report-builder';
import type { RapidView } from '@components/shared/RapidViewList';

import { toSprintSelection } from './parameter-values';

function boardsOf(selection: SprintSelectionMap): AgileBoard[] {
    return Object.entries(selection).map(([id, sel]) => ({ id: Number(id), name: sel.name }));
}

export default function SprintsParameter({ value, onChange }: ParameterRuntimeUIProps) {
    const selection = useMemo(() => toSprintSelection(value), [value]);
    const [boards, setBoards] = useState<AgileBoard[]>(() => boardsOf(selection));

    const handleBoards = useCallback(
        (next: RapidView | RapidView[] | null) => {
            const nextBoards = toSelectedBoards(next);
            const nextSelection = syncBoardSelection(boards, selection, nextBoards);
            setBoards(nextBoards);
            onChange(getSelectedBoardIds(nextSelection).length ? nextSelection : undefined);
        },
        [boards, selection, onChange],
    );

    const handleSelection = useCallback(
        (next: SprintSelectionMap) => {
            if (!isSameSprintSelection(next, selection)) onChange(getSelectedBoardIds(next).length ? next : undefined);
        },
        [selection, onChange],
    );

    return (
        <div className="flex min-w-0 flex-col gap-2">
            <RapidViewList value={boards} onChange={handleBoards} multiple placeholder="Select agile boards" />
            <div className="flex min-w-0">
                <SprintSelector
                    boards={boards}
                    value={selection}
                    onChange={handleSelection}
                    emptyMessage="Select one or more agile boards to choose the sprints."
                />
            </div>
        </div>
    );
}
