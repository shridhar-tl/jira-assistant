import React from 'react';
import { Column, ScrollableTable, TBody, THead } from "../../../../components/ScrollableTable";

function SprintVelocity({ velocityInfo }) {
    if (!velocityInfo) {
        return null;
    }

    const { closedSprintLists, averageCommitted, averageCompleted } = velocityInfo;

    return (<ScrollableTable containerStyle={{ height: 'auto', maxHeight: 'calc(100vh - 292px)', marginBottom: '20px' }}>
        <caption>Sprint Velocity</caption>
        <THead>
            <tr>
                <Column>Sprint</Column>
                <Column className="text-center">Completed</Column>
                <Column className="text-center">Total</Column>
            </tr>
        </THead>
        <TBody>
            {closedSprintLists.map(sprint => <tr key={sprint.id}>
                <td>{sprint.name}</td>
                <td className="text-center">{sprint.completedStoryPoints}</td>
                <td className="text-center">{sprint.committedStoryPoints}</td>
            </tr>)}
        </TBody>
        <tfoot>
            <tr>
                <th>Average</th>
                <th className="text-center">{averageCompleted}</th>
                <th className="text-center">{averageCommitted}</th>
            </tr>
        </tfoot>
    </ScrollableTable>);
}

export default SprintVelocity;