import { useCallback, useState } from 'react';
import { registerLicense } from '@syncfusion/ej2-base';
import { SplitterComponent, PanesDirective, PaneDirective } from '@syncfusion/ej2-react-layouts';
import { withProvider } from './store';
import { getInitialPlaningData } from './store/utils';
import Header from './Header';
import Planner from './Planner';
import Resources from './Resources';
import CapacityPlanner from './CapacityPlanner';
import './Styles.scss';

// Registering Syncfusion license key
registerLicense(process.env.REACT_APP_SF_LICENSE_KEY);

const SprintPlanner = function () {
    const [currentTab, setCurrentTab] = useState(0);

    return (<div className="ja-sprint-planner">
        <Header onTabChange={setCurrentTab} />
        {currentTab === 0 && <PlannerContainer />}
        {currentTab === 2 && <CapacityPlanner />}
    </div>);
};

export default withProvider(SprintPlanner, null, null, null, getInitialPlaningData);

const defaultHeights = ['calc(100vh - 235px)', '150px'];
function PlannerContainer() {
    const [paneSize, setPaneSize] = useState(defaultHeights);
    const updatePaneSize = useCallback(
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