import React, { Fragment, useState, useCallback } from 'react';

import { useWorklogStore } from '../datastore';

import { useConvertSecs } from './useReportUtils';
import UserRow from './UserRow';

interface GroupRowProps {
    group: any;
    index: number;
    boardId?: string;
    costView?: boolean;
    timeExportFormat?: string;
    additionalCols?: any[];
}

export default function GroupRow({ group: grp, index, boardId, costView, timeExportFormat, additionalCols }: GroupRowProps) {
    const [hidden, setVisibility] = useState(false);
    const toggleDisplay = useCallback(() => setVisibility((h) => !h), []);

    const state = useWorklogStore();
    const { timeframeType } = state;
    const isSprint = timeframeType === '1';
    const sprintsList = isSprint ? state[`sprintsList_${boardId}`] : undefined;
    const dates = isSprint ? undefined : state.groupReport?.dates;

    const colSpan = (additionalCols?.length || 0) + 1;

    const convertSecs = useConvertSecs();

    return (
        <>
            {!hidden && !grp.isDummy && (
                <tr className="grouped-row left" title="Click to hide user details">
                    <td colSpan={isSprint ? colSpan : (dates?.length || 0) + 1 + colSpan} onClick={toggleDisplay}>
                        <i className="float-start drill-down fa fa-chevron-circle-down" />
                        {grp.name}
                    </td>
                    {isSprint &&
                        grp.sprints?.map((s: any, i: number) =>
                            s.days <= 999 ? (
                                <td key={i} colSpan={s.days + 1}>
                                    {s.name}
                                </td>
                            ) : (
                                <Fragment key={i}>
                                    <td colSpan={1000} className="total-field">
                                        {s.name}
                                    </td>
                                    <td colSpan={s.days - 999}></td>
                                </Fragment>
                            ),
                        )}
                </tr>
            )}

            {!hidden &&
                grp.users?.map((u: any, i: number) => (
                    <UserRow
                        key={i}
                        groupIndex={index}
                        index={i}
                        colSpan={colSpan}
                        user={u}
                        timeExportFormat={timeExportFormat}
                        boardId={boardId}
                        costView={costView}
                        additionalCols={additionalCols}
                    />
                ))}

            {!grp.isDummy && (
                <tr className="grouped-row right auto-wrap" onClick={hidden ? toggleDisplay : undefined}>
                    <td colSpan={colSpan}>
                        {hidden && (
                            <div>
                                <i className="float-start drill-down fa fa-chevron-circle-right" title="Click to show user details" />
                                <span className="float-start">{grp.name}</span>
                                <span className="float-end">
                                    Total <i className="fa fa-arrow-right" />
                                </span>
                            </div>
                        )}
                        {!hidden && (
                            <div>
                                {grp.name} <i className="fa fa-arrow-right" /> Total <i className="fa fa-arrow-right" />
                            </div>
                        )}
                    </td>
                    {isSprint &&
                        sprintsList?.map(({ id }: any) => (
                            <DayWiseCells
                                key={id}
                                sprintId={id}
                                boardId={boardId}
                                timeExportFormat={timeExportFormat}
                                costView={costView}
                                groupIndex={index}
                            />
                        ))}
                    {!isSprint && <DayWiseCells timeExportFormat={timeExportFormat} costView={costView} groupIndex={index} />}

                    {isSprint && costView && <td data-export-type="float">{grp.grandTotalCost}</td>}
                    {isSprint && !costView && <td data-export-type={timeExportFormat}>{convertSecs(grp.grandTotalHours)}</td>}
                </tr>
            )}
        </>
    );
}

interface DayWiseCellsProps {
    sprintId?: number;
    boardId?: string;
    groupIndex: number;
    timeExportFormat?: string;
    costView?: boolean;
}

function DayWiseCells({ sprintId, groupIndex, timeExportFormat, costView }: DayWiseCellsProps) {
    const state = useWorklogStore();
    const groupReportKey = state.timeframeType === '1' ? `groupReport_${sprintId}` : 'groupReport';
    const groupReport = state[groupReportKey];
    const { dates, groupedData } = groupReport || { dates: [], groupedData: [] };
    const grp = groupedData[groupIndex];

    const convertSecs = useConvertSecs();

    if (costView) {
        return (
            <>
                {dates.map((day: any, i: number) => (
                    <td
                        key={i}
                        className={day.isHoliday ? (!grp?.totalCost?.[day.prop] ? 'col-holiday' : 'log-high') : ''}
                        data-export-type="float"
                    >
                        {grp?.totalCost?.[day.prop]}
                    </td>
                ))}
                <td data-export-type="float">{grp?.grandTotalCost}</td>
            </>
        );
    } else {
        return (
            <>
                {dates.map((day: any, i: number) => (
                    <td
                        key={i}
                        className={day.isHoliday ? (!grp?.total?.[day.prop] ? 'col-holiday' : 'log-high') : ''}
                        data-export-type={timeExportFormat}
                    >
                        {convertSecs(grp?.total?.[day.prop])}
                    </td>
                ))}
                <td data-export-type={timeExportFormat}>{convertSecs(grp?.grandTotal)}</td>
            </>
        );
    }
}
