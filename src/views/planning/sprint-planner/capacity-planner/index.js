import React, { useCallback, useState, useMemo } from 'react';
import { SplitterComponent, PanesDirective, PaneDirective } from '@syncfusion/ej2-react-layouts';
import { connect } from "../store";
import SprintVelocity from './SprintVelocity';
import LeavePlans from './LeavePlans';
import TeamCapacity from './TeamCapacity';
import { calculateSprintWiseLeaves } from './utils';

const defaultHeights = ['calc(50vh - 135px)', '150px'];
function CapacityPlanner({ velosityInfo, ...otherProps }) {
    return (<SplitterComponent height="calc(100vh - 78px)" width="100%"
        orientation="Horizontal" separatorSize={3}>
        <PanesDirective>
            <PaneDirective min="800px" content={() => <HorizontalComponent {...otherProps} />} />
            <PaneDirective size="250px" min="150px" content={() => <SprintVelocity velosityInfo={velosityInfo} />} />
        </PanesDirective>
    </SplitterComponent>);
}

export default connect(CapacityPlanner, ({ velosityInfo, resources, resourceLeaveDays, resourceHolidays, daysList }) =>
    ({ velosityInfo, resources, resourceLeaveDays, resourceHolidays, daysList }));

function HorizontalSplit({ resources, resourceLeaveDays, resourceHolidays, daysList: { groups, days } }) {
    const leavePlans = useMemo(() => calculateSprintWiseLeaves(resources, resourceLeaveDays, resourceHolidays, groups, days),
        [resources, resourceLeaveDays, resourceHolidays, groups, days]);

    const [vPaneSize, setVPaneSize] = useState(defaultHeights);
    const updateVerticalPaneSize = useCallback(
        ({ paneSize: [s1, s2] }) =>
            setVPaneSize([`${s1 - 4}px`, `${s2 - 4}px`]),
        [setVPaneSize]);

    return (<SplitterComponent height="calc(100vh - 78px)" width="100%"
        orientation="Vertical" separatorSize={3} resizeStop={updateVerticalPaneSize}>
        <PanesDirective>
            <PaneDirective min="200px" content={() => <LeavePlans height={vPaneSize[0]}
                leavePlans={leavePlans} resources={resources} groups={groups} />} />
            <PaneDirective size="50%" min="200px" content={() => <TeamCapacity height={vPaneSize[1]}
                leavePlans={leavePlans} resources={resources} groups={groups} />} />
        </PanesDirective>
    </SplitterComponent>);
}

const HorizontalComponent = React.memo(HorizontalSplit);
