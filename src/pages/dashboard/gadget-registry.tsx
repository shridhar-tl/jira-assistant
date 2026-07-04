import { GadgetTitle } from '@/gadgets/constants';

import {
    BaseGadgetUnavailable,
    CalendarGadget,
    DateWiseWorklog,
    MyBookmarks,
    MyOpenTickets,
    MyReports,
    PendingWorklog,
    StatusWiseTimeSpent,
    TicketWiseWorklog,
    WorklogBarChartGadget,
    WorklogReport,
} from '../../gadgets';

interface GadgetComponentInfo {
    Component: React.ComponentType<any>;
    props?: Record<string, any>;
}

export function getGadgetComponent(gadgetName: string, opts: string[] = []): GadgetComponentInfo | null {
    const gadgetMap: Record<string, () => GadgetComponentInfo> = {
        myOpenTickets: () => ({ Component: MyOpenTickets, props: { title: GadgetTitle.OpenTicket } }),
        bookmarksList: () => ({ Component: MyBookmarks, props: { title: GadgetTitle.Bookmarks } }),
        myBookmarks: () => ({ Component: MyBookmarks, props: { title: GadgetTitle.Bookmarks } }),
        dateWiseWorklog: () => ({ Component: DateWiseWorklog, props: { title: GadgetTitle.DateWiseWorklog } }),
        dtWiseWL: () => ({ Component: DateWiseWorklog, props: { title: GadgetTitle.DateWiseWorklog } }),
        ticketWiseWorklog: () => ({ Component: TicketWiseWorklog, props: { title: GadgetTitle.TicketWiseWorklog } }),
        pendingWorklog: () => ({ Component: PendingWorklog, props: { title: GadgetTitle.PendingWorklog } }),
        pendingWL: () => ({ Component: PendingWorklog, props: { title: GadgetTitle.PendingWorklog } }),
        myFilters: () => ({ Component: MyReports, props: { title: GadgetTitle.MyReports } }),
        worklogBarChart: () => ({ Component: WorklogBarChartGadget, props: { title: GadgetTitle.WorklogBarChart } }),
        sWiseTSpent: () => ({ Component: StatusWiseTimeSpent, props: { title: GadgetTitle.StatusWiseTimeSpent } }),
        teamWorklogReport: () => ({ Component: WorklogReport, props: { title: GadgetTitle.WorklogReport } }),

        agendaDay: () => ({
            Component: CalendarGadget,
            props: { viewMode: 'timeGridDay', title: 'Calendar - Day' },
        }),
        agendaWeek: () => ({
            Component: CalendarGadget,
            props: { viewMode: 'timeGridWeek', title: 'Calendar - Week' },
        }),
        listDay: () => ({
            Component: CalendarGadget,
            props: { viewMode: 'listDay', title: 'Calendar - Day List' },
        }),
        listWeek: () => ({
            Component: CalendarGadget,
            props: { viewMode: 'listWeek', title: 'Calendar - Week List' },
        }),
        listMonth: () => ({
            Component: CalendarGadget,
            props: { viewMode: 'listMonth', title: 'Calendar - Month List' },
        }),

        CR: () => ({
            Component: BaseGadgetUnavailable,
            props: { title: opts[1] || 'Custom Report' },
        }),
        AR: () => ({
            Component: BaseGadgetUnavailable,
            props: { title: opts[1] || 'Advanced Report' },
        }),
        SQ: () => ({
            Component: BaseGadgetUnavailable,
            props: { title: opts[1] || 'Saved Query' },
        }),
    };

    const gadgetFactory = gadgetMap[gadgetName];

    if (!gadgetFactory) {
        return {
            Component: BaseGadgetUnavailable,
            props: { title: 'Unknown Gadget' },
        };
    }

    return gadgetFactory();
}
