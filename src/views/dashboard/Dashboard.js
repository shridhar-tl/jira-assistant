import React, { PureComponent } from 'react';
import './Dashboard.scss';
import { inject } from '../../services/injector-service';
import { GadgetActionType, Calendar, DateWiseWorklog, MyBookmarks, MyOpenTickets, MyReports, PendingWorklog, TicketWiseWorklog } from '../../gadgets';
import Header from './Header';
import AddGadgetDialog from './AddGadgetDialog';
import AddWorklog from '../../dialogs/AddWorklog';
import { onDashboardEvent } from '../../gadgets/BaseGadget';

class Dashboard extends PureComponent {
    constructor(props) {
        super(props);

        inject(this, "DashboardService", "SessionService", "ReportService", "CacheService");

        this.rapidViews = this.$session.CurrentUser.rapidViews || [];

        const { match: { params } } = props;
        this.isQuickView = parseInt(params['isQuickView'] || 0) === 1;
        this.state = this.loadDashboard(parseInt(params['index'] || 1));
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        const newIndex = newProps.match.params.index;
        if (newIndex !== this.state.dashboardIndex) {
            this.setState(this.loadDashboard(newIndex));
        }
    }

    loadDashboard(index) {
        index -= 1;
        const dashboards = this.$session.CurrentUser.dashboards;
        if (index >= dashboards.length) {
            index = 0;
        }
        return { dashboardIndex: index, currentBoard: dashboards[index] };
    }

    // ToDo: need to be removed
    showGadgets() {
        this.$report.getSavedFilters()
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

    getControls = (w, i) => {
        const { name, settings } = w;

        const props = {
            key: name,
            index: i,
            model: w,
            settings,
            layout: this.state.currentBoard.layout,
            onAction: this.widgetAction
        };

        switch (name) {
            case "myOpenTickets":
                return <MyOpenTickets {...props} />;

            case "myBookmarks":
            case "bookmarksList":
                return <MyBookmarks {...props} />;

            case "dateWiseWorklog":
            case "dtWiseWL":
                return <DateWiseWorklog {...props} />;

            case "pendingWL":
            case "pendingWorklog":
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
        const { currentBoard: { widgets },
            dashboardIndex, currentBoard, showGadgetDialog, showWorklogPopup } = this.state;

        return (
            <div>
                <Header {...this.props} config={currentBoard} index={dashboardIndex} userId={this.$session.userId}
                    onShowGadgets={this.onShowGadgets} />
                {widgets && widgets.length > 0 && <div>
                    {widgets.map(this.getControls)}
                </div>}

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