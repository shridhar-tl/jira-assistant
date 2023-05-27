import React, { useCallback, useState, useMemo } from 'react';
import { SplitterComponent, PanesDirective, PaneDirective } from '@syncfusion/ej2-react-layouts';
import { Column, ScrollableTable, TBody, THead } from "../../../components/ScrollableTable";
import { connect } from "./store";

const publicHolidayKey = '--PUBLIC--';

function calculateAvailability(resources, resourceLeaveDays, resourceHolidays, groups, days) {
    const result = {};
    let curDate = 0;

    groups.forEach(sprint => {
        const sprintInfo = {};
        result[sprint.sprintId] = sprintInfo;

        const endDay = curDate + sprint.daysCount;
        const daysInSprint = days.slice(curDate, endDay).map(d => d.key);
        curDate = endDay;

        sprintInfo[publicHolidayKey] = daysInSprint.sum(key => resourceHolidays[key]);

        resources.forEach(user => {
            const leavePlans = resourceLeaveDays[user.accountId];

            if (!leavePlans) {
                sprintInfo[user.accountId] = 0;
            } else {
                sprintInfo[user.accountId] = daysInSprint.sum(key => leavePlans[key]);
            }
        });
    });

    return result;
}

function LeavePlans({ resources, resourceLeaveDays, resourceHolidays, daysList: { groups, days } }) {
    const data = useMemo(() => calculateAvailability(resources, resourceLeaveDays, resourceHolidays, groups, days),
        [resources, resourceLeaveDays, resourceHolidays, groups, days]);

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
                {groups.map(g => <td key={g.sprintId}>{data[g.sprintId][r.accountId]}</td>)}
            </tr>)}
            <tr>
                <td><strong>Public holidays</strong></td>
                {groups.map(g => <td key={g.sprintId}>{data[g.sprintId][publicHolidayKey]}</td>)}
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

const defaultHeights = ['calc(50vh - 135px)', '150px'];
function CapacityPlanner({ velosityInfo, ...otherProps }) {
    const [vPaneSize, setVPaneSize] = useState(defaultHeights);
    const updateVerticalPaneSize = useCallback(
        ({ paneSize: [s1, s2] }) =>
            setVPaneSize([`${s1 - 4}px`, `${s2 - 4}px`]),
        [setVPaneSize]);

    const leavePlans = (<SplitterComponent height="calc(100vh - 78px)" width="100%"
        orientation="Vertical" separatorSize={3} resizeStop={updateVerticalPaneSize}>
        <PanesDirective>
            <PaneDirective min="200px" content={() => <LeavePlans height={vPaneSize[0]}  {...otherProps} />} />
            <PaneDirective size="50%" min="200px" content={() => <LeavePlans height={vPaneSize[1]}  {...otherProps} />} />
        </PanesDirective>
    </SplitterComponent>);

    return (<SplitterComponent height="calc(100vh - 78px)" width="100%"
        orientation="Horizontal" separatorSize={3}>
        <PanesDirective>
            <PaneDirective min="800px" content={() => leavePlans} />
            <PaneDirective size="250px" min="150px" content={() => <SprintVelosity velosityInfo={velosityInfo} />} />
        </PanesDirective>
    </SplitterComponent>);
}

export default connect(CapacityPlanner, ({ resources, daysList, velosityInfo, resourceLeaveDays, resourceHolidays }) =>
    ({ resources, daysList, velosityInfo, resourceLeaveDays, resourceHolidays }));

function SprintVelosity({ velosityInfo }) {
    if (!velosityInfo) {
        return null;
    }

    const { closedSprintLists, averageComitted, averageCompleted } = velosityInfo;

    return (<ScrollableTable>
        <caption>Sprint Velosity</caption>
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