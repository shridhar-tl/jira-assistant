import React from 'react';
import BaseGadget from '../../../gadgets/BaseGadget';
import { inject } from '../../../services';
import { Button } from '../../../controls';
import { ReportViewer as JSRViewer } from "jsd-report";
import GroupEditor from '../../../dialogs/GroupEditor';
import "./ReportViewer.scss";
import AddWorklog from '../../../dialogs/AddWorklog';
import { EventCategory } from '../../../_constants';

class ReportViewer extends BaseGadget {
    constructor(props) {
        super(props, 'Advanced report viewer', 'fa-clock-o');
        inject(this, "ReportConfigService", "AnalyticsService", "ReportService");

        this.viewer = {};

        this.$reportConfig.configureViewer();

        this.$reportConfig.parameters.removeAllListeners();
        this.$reportConfig.parameters.on("click", this.parameterClicked.bind(this));
        this.$reportConfig.eventPipe.on("addWorklog", this.addWorklog.bind(this));
        const { definition } = props;
        this.state.definition = definition;
    }

    UNSAFE_componentWillMount() {
        this.refreshData();
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.definition) {
            this.setReportDefinition(props.definition);
        } else if (props.reportId) {
            this.refreshData();
        }
        else {
            this.setReportDefinition({});
        }
    }

    addWorklog(data) {
        if (this.isGadget) {
            super.addWorklog(data);
        }
        else {
            this.worklogItem = data;
            this.setState({ showWorklogPopup: true });
        }
    }

    parameterClicked(e) {
        this.parameterEvent = e;
        this.setState({ showGroupsPopup: true });
    }

    usersSelected = (groups) => {
        this.parameterEvent.onChange(this.parameterEvent.definition, groups);
        this.parameterEvent = null;
        this.setState({ showGroupsPopup: false, groups });
    };

    refreshData = () => {
        if (this.props.reportId > 0) {
            this.$report.getReportDefinition(this.props.reportId).then(qm => {
                this.setReportDefinition(qm);
                this.$analytics.trackEvent("Advanced report viewed", EventCategory.UserActions);
            });
        }
        else if (this.state.definition) {
            this.title = this.state.definition.queryName;
            this.$analytics.trackEvent("Advanced report viewed", EventCategory.UserActions);
        }
    };

    setReportDefinition(definition) {
        if (definition && definition.queryName) {
            this.title = definition.queryName;
        }

        this.setState({ definition });
    }

    getApi = (api) => this.viewer = api;

    worklogAdded = (result) => {
        // ToDo:
        this.hideWorklog();
    };

    hideWorklog = () => {
        this.setState({ showWorklogPopup: false });
    };

    renderCustomActions() {
        return <>
            {!this.isGadget && <Button icon={this.isFullScreen ? 'fa fa-compress' : 'fa fa-expand'} onClick={this.toggleFullScreen} title="Toggle full screen" />}
            {this.viewer.canShowParams && <Button icon="fa fa-plus-circle" onClick={this.viewer.showParameters} title="Change report params" />}
            {!this.isGadget && <Button icon="fa fa-edit" onClick={this.props.onCancelView} title="Edit report" />}
        </>;
    }

    render() {
        const { state: { definition, showGroupsPopup, groups, showWorklogPopup } } = this;

        return super.renderBase(<>
            {definition && <JSRViewer api={this.getApi} definition={definition} />}
            {showGroupsPopup && <GroupEditor groups={groups} onHide={this.usersSelected} />}
            {showWorklogPopup && <AddWorklog worklog={this.worklogItem} onDone={this.worklogAdded} onHide={this.hideWorklog} />}
        </>
        );
    }
}

export default ReportViewer;