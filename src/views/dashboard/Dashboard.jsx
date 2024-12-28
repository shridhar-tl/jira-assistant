import React, { PureComponent } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { inject } from '../../services/injector-service';
import {
    GadgetActionType, Calendar, DateWiseWorklog, MyBookmarks, MyOpenTickets, MyReports,
    PendingWorklog, TicketWiseWorklog, StatusWiseTimeSpentGadget, WorklogBarChartGadget, WorklogReport
} from '../../gadgets';
import Header from './Header';
import AddGadget from './AddGadget';
import AddWorklog from '../../dialogs/AddWorklog';
import BaseGadget, { onDashboardEvent } from '../../gadgets/BaseGadget';
import CustomReport from '../reports/custom-groupable/ReportViewer';
import { Sortable } from '../../controls';
import './Dashboard.scss';

class Dashboard extends PureComponent {
    constructor(props) {
        super(props);

        inject(this, "DashboardService", "SessionService", "ReportService", "CacheService");

        this.rapidViews = this.$session.CurrentUser.rapidViews || [];

        const { match: { params } } = props;
        this.isQuickView = this.$session.isQuickView;
        this.state = this.loadDashboard(parseInt(params['index'] || 0));
        this.gadgetsList = getGadgetsList();
    }

    tabViewChanged = (isTabView) => this.setState({ isTabView });

    UNSAFE_componentWillReceiveProps(newProps) {
        const newIndex = parseInt(newProps.match.params.index || 0);
        if (newIndex !== this.state.dashboardIndex) {
            this.setState(this.loadDashboard(newIndex));
        }
    }

    loadDashboard(index) {
        const dashboards = this.$session.CurrentUser.dashboards;
        if (index >= dashboards.length) {
            index = 0;
        }
        const currentBoard = dashboards[index];
        return { dashboardIndex: index, currentBoard, isTabView: this.isQuickView || currentBoard.isTabView };
    }

    addGadget = (gadgetName, settings) => {
        let { currentBoard } = this.state;
        currentBoard = { ...currentBoard };
        currentBoard.widgets = currentBoard.widgets.concat({ name: gadgetName, settings: settings || {} });
        this.setState({ currentBoard });
    };

    removeGadget = (gadgetName) => {
        let { currentBoard } = this.state;
        currentBoard = { ...currentBoard };
        const widgets = [...currentBoard.widgets];
        widgets.removeAll(g => g.name === gadgetName);
        currentBoard.widgets = widgets;
        this.setState({ currentBoard });
    };

    saveDashboardInfo = () => {
        const { dashboardIndex, currentBoard } = this.state;
        this.$dashboard.saveDashboardInfo(dashboardIndex, currentBoard);
    };

    widgetAction = ($event, gadget, widgetIndex) => {
        switch ($event.type) {
            case GadgetActionType.AddWorklog:
                this.worklogItem = $event.data;
                this.setState({ showWorklogPopup: true });
                break;
            //case 2: this.worklogIdToEdit = $event.worklogId; this.showWorklogPopup = true; break;
            case GadgetActionType.RemoveGadget:
                let { currentBoard } = this.state;
                currentBoard = { ...currentBoard };
                const widgets = [...currentBoard.widgets];
                currentBoard.widgets = widgets;
                widgets.splice(widgetIndex, 1);
                this.setState({ currentBoard }, this.saveDashboardInfo);
                this.emitToChildren($event, widgetIndex);
                break;
            case GadgetActionType.SettingsChanged:
                gadget.settings = $event.data;
                this.saveDashboardInfo();
                break;
            default:
                this.emitToChildren($event, widgetIndex);
                break;
        }
    };

    emitToChildren($event, widgetIndex) {
        onDashboardEvent.emit("change", $event, widgetIndex);
    }

    gadgetReordered = (widgets) => {
        let { currentBoard } = this.state;
        currentBoard = { ...currentBoard, widgets };
        this.setState({ currentBoard }, this.saveDashboardInfo);
    };

