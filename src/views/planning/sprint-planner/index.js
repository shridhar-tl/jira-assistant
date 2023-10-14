import React from 'react';
import { useParams } from 'react-router-dom';
import { withProvider } from './store';
import { getInitialPlaningData } from './store/utils';
import Header from './Header';
import SprintBoards from './sprint-board';
import PlannerContainer from './task-planner';
import CapacityPlanner from './capacity-planner';
import { setSelectedBoard } from './store/actions';
import './Styles.scss';

function SprintPlanner({ setSelectedBoard }) {
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

    return (<>
        <Header onTabChange={setCurrentTab} tabIndex={currentTab} />
        <div className="ja-sprint-planner">
            {currentTab === 0 && <SprintBoards />}
            {currentTab === 1 && <PlannerContainer />}
            {currentTab === 3 && <CapacityPlanner />}
        </div>
    </>);
}

export default withProvider(SprintPlanner, null, { setSelectedBoard }, null, getInitialPlaningData);
