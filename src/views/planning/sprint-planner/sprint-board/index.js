import React from 'react';
import DragDropProvider from 'react-controls/controls/drag-drop';
import { connect } from '../store';
import KanbanBoard from '../kanban-board';
import { getIssuesForSprint } from '../store/actions';
import { rearrangeIssue } from './actions';
import EpicDetails from './EpicDetails';
import CardTemplate from './CardTemplate';

function SprintBoards({ sprintLists, scope, getIssuesForSprint, rearrangeIssue }) {
    if (!sprintLists) {
        return null;
    }

    return (<div className="h-100">
        <DragDropProvider>
            <KanbanBoard
                columns={sprintLists} columnTemplate={ColumnTemplate}
                templateScope={scope}
                columnKeyField="id" headerTextField="name"
                itemsTemplate={CardTemplate} filterItems={getIssuesForSprint}
                bodyHeaderTemplate={EpicDetails}
                onChange={rearrangeIssue}
                placeholder="Move issue to the end of this sprint"
            />
        </DragDropProvider>
    </div>);
}

function mapStateToProps({ sprintLists, epicNameField, estimation, epicMap }, { scope }) {
    scope.epicNameField = epicNameField;
    scope.estimation = estimation;
    scope.epicMap = epicMap;

    return { sprintLists, scope };
}

function mapServices({
    $userutils: { formatDate, getTicketUrl }
}) {
    return { scope: { formatDate, getTicketUrl } };
}

export default connect(SprintBoards,
    mapStateToProps,
    { getIssuesForSprint, rearrangeIssue },
    ['UserUtilsService', mapServices]);

function ColumnTemplate({ column: sprint, scope: { formatDate } }) {
    const { name, startDate, endDate } = sprint;

    return (<div className="text-center w-100">
        <div className="font-bold">{name}</div>
        <div className="font-normal">{formatDate(startDate)} - {formatDate(endDate)}</div>
    </div>);
}
