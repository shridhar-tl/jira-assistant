import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from 'react-controls/controls';
import { usePlannerState, withProvider } from './store';
import { getInitialPlaningData } from './store/utils';
import Header from './Header';
import SprintBoards from './sprint-board';
import PlannerContainer from './task-planner';
import CapacityPlanner from './capacity-planner';
import { setSelectedBoard } from './store/actions';
import './Styles.scss';

function SprintPlanner({ setSelectedBoard }) {
    const { boardId, module } = useParams() || {};
    const navigate = useNavigate();

    const ref = React.useRef({ setSelectedBoard });
    ref.current.setSelectedBoard = setSelectedBoard;

    const setCurrentTab = (route) => boardId && navigate(`${boardId}/${route}`);

    React.useEffect(() => {
        if (!boardId) {
            return;
        }

        ref.current.setSelectedBoard(boardId);
    }, [boardId]);

    const loading = usePlannerState(state => state.loading);
    const loadedBoardId = usePlannerState(state => state.loadedBoardId);

    return (<>
        <Header onTabChange={setCurrentTab} module={module ?? ''} />
        {loading && <div className="ja-sprint-planner">
            <Loader />
        </div>}
        {boardId && loadedBoardId === boardId && <div className="ja-sprint-planner">
            {!module && <SprintBoards />}
            {module === 'planner' && <PlannerContainer />}
            {module === 'capacity' && <CapacityPlanner />}
        </div>}
    </>);
}

export default withProvider(SprintPlanner, null, { setSelectedBoard }, null, getInitialPlaningData);
