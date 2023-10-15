import React, { useMemo } from 'react';
import { Column, ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";
import { usePlannerState } from '../store';

function TeamCapacity({ groups, resources }) {
    const sprintWiseLeaveAndHolidays = usePlannerState(s => s.sprintWiseLeaveAndHolidays);
    const velocity = usePlannerState(s => s.velocity);
    const velocityInfo = usePlannerState(s => s.velocityInfo);
    const storyPoints = getStoryPoints(velocity, velocityInfo);
    const availability = useMemo(() => getTeamAvailability(groups, resources, sprintWiseLeaveAndHolidays, storyPoints),
        [resources, groups, sprintWiseLeaveAndHolidays, storyPoints]);

    return (<div className="absolute h-100 w-100">
        <ScrollableTable height="100%">
            <caption>Team Capacity</caption>
            <THead>
                <tr>
                    <Column>Resources</Column>
                    {groups.map(g => <Column key={g.sprintId} className="text-center">{g.name}</Column>)}
                    <Column></Column>
                </tr>
            </THead>
            <TBody>
                {resources.map(r => <tr key={r.id}>
                    <td>{r.displayName}</td>
                    {groups.map(g => <td key={g.sprintId} className="text-center">{availability[g.sprintId][r.accountId]}%</td>)}
                    <th></th>
                </tr>)}
            </TBody>
            <tfoot>
                <tr>
                    <th>Average Allocation</th>
                    {groups.map(g => <th key={g.sprintId} className="text-center">
                        {availability[g.sprintId].sprintAverage}% ({availability[g.sprintId].avgStoryPoint})
                    </th>)}
                    <th></th>
                </tr>
            </tfoot>
        </ScrollableTable>
    </div>);
}

export default TeamCapacity;

function getStoryPoints(velocity, velocityInfo) {
    if (!velocity || !velocityInfo) { return 0; }

    const { averageComitted, averageCompleted, median } = velocityInfo;
    const { custom, selected } = velocity;

    switch (selected) {
        default: return averageCompleted;
        case 'U': return parseInt(custom || averageCompleted);
        case 'M': return parseInt(median || averageCompleted);
        case 'T': return parseInt(averageComitted || averageCompleted);
    }
}

function getTeamAvailability(groups, resources, leavePlans, storyPoints) {
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

        sprintData.sprintAverage = Math.round(sprintAverage / resources.length);
        sprintData.avgStoryPoint = Math.ceil(storyPoints * sprintData.sprintAverage / 100);
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