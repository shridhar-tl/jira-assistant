import { registerLicense } from '@syncfusion/ej2-base';
import { SplitterComponent, PanesDirective, PaneDirective } from '@syncfusion/ej2-react-layouts';
import Header from './Header';
import Planner from './Planner';
import { withProvider } from './store';
import { getInitialPlaningData } from './store/utils';
import Resources from './Resources';
import './Styles.scss';

// Registering Syncfusion license key
// eslint-disable-next-line max-len
registerLicense(process.env.REACT_APP_SF_LICENSE_KEY);

const SprintPlanner = function () {
    return (<div className="ja-sprint-planner">
        <Header />
        <SplitterComponent height="calc(100vh - 78px)" width="100%" orientation="Vertical" separatorSize={2}>
            <PanesDirective>
                <PaneDirective size="75%" min="200px" content={Planner} />
                <PaneDirective size="25%" min="100px" content={Resources} />
            </PanesDirective>
        </SplitterComponent>
    </div>);
};

export default withProvider(SprintPlanner, null, null, null, getInitialPlaningData);

