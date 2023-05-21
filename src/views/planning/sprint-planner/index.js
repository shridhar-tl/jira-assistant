import { registerLicense } from '@syncfusion/ej2-base';
import { SplitterComponent, PanesDirective, PaneDirective } from '@syncfusion/ej2-react-layouts';
import Header from './Header';
import Planner from './Planner';
import { withProvider } from './store';
import { getInitialPlaningData } from './store/utils';
import Resources from './Resources';
import './Styles.scss';
import { useCallback, useState } from 'react';

// Registering Syncfusion license key
// eslint-disable-next-line max-len
registerLicense(process.env.REACT_APP_SF_LICENSE_KEY);

const defaultHeights = ['calc(100vh - 235px)', '150px'];

const SprintPlanner = function () {
    const [paneSize, setPaneSize] = useState(defaultHeights);
    const updatePaneSize = useCallback(
        ({ paneSize: [s1, s2] }) =>
            setPaneSize([`${s1 - 2}px`, `${s2 - 2}px`]),
        [setPaneSize]);

    return (<div className="ja-sprint-planner">
        <Header />
        <SplitterComponent height="calc(100vh - 78px)" width="100%"
            orientation="Vertical" separatorSize={3} resizeStop={updatePaneSize}>
            <PanesDirective>
                <PaneDirective min="300px" content={() => <Planner height={paneSize[0]} />} />
                <PaneDirective size="150px" min="75px" content={() => <Resources height={paneSize[1]} />} />
            </PanesDirective>
        </SplitterComponent>
    </div>);
};

export default withProvider(SprintPlanner, null, null, null, getInitialPlaningData);

