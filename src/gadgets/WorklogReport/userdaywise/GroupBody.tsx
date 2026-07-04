import React from 'react';

import { TBody } from '../../../components/shared';
import { useWorklogStore } from '../datastore';

import GroupRow from './GroupRow';
import { useConvertSecs } from './useReportUtils';

interface GroupBodyProps {
    boardId?: string;
    additionalCols?: any[];
    costView?: boolean;
}

export default function GroupBody({ boardId, additionalCols, costView }: GroupBodyProps) {
    const state = useWorklogStore();
    const { timeframeType, logFormat, rIndicator } = state;

    const isSprint = timeframeType === '1';
    const groupedData = isSprint ? state[`userGroup_${boardId}`] : state.groupReport?.groupedData;
    const sprintsList = isSprint ? state[`sprintsList_${boardId}`] : undefined;

    const addlColCount = (additionalCols?.length || 0) + 1;
    const timeExportFormat = logFormat === '2' ? 'float' : undefined;

    if (!groupedData) {
        return null;
    }

    return (
        <TBody className={rIndicator !== '2' ? 'no-log-bg-hl' : ''}>
            {groupedData.map((grp: any, i: number) => (
                <GroupRow
                    key={i}
                    index={i}
                    boardId={boardId}
                    additionalCols={additionalCols}
                    group={grp}
                    timeExportFormat={timeExportFormat}
                    costView={costView}
                />
            ))}

            {groupedData.length > 1 && (
                <tr className="grouped-row right auto-wrap">
                    <td colSpan={addlColCount}>
                        Grand Total <i className="fa fa-arrow-right" />
                    </td>
                    {isSprint &&
                        sprintsList?.map(({ id }: any) => (
                            <GroupTotalCells key={id} sprintId={id} timeExportFormat={timeExportFormat} costView={costView} />
                        ))}
                    {!isSprint && <GroupTotalCells timeExportFormat={timeExportFormat} costView={costView} />}
                </tr>
            )}
        </TBody>
    );
}

interface GroupTotalCellsProps {
    sprintId?: number;
    timeExportFormat?: string;
    costView?: boolean;
}

function GroupTotalCells({ sprintId, timeExportFormat, costView }: GroupTotalCellsProps) {
    const state = useWorklogStore();
    const isSprint = state.timeframeType === '1';
    const groupReportKey = isSprint ? `groupReport_${sprintId}` : 'groupReport';
    const groupReport = state[groupReportKey];
    const { dates, groupedData } = groupReport || { dates: [], groupedData: {} };

    const convertSecs = useConvertSecs();

    if (costView) {
        return (
            <>
                {dates.map((day: any, i: number) => (
                    <td
                        key={i}
                        className={day.isHoliday ? (!groupedData.totalCost?.[day.prop] ? 'col-holiday' : 'log-high') : ''}
                        data-export-type="float"
                    >
                        {groupedData.totalCost?.[day.prop]}
                    </td>
                ))}
                <td data-export-type="float">{groupedData.grandTotalCost}</td>
            </>
        );
    } else {
        return (
            <>
                {dates.map((day: any, i: number) => (
                    <td
                        key={i}
                        className={day.isHoliday ? (!groupedData.total?.[day.prop] ? 'col-holiday' : 'log-high') : ''}
                        data-export-type={timeExportFormat}
                    >
                        {convertSecs(groupedData.total?.[day.prop])}
                    </td>
                ))}
                <td data-export-type={timeExportFormat}>{convertSecs(groupedData.grandTotal)}</td>
            </>
        );
    }
}
