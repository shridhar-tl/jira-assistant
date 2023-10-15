import React, { useMemo } from 'react';
import { Column, ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";
import { usePlannerState } from '../store';

function TeamCapacity({ groups, resources }) {
    const sprintWiseLeaveAndHolidays = usePlannerState(s => s.sprintWiseLeaveAndHolidays);
    const availability = useMemo(() => getTeamAvailability(groups, resources, sprintWiseLeaveAndHolidays), [resources, groups, sprintWiseLeaveAndHolidays]);

    return (<div className="absolute h-100 w-100">
        <ScrollableTable height="100%">
            <caption>Team Capacity</caption>
            <THead>
                <tr>
                    <Column>Resources</Column>
                    {groups.map(g => <Column key={g.sprintId} className="text-center">{g.name}</Column>)}
                    <Column className="text-center">Total</Column>
                </tr>
            </THead>
            <TBody>
                {resources.map(r => <tr key={r.id}>
                    <td>{r.displayName}</td>
                    {groups.map(g => <td key={g.sprintId} className="text-center">{availability[g.sprintId][r.accountId]}%</td>)}
                    <th className="text-center">100%</th>
                </tr>)}
            </TBody>
            <tfoot>
                <tr>
                    <th>Average Allocation</th>
                    {groups.map(g => <th key={g.sprintId} className="text-center">{availability[g.sprintId].sprintAverage}%</th>)}
                    <th className="text-center">100%</th>
                </tr>
            </tfoot>
        </ScrollableTable>
    </div>);
}

export default TeamCapacity;

function getTeamAvailability(groups, resources, leavePlans) {
    const result = {};

    groups.forEach(g => {
        const sprintData = {};
        result[g.sprintId] = sprintData;
        let sprintAverage = 0;

        resources.forEach(r => {
            const value = getAvailabilityInPercentage(leavePlans, r, g);
            sprintData[r.accountId] = value;
            sprintAverage += value;
        });

        sprintData.sprintAverage = Math.round(sprintAverage / groups.length);
    });

    return result;
}

function getAvailabilityInPercentage(leavePlans, resource, sprint) {
    const { sprintId, workingDaysCount } = sprint;
    const { accountId } = resource;

    const leaveDays = (leavePlans[sprintId]?.[accountId] || 0);
    const holiday = leavePlans[sprintId]?.holidayCount || 0;
    let availableDays = (workingDaysCount - leaveDays) - holiday;
    if (availableDays < 0) {
        availableDays = 0;
    }

    return Math.round(availableDays * 100 / workingDaysCount);
}