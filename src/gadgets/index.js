import { GadgetActionType } from './_constants';
import Calendar from './Calendar/Calendar';
import StatusWiseTimeSpentGadget from './StatusWiseTimeSpent/StatusWiseTimeSpentGadget';
import DateWiseWorklog from './DateWiseWorklog';
import WorklogGadget from './WorklogGadget/WorklogGadget';
import WorklogReport from './WorklogReport/WorklogReport';
import WorklogBarChartGadget from './WorklogBarChartGadget';
import MyBookmarks from './MyBookmarks';
import MyOpenTickets from './MyOpenTickets';
import MyReports from './MyReports';
import PendingWorklog from './PendingWorklog';
import TicketWiseWorklog from './TicketWiseWorklog';


export { GadgetActionType, Calendar, DateWiseWorklog, WorklogGadget, WorklogReport, WorklogBarChartGadget, MyBookmarks, MyOpenTickets, MyReports, PendingWorklog, TicketWiseWorklog, StatusWiseTimeSpentGadget };

export const GadgetList = [
    {
        "id": "myOpenTickets",
        "icon": "fa-eye",
        "name": "My Open Tickets",
        "details": "This gadget contains a list of unresolved issues assigned to you by default. You can further customize the list by configuring the Jira Query Language (JQL) from the Advanced Settings page."
    },
    {
        "id": "myBookmarks",
        "icon": "fa-bookmark",
        "name": "Bookmarks",
        "details": "The Bookmarks gadget holds a list of bookmarked issues. You can manage your bookmarks directly from this gadget, and please note that the bookmark list is shared across all dashboards."
    },
    {
        "id": "dateWiseWorklog",
        "icon": "fa-list-alt",
        "name": "Logged Work - [Daywise]",
        "details": "This gadget displays a list of your worklogs grouped by date. You have control over the date range, which can be adjusted within the gadget."
    },
    {
        "id": "worklogBarChart",
        "icon": "fa-bar-chart",
        "name": "Worklog Bar Chart",
        "details": "In this gadget, worklogs added by the current user are represented as a stacked bar chart. You can customize the date range directly within the gadget."
    },
    {
        "id": "teamWorklogReport",
        "icon": "fa-bar-chart",
        "name": "Team Daywise Worklog",
        "details": "This gadget presents worklogs for individual users on a daily basis in a table format. You can configure both the user list and date range from within the gadget."
    },
    {
        "id": "pendingWorklog",
        "icon": "fa-clock",
        "name": "Worklog - [Pending Upload]",
        "details": "Worklogs added by you in Jira Assistant that are awaiting upload to Jira are listed in this gadget. You can review, edit, or choose to upload them to Jira directly from this gadget."
    },
    {
        "id": "ticketWiseWorklog",
        "icon": "fa-list-alt",
        "name": "Logged Work - [Ticketwise]",
        "details": "This gadget provides a list of worklogs added by you, grouped by individual issues. You have the flexibility to adjust the date range within the gadget."
    },
    {
        "id": "myFilters",
        "icon": "fa-filter",
        "name": "My Reports",
        "details": "In the My Reports gadget, you will find a list of custom and advanced reports that you have built or imported. You can edit or delete these reports directly from this gadget."
    },
    {
        "id": "agendaDay",
        "icon": "fa-calendar",
        "name": "Current Day Calendar",
        "details": "This gadget displays a calendar for the current date, showing worklogs and meetings for the day."
    },
    {
        "id": "agendaWeek",
        "icon": "fa-calendar",
        "name": "Current Week Calendar",
        "details": "In this gadget, you can view a calendar for the current week, featuring worklogs and meetings."
    },
    {
        "id": "listDay",
        "icon": "fa-calendar",
        "name": "Current Day Worklog List",
        "details": "The Current Day Worklog List gadget provides a list view of your calendar for the current date, including worklogs and meetings."
    },
    {
        "id": "listWeek",
        "icon": "fa-calendar",
        "name": "Current Week Worklog List",
        "details": "This gadget offers a list view of your calendar for the current week, showing worklogs and meetings."
    },
    {
        "id": "listMonth",
        "icon": "fa-calendar",
        "name": "Current Month Worklog List",
        "details": "View your calendar as a list for the current month, including worklogs and meetings, in the Current Month Worklog List gadget."
    },
    {
        "id": "sWiseTSpent",
        "icon": "fa-list-alt",
        "name": "Status Wise Time Spent",
        "details": "The Status Wise Time Spent gadget provides a summary of time spent on each ticket, organized by individual status."
    }
];