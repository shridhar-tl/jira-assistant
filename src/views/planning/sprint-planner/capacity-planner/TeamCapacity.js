import React, { useMemo } from 'react';
import { Column, ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";

function TeamCapacity({ groups, resources, leavePlans }) {
    const availability = useMemo(() => getTeamAvailability(groups, resources, leavePlans), [resources, groups, leavePlans]);

    return (<ScrollableTable>
        <caption>Team Capacity</caption>
        <THead>
            <tr>
                <Column>Resources</Column>
                {groups.map(g => <Column key={g.sprintId}>{g.name}</Column>)}
                <Column>Total</Column>
            </tr>
        </THead>
        <TBody>
            {resources.map(r => <tr key={r.id}>
                <td>{r.displayName}</td>
                {groups.map(g => <td key={g.sprintId}>{availability[g.sprintId][r.accountId]}%</td>)}
            </tr>)}
        </TBody>
        <tfoot>
            <tr>
                <th>Average Allocation</th>
                {groups.map(g => <th key={g.sprintId}>{availability[g.sprintId].sprintAverage}%</th>)}
                <th></th>
            </tr>
        </tfoot>
    </ScrollableTable>);
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

    const leaveDays = (leavePlans[sprintId][accountId] || 0);
    const availableDays = workingDaysCount - leaveDays;

    return Math.round(availableDays * 100 / workingDaysCount);
}