import { memo, useCallback, useEffect, useRef } from 'react';

import { SprintSelector, type SprintSelectionMap } from '@components';

import { useWorklogDispatch, useWorklogStore } from '../datastore';

interface ChooseBoardProps {
    onChange?: () => void;
}

const noBoardsMessage = (
    <>
        No agile boards selected. Click <i className="fa fa-cogs" /> icon to choose one or more agile boards.
    </>
);

function ChooseBoard({ onChange }: ChooseBoardProps) {
    const { sprintBoards, selSprints } = useWorklogStore();
    const dispatch = useWorklogDispatch();
    const renderRef = useRef(true);

    useEffect(() => {
        if (renderRef.current) {
            renderRef.current = false;
            return;
        }
        onChange?.();
    }, [selSprints]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = useCallback((value: SprintSelectionMap) => dispatch({ selSprints: value }), [dispatch]);

    return <SprintSelector boards={sprintBoards} value={selSprints} onChange={handleChange} emptyMessage={noBoardsMessage} />;
}

export default memo(ChooseBoard);
