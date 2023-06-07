import React from 'react';
import { Column, ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";

function SprintVelocity({ velocityInfo }) {
    if (!velocityInfo) {
        return null;
    }

    const { closedSprintLists, averageComitted, averageCompleted } = velocityInfo;

    return (<ScrollableTable>
        <caption>Sprint Velocity</caption>
        <THead>
            <tr>
                <Column>Sprint</Column>
                <Column>Completed</Column>
                <Column>Total</Column>
            </tr>
        </THead>
        <TBody>
            {closedSprintLists.map(sprint => <tr key={sprint.id}>
                <td>{sprint.name}</td>
                <td>{sprint.completedStoryPoints}</td>
                <td>{sprint.comittedStoryPoints}</td>
            </tr>)}
        </TBody>
        <tfoot>
            <tr>
                <th>Average</th>
                <th>{averageCompleted}</th>
                <th>{averageComitted}</th>
            </tr>
        </tfoot>
    </ScrollableTable>);
}

export default SprintVelocity;