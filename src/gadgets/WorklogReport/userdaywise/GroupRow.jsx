import React, { Fragment, useState, useCallback } from 'react';
import { connect } from '../datastore';
import { convertSecs } from '../actions';
import UserRow from './UserRow';

function GroupRow({
    group: grp, index, dates, sprintsList, convertSecs, isSprint, boardId, costView,
    timeExportFormat, additionalCols
}) {
    const [hidden, setVisibility] = useState(false);
    const toggleDisplay = useCallback(() => setVisibility((h) => !h), [setVisibility]);
    const colSpan = (additionalCols?.length || 0) + 1;

    return (
        <>
            {!hidden && !grp.isDummy && <tr className="grouped-row left" title="Click to hide user details">
                <td colSpan={isSprint ? colSpan : dates?.length + 1 + colSpan} onClick={toggleDisplay}>
                    <i className="float-start drill-down fa fa-chevron-circle-down" />
                    {grp.name}
                </td>
                {isSprint && grp.sprints.map((s, i) => ((s.days <= 999) ?
                    <td key={i} colSpan={s.days + 1}>{s.name}</td>
                    : <Fragment key={i}><td colSpan={1000} className="total-field">{s.name}</td><td colSpan={s.days - 999}></td></Fragment>))}
            </tr>}

            {!hidden && grp.users.map((u, i) => <UserRow key={i} groupIndex={index} index={i} colSpan={colSpan} user={u}
                timeExportFormat={timeExportFormat} boardId={boardId} costView={costView} additionalCols={additionalCols}
            />)}

            {!grp.isDummy && <tr className="grouped-row right auto-wrap" onClick={hidden ? toggleDisplay : null}>
                <td colSpan={colSpan}>
                    {hidden && <div>
                        <i className="float-start drill-down fa fa-chevron-circle-right" title="Click to show user details" />
                        <span className="float-start">{grp.name}</span><span className="float-end">Total <i className="fa fa-arrow-right" /></span>
                    </div>}
                    {!hidden && <div>{grp.name} <i className="fa fa-arrow-right" /> Total <i className="fa fa-arrow-right" /></div>}
                </td>
                {isSprint && sprintsList.map(({ id }) => <DayWiseCells key={id} sprintId={id} boardId={boardId}
                    convertSecs={convertSecs} timeExportFormat={timeExportFormat} costView={costView} groupIndex={index} />)}
                {!isSprint && <DayWiseCells convertSecs={convertSecs} timeExportFormat={timeExportFormat} costView={costView} groupIndex={index} />}

                {isSprint && costView && <td exportType="float">{grp.grandTotalCost}</td>}
                {isSprint && !costView && <td exportType={timeExportFormat}>{convertSecs(grp.grandTotalHours)}</td>}
            </tr>}
        </>
    );
}

export default connect(GroupRow,
    (state, { boardId }) => {
        const isSprint = state.timeframeType === '1';
        if (isSprint) {
            const { [`sprintsList_${boardId}`]: sprintsList } = state;

            return ({ isSprint, sprintsList });
        } else {
            const { groupReport: { dates } } = state;

            return ({ isSprint, dates });
        }
    }, { convertSecs });

const DayWiseCells = connect(function ({
    group: grp, costView, dates, timeExportFormat, convertSecs
}) {
    if (costView) {
        return (<>
            {dates.map((day, i) => <td key={i} className={day.isHoliday ? (!grp.totalCost[day.prop] ? 'col-holiday' : 'log-high') : ''}
                exportType="float">{grp.totalCost[day.prop]}</td>)}
            <td exportType="float">{grp.grandTotalCost}</td>
        </>);

    } else {
        return (<>
            {dates.map((day, i) => <td key={i} className={day.isHoliday ? (!grp.total[day.prop] ? 'col-holiday' : 'log-high') : ''}
                exportType={timeExportFormat}>{convertSecs(grp.total[day.prop])}</td>)}
            <td exportType={timeExportFormat}>{convertSecs(grp.grandTotal)}</td>
        </>);
    }
}, (state, { sprintId, groupIndex }) => {
    const { timeframeType,
        [timeframeType === '1' ? `groupReport_${sprintId}` : 'groupReport']:
        { dates, groupedData: group }
    } = state;

    return { dates, group: group[groupIndex] };
});