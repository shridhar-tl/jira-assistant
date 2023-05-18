import createStore from "../../../../common/store";

const initialData = {
    planId: '', // Id of plan

    // Contains selected board
    boardId: 0,
    boardName: '',

    sprintBoards: [], // Contains list of boards from Jira
    daysList: {},

    columnConfig: {},
    estimation: {},

    resources: [],


    settings: {
        startOfDay: '11:00',
        endOfDay: '20:00',
        workHours: 6,
        hoursPerStoryPoint: 4,
        allowStorySpan: true, // Whether to allow spaning story or not
        workspace: []
    }
};

const { withProvider, connect } = createStore(initialData);

export { withProvider, connect };