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
    { id: 'myOpenTickets', icon: 'fa-eye', name: 'My Open Tickets', details: 'By default contains list of unresolved issues assigned to you. From Advanced settings page, you can customize the JQL used to pull issues list from Jira.' },
    { id: 'myBookmarks', icon: 'fa-bookmark', name: 'Bookmarks', details: 'Contains list of bookmarked issues. You can manage bookmarks from within the gadget. Bookmark list is global to all the dashboard.' },
    { id: 'dateWiseWorklog', icon: 'fa-list-alt', name: 'Logged Work - [Daywise]', details: 'Displays list of worklog\'s added by you grouped by date. You can control the date range from within the gadget.' },
    { id: 'worklogBarChart', icon: 'fa-bar-chart', name: 'Worklog Bar Chart', details: 'Worklogs added by current user is represented as a stacked bar chart. You can control the date range from within the gadget' },
    { id: 'teamWorklogReport', icon: 'fa-bar-chart', name: 'Team Daywise Worklog', details: 'Worklogs represented for individual users on daily basis as table. You can configure the users list and date range from within the gadget.' },
    { id: 'pendingWorklog', icon: 'fa-clock', name: 'Worklog - [Pending Upload]', details: 'Worklogs add by you from Jira Assist, which is yet to be uploaded to Jira is listed in this gadget. You can review and choose to edit or upload to Jira from within this gadget' },
    { id: 'ticketWiseWorklog', icon: 'fa-list-alt', name: 'Logged Work - [Ticketwise]', details: 'Displays list of worklog\'s added by you grouped by individual issue. You can control the date range from within the gadget.' },
    { id: 'myFilters', icon: 'fa-filter', name: 'My Reports', details: 'Displays the list of custom & advanced report built / imported by you. You can edit or delete the reports from within this gadget.' },
    { id: 'agendaDay', icon: 'fa-calendar', name: 'Current day calendar', details: 'Display calendar for current date with worklog and meetings' },
    { id: 'agendaWeek', icon: 'fa-calendar', name: 'Current week calendar', details: 'Display calendar for current week with worklog and meetings' },
    { id: 'listDay', icon: 'fa-calendar', name: 'Current day worklog List', details: 'Display calendar as list view for current date with worklog and meetings' },
    { id: 'listWeek', icon: 'fa-calendar', name: 'Current week worklog list', details: 'Display calendar as list view for current week with worklog and meetings' },
    { id: 'listMonth', icon: 'fa-calendar', name: 'Current month worklog list', details: 'Display calendar as list view for current month with worklog and meetings' },
    { id: 'sWiseTSpent', icon: 'fa-list-alt', name: 'Status Wise Time Spent', details: 'Provides summary of time spent on each ticket on individual status' }
];