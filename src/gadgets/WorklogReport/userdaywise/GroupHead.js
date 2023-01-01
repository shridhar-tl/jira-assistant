import React, { Fragment } from 'react';
import { THead } from '../../../components/ScrollableTable';
import { connect } from '../datastore';

function GroupHead({ useSprint, sprintsList, addlColCount, costView, fields }) {
    const { showProject, showParentSummary, showIssueType, showEpic, showAssignee, showReporter } = fields || {};

    return (<THead>
        <tr className="data-center pad-min auto-wrap">
            <th style={{ minWidth: 260 + (addlColCount * 120) }} rowSpan={addlColCount > 1 ? 1 : 2} colSpan={addlColCount}>User Details</th>
            {useSprint && sprintsList.map(s => <Fragment key={s.id}>
                <WeeksList sprint={s} />
                <th rowSpan={2}>Sprint Total</th>
            </Fragment>)}
            {!useSprint && <WeeksList />}
            {!costView && <th style={{ minWidth: 50, maxWidth: 100 }} rowSpan={2}>Total Hours</th>}
            {costView && <th style={{ minWidth: 50, maxWidth: 100 }} rowSpan={2}>Total Cost</th>}
        </tr>
        <tr className="pad-min auto-wrap">
            {addlColCount > 1 && <th style={{ minWidth: 380 }} >Issue details</th>}
            {!!showProject && <th>Project</th>}
            {!!showParentSummary && <th>Parent Summary</th>}
            {!!showIssueType && <th>Issuetype</th>}
            {!!showEpic && <th>Epic</th>}
            {!!showAssignee && <th>Assignee</th>}
            {!!showReporter && <th>Reporter</th>}
            {useSprint && sprintsList.map(({ id }) => <DatesList key={id} sprintId={id} />)}
            {!useSprint && <DatesList />}
        </tr>
    </THead>);
}

export default connect(GroupHead,
    (state, { boardId }) => {
        const {
            fields, costView, selSprints, timeframeType,
        } = state;
        const useSprint = timeframeType === '1';
        return {
            useSprint, fields, costView,
            board: useSprint ? selSprints[boardId] : undefined,
            sprintsList: useSprint ? state[`sprintsList_${boardId}`] : undefined
        };
    });

const WeeksList = connect(function ({ weeks }) {
    return weeks.map((day, i) => <th key={i} className="week-head" colSpan={day.days}>{day.display}</th>);
}, (state, { sprint }) => {
    const { [sprint ? `groupReport_${sprint.id}` : 'groupReport']: { weeks } } = state;
    return { weeks };
});

const DatesList = connect(function ({ dates }) {
    return dates.map((day, i) => <th key={i} data-test-id={day.prop} className={`day-head${day.isHoliday ? ' holiday' : ''}`}>{day.dateNum}<br /><span className="day-name">{day.day}</span></th>);
}, (state, { sprintId }) => {
    const { [sprintId ? `groupReport_${sprintId}` : 'groupReport']: { dates } } = state;
    return { dates };
});