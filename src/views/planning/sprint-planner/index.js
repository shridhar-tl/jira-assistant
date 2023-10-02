import React from 'react';
import { useParams } from 'react-router-dom';
import { registerLicense } from '@syncfusion/ej2-base';
import { withProvider } from './store';
import { getInitialPlaningData } from './store/utils';
import Header from './Header';
import SprintBoards from './sprint-board';
import PlannerContainer from './task-planner';
import CapacityPlanner from './capacity-planner';
import { setSelectedBoard } from './store/actions';
import './Styles.scss';

// Registering Syncfusion license key
registerLicense(process.env.REACT_APP_SF_LICENSE_KEY);

const SprintPlanner = function ({ setSelectedBoard }) {
    const { boardId } = useParams() || {};
    const [currentTab, setCurrentTab] = React.useState(0);
    const ref = React.useRef({ setSelectedBoard });
    ref.current.setSelectedBoard = setSelectedBoard;

    React.useEffect(() => {
        if (!boardId) {
            return;
        }

        ref.current.setSelectedBoard(boardId);
    }, [boardId]);

    return (<div className="ja-sprint-planner">
        <Header onTabChange={setCurrentTab} />
        {currentTab === 0 && <SprintBoards />}
        {currentTab === 1 && <PlannerContainer />}
        {currentTab === 3 && <CapacityPlanner />}
    </div>);
};

export default withProvider(SprintPlanner, null, { setSelectedBoard }, null, getInitialPlaningData);

