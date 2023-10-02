import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Column, ScrollableTable, TBody, THead, TRow } from '../../../../components/ScrollableTable';
import { UserDisplay } from '../../../../display-controls';
import { connect } from '../store';
import { loadLeaveDetails } from '../store/actions';
import { getResourceAvailability } from '../utils';
import Indicator from '../../../../components/worklog-indicator';

function Resources({
    resources, daysList: { groups, days },
    workHours, workingDays, allocationData,
    leaveCalendar, holidayCalendar,
    resourceLeaveDays, resourceHolidays,
    loadLeaveDetails, height
}) {
    useEffect(() => {
        loadLeaveDetails();
    }, [leaveCalendar, holidayCalendar, loadLeaveDetails]);

    if (!groups?.length) {
        return null;
    }

    return (<div className="ja-resource-container">
        <ScrollableTable height={height}>
            <THead>
                <TRow>
                    <Column rowSpan={2} className="pad-5">Resource Name</Column>
                    {groups.map(g => <Column key={g.sprintId} className="sprint-head" colSpan={g.daysCount}>{g.name}</Column>)}
                </TRow>
                <TRow>
                    {days.map(d => <Column key={d.key} className="day-head">{d.date}<br />{d.week}</Column>)}
                </TRow>
            </THead>
            <TBody>
                {resources.map(r => <ResourceRow key={r.accountId} resource={r} days={days} workHours={workHours}
                    allocationData={allocationData[r.id]} workingDays={workingDays}
                    resourceLeaveDays={resourceLeaveDays[r.accountId]} resourceHolidays={resourceHolidays} />)}
                <tr>
                    <td>
                        <span className="fa fa-plus" />
                    </td>
                </tr>
            </TBody>
        </ScrollableTable>
    </div>);
}

export default connect(Resources,
    ({ resources, daysList, resourceLeaveDays, resourceHolidays, allocationData,
        settings: { workHours, workingDays, leaveCalendar, holidayCalendar } }) =>
        ({ resources, daysList, resourceLeaveDays, resourceHolidays, workHours, workingDays, leaveCalendar, holidayCalendar, allocationData }),
    { loadLeaveDetails });

function ResourceRow({ resource: r, days,
    workHours, workingDays,
    allocationData, resourceLeaveDays, resourceHolidays }) {
    return (<tr>
        <UserDisplay value={r} />
        {days.map(d => {
            const { key } = d;
            const availableHours = getResourceAvailability(key, d.dateObj, workHours, workingDays, resourceLeaveDays, resourceHolidays);
            const allocatedHour = allocationData?.[key] || 0;
            const isUnavailable = !availableHours;
            const clsNames = {
                'resource-day': true,
                'col-holiday': isUnavailable,
                'log-less': allocatedHour && allocatedHour < availableHours,
                'log-good': availableHours && allocatedHour === availableHours,
                'log-high': allocatedHour > availableHours,
            };

            return (<td key={key}
                className={classNames(clsNames)}>
                {allocatedHour ? allocatedHour : ''}
                {allocatedHour > 0 && <Indicator value={allocatedHour} maxHours={availableHours} />}
            </td>);
        })}
    </tr>);
}