import { GadgetActionType } from './BaseGadget';
import Calendar from './Calendar/Calendar';
import DateWiseWorklog from './DateWiseWorklog';
import WorklogGadget from './WorklogGadget/WorklogGadget';
import MyBookmarks from './MyBookmarks';
import MyOpenTickets from './MyOpenTickets';
import MyReports from './MyReports';
import PendingWorklog from './PendingWorklog';
import TicketWiseWorklog from './TicketWiseWorklog';


export { GadgetActionType, Calendar, DateWiseWorklog, WorklogGadget, MyBookmarks, MyOpenTickets, MyReports, PendingWorklog, TicketWiseWorklog };

export const GadgetList = [
    { id: 'myOpenTickets', icon: 'fa-eye', name: 'My Open Tickets', details: 'Contains the list of open tickets assigned to you' },
    { id: 'myBookmarks', icon: 'fa-bookmark', name: 'Bookmarks', details: 'List of bookmarked tickets' },
    { id: 'dateWiseWorklog', icon: 'fa-list-alt', name: 'Logged Work - [Daywise]', details: 'List of worklog\'s grouped by date' },
    { id: 'pendingWorklog', icon: 'fa-clock-o', name: 'Worklog - [Pending Upload]', details: 'Worklog\'s still pending for upload' },
    { id: 'ticketWiseWorklog', icon: 'fa-list-alt', name: 'Logged Work - [Ticketwise]', details: 'List of worklog\'s grouped by ticket' },
    { id: 'myFilters', icon: 'fa-filter', name: 'My Reports', details: 'List of custom & advanced report built / imported by you' },
    { id: 'agendaDay', icon: 'fa-calendar', name: 'Current day calendar', details: 'Display calendar for current date for worklog and meetings' },
    { id: 'agendaWeek', icon: 'fa-calendar', name: 'Current week calendar', details: 'Display calendar for current week for worklog and meetings' }
];