import React from 'react';
import { Column, ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";
import { usePlannerState } from '../store';

function LeavePlans({ resources, groups }) {
    const sprintWiseLeaveAndHolidays = usePlannerState(s => s.sprintWiseLeaveAndHolidays);

    return (<div className="absolute h-100 w-100">
        <ScrollableTable height="100%">
            <caption>Leave plans & Holidays</caption>
            <THead>
                <tr>
                    <Column>Resources</Column>
                    {groups.map(g => <Column className="text-center" key={g.sprintId}>{g.name}</Column>)}
                    <Column className="text-center">Total</Column>
                </tr>
            </THead>
            <TBody>
                {resources.map(r => <tr key={r.id}>
                    <td>{r.displayName}</td>
                    {groups.map(g => <td key={g.sprintId} className="text-center">{sprintWiseLeaveAndHolidays[g.sprintId]?.[r.accountId] || 0}</td>)}
                    <td className="text-center">{groups.sum(g => sprintWiseLeaveAndHolidays[g.sprintId]?.[r.accountId] || 0)}</td>
                </tr>)}
                <tr>
                    <td><strong>Public holidays</strong></td>
                    {groups.map(g => <td key={g.sprintId} className="text-center">{sprintWiseLeaveAndHolidays[g.sprintId]?.holidayCount || 0}</td>)}
                    <td className="text-center">{groups.sum(g => sprintWiseLeaveAndHolidays[g.sprintId]?.holidayCount || 0)}</td>
                </tr>
            </TBody>
            <tfoot>
                <tr>
                    <th>Total</th>
                    {groups.map(g => <th key={g.sprintId} className="text-center">0</th>)}
                    <th className="text-center">0</th>
                </tr>
            </tfoot>
        </ScrollableTable>
    </div>);
}

export default LeavePlans;
