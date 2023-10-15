import createStore from "../../../../common/state-store";

const initialData = {
    loading: false,

    planId: '', // Id of plan

    // Contains selected board
    boardId: 0,
    boardName: '',

    sprintBoards: [], // Contains list of boards from Jira
    daysList: {},

    columnConfig: {},
    estimation: {},

    allocationData: {}, // Contains user wise daily time allocation

    resources: [], // List of resources
    resourceLeaveDays: {}, // List of user wise leave plans
    resourceHolidays: {}, // List of holidays
    sprintWiseLeaveAndHolidays: {}, // Computed list of holiday for sprint user wise

    velocity: { selected: 'C' },

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

const { useStateStore: usePlannerState, withProvider, connect } = createStore(initialData);

export { usePlannerState, withProvider, connect };