import React from 'react';
import { Column, ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";
import { publicHolidayKey } from './utils';

function LeavePlans({ resources, leavePlans, groups }) {

    return (<ScrollableTable>
        <caption>Leave plans & Holidays</caption>
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
                {groups.map(g => <td key={g.sprintId}>{leavePlans[g.sprintId][r.accountId]}</td>)}
            </tr>)}
            <tr>
                <td><strong>Public holidays</strong></td>
                {groups.map(g => <td key={g.sprintId}>{leavePlans[g.sprintId][publicHolidayKey]}</td>)}
                <td></td>
            </tr>
        </TBody>
        <tfoot>
            <tr>
                <th>Total</th>
                {groups.map(g => <th key={g.sprintId}>0</th>)}
                <th></th>
            </tr>
        </tfoot>
    </ScrollableTable>);
}

export default LeavePlans;
