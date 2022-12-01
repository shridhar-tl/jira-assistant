import React from 'react';
import { TBody } from '../../../components/ScrollableTable';
import { connect } from '../datastore';
import GroupRow from './GroupRow';

function GroupBody({ boardId, isSprint,
    groupedData, addlColCount, dates, sprintsList,
    logFormat, costView
}) {
    const timeExportFormat = logFormat === "2" ? "float" : undefined;
    const groupRows = groupedData.map((grp, i) => <GroupRow key={i} index={i} boardId={boardId}
        colSpan={addlColCount} group={grp} timeExportFormat={timeExportFormat} />);
    if (isSprint) {
        return groupRows;
    }

    return (<TBody>
        {groupRows}

        {!costView && <tr className="grouped-row right auto-wrap">
            <td colSpan={addlColCount}>Grand Total <i className="fa fa-arrow-right" /></td>
            {isSprint && sprintsList?.map(({ id }) => <GroupTotalCells key={id} sprintId={id} timeExportFormat={timeExportFormat} />)}
            {!isSprint && <GroupTotalCells timeExportFormat={timeExportFormat} />}
        </tr>}

        {costView && <tr className="grouped-row right auto-wrap">
            <td colSpan={addlColCount}>Grand Total <i className="fa fa-arrow-right" /></td>
            {dates.map((day, i) => <td key={i}>{groupedData.totalCost[day.prop]}</td>)}
            <td>{groupedData.grandTotalCost}</td>
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
                logFormat, costView
            } = state;

            return ({ isSprint, sprintsList, groupedData, logFormat, costView });
        } else {
            const { groupReport: { groupedData }, logFormat, costView } = state;

            return ({ groupedData, logFormat, costView });
        }
    });

const GroupTotalCells = connect(function ({ groupedData, dates, timeExportFormat, convertSecs }) {
    return (<>
        {dates.map((day, i) => <td key={i} exportType={timeExportFormat}>{convertSecs(groupedData.total[day.prop])}</td>)}
        < td exportType={timeExportFormat} > {convertSecs(groupedData.grandTotal)}</td >
    </>);
},
    (state, { sprintId }) => {
        const isSprint = state.timeframeType === '1';
        const {
            [isSprint ? `groupReport_${sprintId}` : 'groupReport']:
            { dates, groupedData }
        } = state;

        return { dates, groupedData };
    },
    null,
    [
        'UtilsService',
        ({
            $utils: { convertSecs }
        }) => ({ convertSecs })
    ]);