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

    planData: {}, // Ticket, status wise data
    allocationData: {}, // Contains user wise daily time allocation

    resources: [], // List of resources
    resourceLeaveDays: {}, // List of user wise leave plans
    resourceHolidays: {}, // List of holidays

    settings: {
        startOfDay: '11:00',
        endOfDay: '20:00',
        noOfSprintsForVelocity: 6,
        workHours: 6,
        hoursPerStoryPoint: 4,
        allowStorySpan: true, // Whether to allow spanning story or not
        workspace: [],
        leaveCalendar: [],
        holidayCalendar: []
    }
};

const { withProvider, connect } = createStore(initialData);

export { withProvider, connect };