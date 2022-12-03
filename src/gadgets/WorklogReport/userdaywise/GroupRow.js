import React, { Fragment, useState, useCallback } from 'react';
import { connect } from '../datastore';
import UserRow from './UserRow';

function GroupRow({
    group: grp, index, dates, sprintsList, convertSecs, isSprint, boardId, costView,
    addWorklog, timeExportFormat, colSpan
}) {
    const [hidden, setVisibility] = useState(false);
    const toggleDisplay = useCallback(() => setVisibility((h) => !h), [setVisibility]);

    return (
        <>
            {!hidden && !grp.isDummy && <tr className="grouped-row left" title="Click to hide user details">
                <td colSpan={isSprint ? 1 : dates?.length + 2} onClick={toggleDisplay}>
                    <i className="pull-left drill-down fa fa-chevron-circle-down" />
                    {grp.name}
                </td>
                {isSprint && grp.sprints.map((s, i) => ((s.days <= 999) ?
                    <td key={i} colSpan={s.days + 1}>{s.name}</td>
                    : <Fragment key={i}><td colSpan={1000} className="total-field">{s.name}</td><td colSpan={s.days - 999}></td></Fragment>))}
            </tr>}

            {!hidden && grp.users.map((u, i) => <UserRow key={i} groupIndex={index} index={i} colSpan={colSpan} user={u}
                addWorklog={addWorklog} timeExportFormat={timeExportFormat} boardId={boardId} costView={costView}
            />)}

            {!grp.isDummy && <tr className="grouped-row right auto-wrap" onClick={hidden ? toggleDisplay : null}>
                <td colSpan={colSpan}>
                    {hidden && <div>
                        <i className="pull-left drill-down fa fa-chevron-circle-right" title="Click to show user details" />
                        <span className="pull-left">{grp.name}</span><span className="pull-right">Total <i className="fa fa-arrow-right" /></span>
                    </div>}
                    {!hidden && <div>{grp.name} <i className="fa fa-arrow-right" /> Total <i className="fa fa-arrow-right" /></div>}
                </td>
                {isSprint && sprintsList.map(({ id }) => <DayWiseCells key={id} sprintId={id} boardId={boardId}
                    convertSecs={convertSecs} timeExportFormat={timeExportFormat} costView={costView} groupIndex={index} />)}
                {!isSprint && <DayWiseCells convertSecs={convertSecs} timeExportFormat={timeExportFormat} costView={costView} groupIndex={index} />}

                {isSprint && costView && <td>{grp.grandTotalCost}</td>}
                {isSprint && !costView && <td>{convertSecs(grp.grandTotalHours)}</td>}
            </tr>}
        </>
    );
}

export default connect(GroupRow,
    (state, { boardId }) => {
        const isSprint = state.timeframeType === '1';
        if (isSprint) {
            const { [`sprintsList_${boardId}`]: sprintsList, costView, timeExportFormat } = state;

            return ({ isSprint, sprintsList, costView, timeExportFormat });
        } else {
            const { groupReport: { dates }, costView, timeExportFormat } = state;

            return ({ isSprint, dates, costView, timeExportFormat });
        }
    },
    null,
    [
        'UtilsService',
        ({ $utils: { convertSecs } }) =>
            ({ convertSecs })
    ]
);

const DayWiseCells = connect(function ({
    group: grp, costView, dates, timeExportFormat, convertSecs
}) {
    if (costView) {
        return (<>
            {dates.map((day, i) => <td key={i}>{grp.totalCost[day.prop]}</td>)}
            <td>{grp.grandTotalCost}</td>
        </>);

    } else {
        return (<>
            {dates.map((day, i) => <td key={i} exportType={timeExportFormat}>{convertSecs(grp.total[day.prop])}</td>)}
            <td exportType={timeExportFormat}>{convertSecs(grp.grandTotal)}</td>
        </>);
    }
}, (state, { sprintId, groupIndex }) => {
    const { costView, timeframeType,
        [timeframeType === '1' ? `groupReport_${sprintId}` : 'groupReport']:
        { dates, groupedData: group }
    } = state;

    return { costView, dates, group: group[groupIndex] };
});