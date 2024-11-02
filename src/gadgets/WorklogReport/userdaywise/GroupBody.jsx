import React from 'react';
import { TBody } from '../../../components/ScrollableTable';
import { connect } from '../datastore';
import { convertSecs } from '../actions';
import GroupRow from './GroupRow';

function GroupBody({ boardId, isSprint,
    groupedData, additionalCols, sprintsList,
    logFormat, costView, rIndicator
}) {
    const addlColCount = (additionalCols?.length || 0) + 1;

    const timeExportFormat = logFormat === "2" ? "float" : undefined;
    const groupRows = groupedData.map((grp, i) => <GroupRow key={i} index={i} boardId={boardId}
        additionalCols={additionalCols} group={grp} timeExportFormat={timeExportFormat} costView={costView} />);

    return (<TBody className={rIndicator !== '2' ? 'no-log-bg-hl' : ''}>
        {groupRows}

        {groupedData.length > 1 && <tr className="grouped-row right auto-wrap">
            <td colSpan={addlColCount}>Grand Total <i className="fa fa-arrow-right" /></td>
            {isSprint && sprintsList?.map(({ id }) => <GroupTotalCells key={id} sprintId={id} timeExportFormat={timeExportFormat} costView={costView} />)}
            {!isSprint && <GroupTotalCells timeExportFormat={timeExportFormat} costView={costView} />}
        </tr>}
    </TBody>);
}

export default connect(GroupBody,
    (state, { boardId }) => {
        const isSprint = state.timeframeType === '1';
        if (isSprint) {
            const {
                [`userGroup_${boardId}`]: groupedData,
                [`sprintsList_${boardId}`]: sprintsList,
                logFormat, rIndicator
            } = state;

            return ({ isSprint, sprintsList, groupedData, logFormat, rIndicator });
        } else {
            const { groupReport: { groupedData }, logFormat, rIndicator } = state;

            return ({ groupedData, logFormat, rIndicator });
        }
    });

const GroupTotalCells = connect(function ({ groupedData, dates, timeExportFormat, costView, convertSecs }) {
    if (costView) {
        return (<>
            {dates.map((day, i) => <td key={i} className={day.isHoliday ? (!groupedData.totalCost[day.prop] ? 'col-holiday' : 'log-high') : ''}
                exportType="float">{groupedData.totalCost[day.prop]}</td>)}
            <td exportType="float">{groupedData.grandTotalCost}</td>
        </>);
    } else {
        return (<>
            {dates.map((day, i) => <td key={i} className={day.isHoliday ? (!groupedData.total[day.prop] ? 'col-holiday' : 'log-high') : ''}
                exportType={timeExportFormat}>{convertSecs(groupedData.total[day.prop])}</td>)}
            <td exportType={timeExportFormat}>{convertSecs(groupedData.grandTotal)}</td>
        </>);
    }
}, (state, { sprintId }) => {
    const isSprint = state.timeframeType === '1';
    const {
        [isSprint ? `groupReport_${sprintId}` : 'groupReport']:
        { dates, groupedData }
    } = state;

    return { dates, groupedData };
}, { convertSecs });