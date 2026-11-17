import { useCallback } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { isSameSprintSelection, SprintSelector, type SprintSelectionMap } from '@components';

import { updateSprintSelection, usePivotConfig, useReportData } from '../store/pivot-config';
import { sprintDataSource } from '../types';
import { generateReport } from '../viewer/generator';

const noBoardsMessage = (
    <>
        No agile boards selected. Click <i className="fa fa-edit" /> icon to choose one or more agile boards.
    </>
);

export default function ReportSprintSelector() {
    const { dataSourceType, sprintBoards, sprintSelection } = usePivotConfig(
        useShallow(({ dataSourceType, sprintBoards, sprintSelection }) => ({ dataSourceType, sprintBoards, sprintSelection })),
    );

    const handleChange = useCallback(
        (selection: SprintSelectionMap) => {
            if (isSameSprintSelection(selection, sprintSelection)) {
                return;
            }

            updateSprintSelection(selection);
            if (useReportData.getState().reportData) {
                generateReport();
            }
        },
        [sprintSelection],
    );

    if (dataSourceType !== sprintDataSource) {
        return null;
    }

    return <SprintSelector boards={sprintBoards} value={sprintSelection} onChange={handleChange} emptyMessage={noBoardsMessage} />;
}
