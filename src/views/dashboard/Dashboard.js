import React, { PureComponent } from 'react';
import './Dashboard.scss';
import { inject } from '../../services/injector-service';
import { GadgetActionType, Calendar, DateWiseWorklog, MyBookmarks, MyOpenTickets, MyReports, PendingWorklog, TicketWiseWorklog } from '../../gadgets';
import Header from './Header';
import AddGadgetDialog from './AddGadgetDialog';
import AddWorklog from '../../dialogs/AddWorklog';
import BaseGadget, { onDashboardEvent } from '../../gadgets/BaseGadget';
import { TabView, TabPanel } from 'primereact/tabview';
import CustomReport from '../reports/custom-report/ReportViewer';
import AdvancedReport from '../reports/report-builder/ReportViewer';

class Dashboard extends PureComponent {
    constructor(props) {
        super(props);

        inject(this, "DashboardService", "SessionService", "ReportService", "CacheService");

        this.rapidViews = this.$session.CurrentUser.rapidViews || [];

        const { match: { params } } = props;
        //this.isQuickView = parseInt(params['isQuickView'] || 0) === 1;
        this.isQuickView = this.$session.isQuickView;
        this.state = this.loadDashboard(parseInt(params['index'] || 0));
        this.setGadgetsList();
    }

    tabViewChanged = (isTabView) => this.setState({ isTabView })

    UNSAFE_componentWillReceiveProps(newProps) {
        const newIndex = newProps.match.params.index;
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

    // ToDo: need to be removed
    showGadgets() {
        this.$report.getReportsList()
            .then((result) => {
                this.savedQueries = result;
                this.setState({ showGadgetsPopup: true });
            });
    }

    addGadget = (gadgetName, settings) => {
        let { currentBoard } = this.state;
        currentBoard = { ...currentBoard };
        currentBoard.widgets = currentBoard.widgets.concat({ name: gadgetName, settings: settings || {} });
        this.setState({ currentBoard });
    }

    removeGadget = (gadgetName) => {
        let { currentBoard } = this.state;
        currentBoard = { ...currentBoard };
        const widgets = [...currentBoard.widgets];
        widgets.removeAll(g => g.name === gadgetName);
        currentBoard.widgets = widgets;
        this.setState({ currentBoard });
    }

    saveDashboardInfo = () => {
        const { dashboardIndex, currentBoard } = this.state;
        this.$dashboard.saveDashboardInfo(dashboardIndex, currentBoard);
    }

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
                const { widgets } = currentBoard;
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
    }

    emitToChildren($event, widgetIndex) {
        onDashboardEvent.emit("change", $event, widgetIndex);
    }

    gadgetReordered($event) {
        this.saveDashboardInfo();
    }

    /* Rewisit: Not sure where this is used
        getGadgetName(idx) {
            if (this.gadgetsList && this.gadgetsList.length > 0) {
                const gadget = this.gadgetsList.toArray()[idx];
                return gadget ? gadget.title : '';
            }
        }
        getGadgetIcon(idx) {
            if (this.gadgetsList && this.gadgetsList.length > 0) {
                const gadget = this.gadgetsList.toArray()[idx];
                return gadget ? gadget.iconClass : '';
            }
        }*/

    setGadgetsList() {
        const controls = {
            myOpenTickets: { title: "My open tickets", control: MyOpenTickets },
            bookmarksList: { title: "My Bookmarks", control: MyBookmarks },
            dateWiseWorklog: { title: "Daywise worklog", control: DateWiseWorklog },
            pendingWorklog: { title: "Worklog - [Pending upload]", control: PendingWorklog },
            ticketWiseWorklog: { title: "Ticketwise worklog", control: TicketWiseWorklog },
            myFilters: { title: "My reports", control: MyReports },
            agendaDay: { title: "Calendar", control: Calendar, getProps: () => { return { viewMode: "timeGridDay" }; } },
            agendaWeek: { title: "Calendar", control: Calendar, getProps: () => { return { viewMode: "timeGridWeek" }; } },
            SQ: { title: "Custom report", control: CustomReport, getProps: (sett, opts) => { return { reportId: parseInt(opts[0]) }; } },
            AR: { title: "Advanced report", control: AdvancedReport, getProps: (sett, opts) => { return { reportId: parseInt(opts[0]) }; } },
        };
        controls.myBookmarks = controls.bookmarksList;
        controls.dtWiseWL = controls.dateWiseWorklog;
        controls.pendingWL = controls.pendingWorklog;
        this.gadgetsList = controls;
    }

    getControls = (w, i) => {
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
            key: name,
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

        const gHtml = <Gadget {...props} />;

        if (tabLayout) {
            let title = gadgetRef.title;
            if (!title) {
                if (typeof Gadget.getTitle === "function") {
                    title = Gadget.getTitle(props);
                }
                else {
                    title = "Unknown Gadget";
                }
            }
            return <TabPanel key={name} header={title}>{gHtml}</TabPanel>;
        }
        else {
            return gHtml;
        }

        /*switch (name) {
            case "myOpenTickets":
                return <MyOpenTickets {...props} />;

            case "myBookmarks":
            case "bookmarksList":
                return <MyBookmarks {...props} />;

            case "dateWiseWorklog":
            case "dtWiseWL":
                return <DateWiseWorklog {...props} />;

            case "pendingWorklog":
            case "pendingWL":
                return <PendingWorklog {...props} />;

            case "ticketWiseWorklog":
                return <TicketWiseWorklog {...props} />;

            case "myFilters":
                return <MyReports {...props} />;

            case "agendaDay":
                return <Calendar {...props} viewMode="timeGridDay" />;

            case "agendaWeek":
                return <Calendar {...props} viewMode="timeGridWeek" />;

            default:

                break;
        }*/

    }

    getGadgets(widgets) {
        if (!widgets || !widgets.length) { return null; }

        const gadgets = widgets.map(this.getControls);

        if (this.state.isTabView) {
            return <TabView className="no-padding tab-gadgets">{gadgets}</TabView>;
        }
        else {
            return <div>{gadgets}</div>;
        }
    }

    onShowGadgets = () => {
        this.setState({ showGadgetDialog: true });
    }

    hideGadgetDialog = () => {
        this.setState({ showGadgetDialog: false });
        this.saveDashboardInfo();
    }

    worklogAdded = (e) => this.hideWorklog();
    hideWorklog = () => this.setState({ showWorklogPopup: false });

    render() {
        const {
            currentBoard: { widgets },
            dashboardIndex, currentBoard, showGadgetDialog, showWorklogPopup
        } = this.state;

        return (
            <div>
                <Header {...this.props} config={currentBoard} index={dashboardIndex} userId={this.$session.userId}
                    onShowGadgets={this.onShowGadgets} tabViewChanged={this.tabViewChanged} isQuickView={this.isQuickView} />
                {this.getGadgets(widgets)}

                {(!widgets || widgets.length === 0) && <div className="no-widget-div">
                    You haven't added any gadgets to this dashboard. Click on "Add gadgets" button above to start adding a cool one and personalize your experience.
                    </div>
                }

                {showGadgetDialog && <AddGadgetDialog onHide={this.hideGadgetDialog} widgetsList={widgets}
                    addGadget={this.addGadget} removeGadget={this.removeGadget} />}
                {showWorklogPopup && <AddWorklog worklog={this.worklogItem} onDone={this.worklogAdded} onHide={this.hideWorklog} />}
            </div>
        );
    }
}

export default Dashboard;