    getControls = (w, i, { draggable: { dragRef } = {}, droppable } = {}) => {
        let { name } = w;
        const { settings } = w;
        const tabLayout = this.state.isTabView;
        const nameOpts = name.split(":");
        if (nameOpts.length > 1) {
            name = nameOpts[0];
            nameOpts.splice(0, 1);
        }

        let gadgetRef = this.gadgetsList[name];

        if (!gadgetRef) { gadgetRef = { title: "Gadget Unavailable", control: BaseGadget }; } // ToDo: Need to remove once report gadgets are implemented


        let addProps = null;

        if (gadgetRef.getProps) {
            addProps = gadgetRef.getProps(settings, nameOpts);
        }

        const props = {
            key: `${name}_${nameOpts[0]}`,
            gadgetType: name,
            tabLayout,
            index: i,
            model: w,
            settings,
            isGadget: true,
            layout: this.state.currentBoard.layout,
            onAction: this.widgetAction,
            ...addProps
        };

        const Gadget = gadgetRef.control;

        if (tabLayout) {
            let title = addProps?.title || gadgetRef.title;
            if (!title) {
                if (typeof Gadget.getTitle === "function") {
                    title = Gadget.getTitle(props);
                }
                else {
                    title = "Unknown Gadget";
                }
            }
            return <TabPanel key={name} header={title}><Gadget {...props} /></TabPanel>;
        }
        else {
            return <Gadget {...props} draggableHandle={dragRef} dropProps={droppable} />;
        }
    };


    getGadgets(widgets) {
        if (!widgets || !widgets.length) { return null; }

        if (this.state.isTabView) {
            return <TabView className="no-padding tab-gadgets">{widgets.map(this.getControls)}</TabView>;
        }
        else {
            return <Sortable className="dashboard-gadgets" useDragRef useDropRef items={widgets} defaultItemType="gadget" onChange={this.gadgetReordered}>{this.getControls}</Sortable>;
        }
    }

    onShowGadgets = () => this.setState({ showGadgetPanel: true });

    hideGadgetDialog = () => {
        this.setState({ showGadgetPanel: false });
        this.saveDashboardInfo();
    };

    worklogAdded = (e) => {
        this.emitToChildren(e);
        this.hideWorklog();
    };

    hideWorklog = () => this.setState({ showWorklogPopup: false });

    render() {
        const {
            currentBoard: { widgets },
            dashboardIndex, currentBoard, showGadgetPanel, showWorklogPopup
        } = this.state;

        return (
            <>
                {!this.isQuickView && <AddGadget show={showGadgetPanel} onHide={this.hideGadgetDialog} addedGadgets={widgets}
                    addGadget={this.addGadget} removeGadget={this.removeGadget} />}
                <div className="page-container dashboard-container">
                    {!this.isQuickView && <Header {...this.props} config={currentBoard} index={dashboardIndex} userId={this.$session.userId}
                        onShowGadgets={this.onShowGadgets} tabViewChanged={this.tabViewChanged} isQuickView={this.isQuickView} />}
                    {this.getGadgets(widgets)}
                    {(!widgets || widgets.length === 0) && <div className="no-widget-div">
                        You haven't added any gadgets to this dashboard. Click on "Add gadgets" button above to start adding a cool one and personalize your experience.
                    </div>
                    }
                </div>
                {showWorklogPopup && <AddWorklog worklog={this.worklogItem} onDone={this.worklogAdded} onHide={this.hideWorklog} />}
            </>
        );
    }
}

export default Dashboard;


function getGadgetsList() {
    const controls = {
        myOpenTickets: { title: "My open tickets", control: MyOpenTickets },
        bookmarksList: { title: "My Bookmarks", control: MyBookmarks },
        dateWiseWorklog: { title: "Daywise worklog", control: DateWiseWorklog },
        worklogBarChart: { title: "Worklog Bar Chart", control: WorklogBarChartGadget },
        teamWorklogReport: { title: "Team Daywise Worklog", control: WorklogReport },
        pendingWorklog: { title: "Worklog - [Pending upload]", control: PendingWorklog },
        ticketWiseWorklog: { title: "Ticketwise worklog", control: TicketWiseWorklog },
        sWiseTSpent: { title: "Status Wise Time Spent", control: StatusWiseTimeSpentGadget },
        myFilters: { title: "My reports", control: MyReports },
        agendaDay: { title: "Calendar", control: Calendar, getProps: () => ({ viewMode: "timeGridDay" }) },
        agendaWeek: { title: "Calendar", control: Calendar, getProps: () => ({ viewMode: "timeGridWeek" }) },
        listDay: { title: "Calendar", control: Calendar, getProps: () => ({ viewMode: "listDay" }) },
        listWeek: { title: "Calendar", control: Calendar, getProps: () => ({ viewMode: "listWeek" }) },
        listMonth: { title: "Calendar", control: Calendar, getProps: () => ({ viewMode: "listMonth" }) },
        CR: { title: "Custom report", control: CustomReport, getProps: (sett, opts) => ({ reportId: parseInt(opts[0]), title: opts[1] }) },
    };

    controls.myBookmarks = controls.bookmarksList;
    controls.dtWiseWL = controls.dateWiseWorklog;
    controls.pendingWL = controls.pendingWorklog;
    return controls;
}