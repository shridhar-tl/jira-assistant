import React, { useEffect } from 'react';
import { Column, ScrollableTable, TBody, THead, TRow } from '../../../components/ScrollableTable';
import { connect } from './store';
import { UserDisplay } from '../../../display-controls';
import { loadLeaveDetails } from './store/actions';
import classNames from 'classnames';

function Resources({
    resources, daysList: { groups, days },
    workHours,
    leaveCalendar, holidayCalendar,
    resourceLeaveDays, resourceHolidays,
    loadLeaveDetails
}) {
    useEffect(() => {
        loadLeaveDetails();
    }, [leaveCalendar, holidayCalendar, loadLeaveDetails]);

    if (!groups?.length) {
        return null;
    }

    return (<div className="ja-resource-container">
        <ScrollableTable>
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
                    resourceLeaveDays={resourceLeaveDays} resourceHolidays={resourceHolidays} />)}
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
    ({ resources, daysList, resourceLeaveDays, resourceHolidays,
        settings: { workHours, leaveCalendar, holidayCalendar } }) =>
        ({ resources, daysList, resourceLeaveDays, resourceHolidays, workHours, leaveCalendar, holidayCalendar }),
    { loadLeaveDetails });

function ResourceRow({ resource: r, days, workHours, resourceLeaveDays, resourceHolidays }) {
    const { accountId } = r;
    const leaveDays = resourceLeaveDays[accountId];

    return (<tr>
        <UserDisplay value={r} />
        {days.map(d => {
            const { key } = d;
            const leave = leaveDays?.[key];
            const holiday = resourceHolidays[key];
            let hour = workHours;
            if (leave?.allDay) {
                hour = 0;
            }
            else if (leave?.hour > 0) {
                hour -= leave?.hour;
            }

            if (hour > 0 && holiday) {
                if (holiday.allDay) {
                    hour = 0;
                }
                else if (holiday.hour > 0) {
                    hour -= holiday.hour;
                }
            }

            if (hour < 0) {
                hour = 0;
            }

            const isUnavailable = !hour;

            return (<td key={key} className={classNames({ 'col-holiday': isUnavailable })}>{hour ? hour : ''}</td>);
        })}
    </tr>);
}