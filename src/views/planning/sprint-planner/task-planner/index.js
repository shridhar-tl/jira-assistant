import React from 'react';
import { SplitterComponent, PanesDirective, PaneDirective } from '@syncfusion/ej2-react-layouts';
import Planner from './Planner';
import Resources from './Resources';

const defaultHeights = ['calc(100vh - 235px)', '150px'];
function PlannerContainer() {
    const [paneSize, setPaneSize] = React.useState(defaultHeights);
    const updatePaneSize = React.useCallback(
        ({ paneSize: [s1, s2] }) =>
            setPaneSize([`${s1 - 2}px`, `${s2 - 2}px`]),
        [setPaneSize]);
    return (<SplitterComponent height="calc(100vh - 78px)" width="100%"
        orientation="Vertical" separatorSize={3} resizeStop={updatePaneSize}>
        <PanesDirective>
            <PaneDirective min="300px" content={() => <Planner height={paneSize[0]} />} />
            <PaneDirective size="150px" min="75px" content={() => <Resources height={paneSize[1]} />} />
        </PanesDirective>
    </SplitterComponent>);
}

export default PlannerContainer;
