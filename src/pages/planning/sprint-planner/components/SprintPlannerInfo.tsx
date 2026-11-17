import { isPluginBuild } from '@/constants/build-info';
import { ReportInfoNote, ReportInfoSection } from '@/gadgets/shared';

const gettingStartedItems = [
    <>
        Choose a <strong>board</strong> in the toolbar. A board is one team: its filter decides which issues are planned and its estimation field is used for the estimates.
    </>,
    <>
        Open <i className="fa fa-users" /> <strong>Team</strong> to check the members, their allocation to this team, hours per day and working days, the focus factor and the planning
        unit (story points, hours or both).
    </>,
    <>
        Add leave and holidays in the <strong>Leave</strong> calendar or the <strong>Capacity</strong> view, or connect calendars under <i className="fa fa-users" /> Team → Leave
        calendars.
    </>,
    <>
        Use <i className="fa fa-filter" /> Filters to narrow every view, <i className="fa fa-refresh" /> to reload from Jira and <i className="fa fa-cog" /> for your own display and date
        settings.
    </>,
];

const boardItems = [
    'Columns are the backlog, the active sprint and the future sprints. Turn on closed sprints in the settings to see the last three (read only).',
    <>
        Drag issues between columns or within a column to change the sprint and the rank in Jira. Ctrl / Cmd + click selects several issues to move together.
    </>,
    <>
        Every card has an <i className="fa fa-ellipsis-h" /> menu with Move to, Move to top / bottom, Edit and Add dependency, so nothing needs dragging.
    </>,
    'Double click a card to edit the assignee, estimate, sprint and dates.',
    <>
        The <i className="fa fa-ellipsis-v" /> menu of a column creates, edits, starts or completes sprints, creates issues and sets a capacity override for the sprint.
    </>,
    'The capacity bar in each column header compares the committed estimate with the team capacity. Open People in the column footer for each member, and click a member to filter by them.',
    'The parent strip above the columns shows where the children of each epic are. Click a parent to highlight its cards. Drag the divider to resize the strip.',
];

const capacityItems = [
    'Capacity of a member = working days in the sprint × hours per day × allocation − leave − holidays, then the sprint override and the focus factor.',
    'Points capacity uses the selected velocity scaled by the available capacity. Without velocity it uses hours per point.',
    'Velocity lists the last closed sprints with the scope at sprint start and the completed scope. Choose average, median, last sprint or a custom value.',
    'The Leave view shows the leave and holidays of the team by month, week, day or as a list. Click a day or drag across days in the month to add leave, click a date to open that day, click an entry to edit or delete it, and drag it to move it. Filter by people to see only their leave.',
    'Leave calendars reduce the capacity of the person the leave belongs to. Holiday calendars reduce the capacity of everyone or of the chosen people.',
    'Calendar people that are not matched to a member are listed below the leave table. Map them once and the mapping is kept for the team.',
    'Kanban boards show capacity by week or month instead of by sprint.',
];

const forecastItems = [
    'Forecast places the ranked backlog into the upcoming sprints by capacity, and adds sprints after the last one when needed.',
    'Untick issues to leave them where they are, then accept. Accepted issues are moved to the sprints in Jira and missing sprints are created.',
    'Issues that cannot be placed are listed with the reason: not estimated, larger than any sprint, beyond the horizon or blocked by an unplanned issue.',
];

const healthItems = [
    'Health scores each open sprint on unestimated, unassigned and blocked issues, due dates after the sprint end, over-capacity members and carry-over.',
    'Planned vs actual compares capacity, committed and remaining estimates with the time logged in the active sprint. Load the logged time when needed.',
];

const roadmapItems = [
    'Roadmap shows epics with their issues by start and due date. Issues without dates use the sprint dates or the estimate, and their bars are faded.',
    'Drag or resize a bar to change the dates in Jira. Drag from the dot at the end of a bar to another bar to create a dependency, and click a line to remove it.',
    <>
        <strong>Planned segments</strong> split the work of an issue into date ranges with their own people and allocation, for example development then testing. Drag on the row of
        an issue to add one, double click a segment to edit, split or delete it.
    </>,
    'Once an issue has segments they are its plan everywhere: roadmap, resources, capacity and the Workload Heatmap.',
    'Choose the hierarchy levels and the bar colour in the settings. Sprints are shown as bands and releases as markers.',
];

const resourceItems = [
    'Resources shows each member with the work planned for them. The row under each person shows the daily load against their capacity.',
    'Drag a bar along the row to reschedule it or to another person to reassign it. Double click a bar to edit it.',
    'Drag issues from the Unscheduled list onto a person and a day to plan them. Turn on the daily load grid for the heatmap view of the same data.',
    'Drag the dividers to resize the timeline, the unscheduled list and the load grid.',
];

const draftItems = [
    'Draft mode stages moves, edits, plans and dependencies without writing to Jira. The bar below the toolbar counts the pending changes.',
    'Apply writes all of them and reports the result of each. Failed changes stay in the draft. Discard restores the board.',
    'Choose in the settings whether the planner opens in draft mode.',
];

export default function SprintPlannerInfo() {
    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
            <ReportInfoSection title="Getting started" icon="fa-info-circle" items={gettingStartedItems} defaultOpen />
            <ReportInfoSection title="Sprint board" icon="fa-columns" items={boardItems} />
            <ReportInfoSection title="Capacity, velocity and leave" icon="fa-tachometer" items={capacityItems} />
            <ReportInfoSection title="Forecast" icon="fa-magic" items={forecastItems} />
            <ReportInfoSection title="Health and tracking" icon="fa-heartbeat" items={healthItems} />
            <ReportInfoSection title="Roadmap and planned segments" icon="fa-road" items={roadmapItems} />
            <ReportInfoSection title="Resources" icon="fa-users" items={resourceItems} />
            <ReportInfoSection title="Draft mode" icon="fa-pen-to-square" items={draftItems} />
            <ReportInfoNote title="Where the data is kept:">
                Team settings and calendar sources are saved on the board, and planned segments on each issue, so everyone planning with the board sees the same data.
                {isPluginBuild
                    ? ' Leave is kept in the app storage of your Jira site, per board.'
                    : ' Leave is saved on the board, one entry per quarter. Nothing is saved until you accept the note shown at the top of the planner.'}{' '}
                Only the matched leave of a calendar is stored (person, dates and hours), never the whole calendar. Leave older than about 13 months is removed automatically.
                Your display settings are saved for you only.
            </ReportInfoNote>
        </div>
    );
}
