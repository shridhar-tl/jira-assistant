import React from 'react';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import SprintPlanner from './SprintPlanner';
import Resources from './Resources';

const defaultSplitterStyle = { height: 'calc(100vh - 52px)', width: '100%' };

function PlannerContainer() {
    return (<Splitter style={defaultSplitterStyle} layout="vertical">
        <SplitterPanel className="relative" minSize={5}><SprintPlanner height="100%" /></SplitterPanel>
        <SplitterPanel className="relative" minSize={5}><Resources height="100%" /></SplitterPanel>
    </Splitter>);
}

export default PlannerContainer;
