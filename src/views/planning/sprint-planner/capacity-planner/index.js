import React, { useMemo } from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { connect } from "../store";
import SprintVelocity from './SprintVelocity';
import LeavePlans from './LeavePlans';
import TeamCapacity from './TeamCapacity';
import { calculateSprintWiseLeaves } from './utils';
import VelocityPicker from './VelocityPicker';

const defaultSize = { height: "100%", width: "100%" };

function CapacityPlanner({ velocityInfo, ...otherProps }) {
    return (<Splitter style={defaultSize}>
        <SplitterPanel size={80} minSize={40}>
            <HorizontalComponent {...otherProps} />
        </SplitterPanel>
        <SplitterPanel minSize={10}>
            <VerticalSplit velocityInfo={velocityInfo} />
        </SplitterPanel>
    </Splitter>);
}

export default connect(CapacityPlanner, ({ velocityInfo, resources, resourceLeaveDays, resourceHolidays, daysList }) =>
    ({ velocityInfo, resources, resourceLeaveDays, resourceHolidays, daysList }));

function HorizontalSplit({ resources, resourceLeaveDays, resourceHolidays, daysList: { groups, days } }) {
    const leavePlans = useMemo(() => calculateSprintWiseLeaves(resources, resourceLeaveDays, resourceHolidays, groups, days),
        [resources, resourceLeaveDays, resourceHolidays, groups, days]);
    return (<Splitter style={defaultSize} layout="vertical" >
        <SplitterPanel className="relative" minSize={20}>
            <LeavePlans height="100%" leavePlans={leavePlans} resources={resources} groups={groups} />
        </SplitterPanel>
        <SplitterPanel className="relative" minSize={20}>
            <TeamCapacity height="100%" leavePlans={leavePlans} resources={resources} groups={groups} />
        </SplitterPanel>
    </Splitter>);
}

const HorizontalComponent = React.memo(HorizontalSplit);

function VerticalSplit({ velocityInfo }) {
    return (<>
        <SprintVelocity velocityInfo={velocityInfo} />
        <br /><br />
        <VelocityPicker velocityInfo={velocityInfo} />
    </>);
}