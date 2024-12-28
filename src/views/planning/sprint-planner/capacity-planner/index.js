import React from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { connect } from "../store";
import SprintVelocity from './SprintVelocity';
import LeavePlans from './LeavePlans';
import TeamCapacity from './TeamCapacity';
import VelocityPicker from './VelocityPicker';

const defaultSize = { height: "100%", width: "100%" };

function CapacityPlanner({ velocityInfo, velocity, ...otherProps }) {
    return (<Splitter style={defaultSize}>
        <SplitterPanel size={80} minSize={40}>
            <HorizontalComponent {...otherProps} />
        </SplitterPanel>
        <SplitterPanel minSize={10}>
            <VerticalSplit velocityInfo={velocityInfo} />
        </SplitterPanel>
    </Splitter>);
}

export default connect(CapacityPlanner, ({ velocityInfo, resources, daysList }) =>
    ({ velocityInfo, resources, daysList }));

function HorizontalSplit({ resources, daysList: { groups } }) {
    return (<Splitter style={defaultSize} layout="vertical" >
        <SplitterPanel className="relative" minSize={20}>
            <LeavePlans height="100%" resources={resources} groups={groups} />
        </SplitterPanel>
        <SplitterPanel className="relative" minSize={20}>
            <TeamCapacity height="100%" resources={resources} groups={groups} />
        </SplitterPanel>
    </Splitter>);
}

const HorizontalComponent = React.memo(HorizontalSplit);

function VerticalSplit({ velocityInfo }) {
    return (<div className="d-flex flex-column w-100">
        <SprintVelocity velocityInfo={velocityInfo} />
        <VelocityPicker />
    </div>);
}