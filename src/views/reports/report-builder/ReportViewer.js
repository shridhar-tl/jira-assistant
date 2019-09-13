import React from 'react';
import BaseGadget from '../../../gadgets/BaseGadget';
import { inject } from '../../../services';
import { Button } from '../../../controls';
import { ReportViewer as JSRViewer } from "jsd-report";
import GroupEditor from '../../../dialogs/GroupEditor';

class ReportViewer extends BaseGadget {
    constructor(props) {
        super(props, 'Advanced report viewer', 'fa-clock-o');
        inject(this, "ReportConfigService", "AnalyticsService", "ReportService");

        this.viewer = {};

        this.$reportConfig.configureViewer();

        this.$reportConfig.parameters.removeAllListeners();
        this.$reportConfig.parameters.on("click", this.parameterClicked.bind(this));
        const { definition } = props;
        this.state.definition = definition;
    }

    UNSAFE_componentWillMount() {
        this.refreshReport();
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.definition) {
            this.setReportDefinition(props.definition);
        } else if (props.reportId) {
            this.refreshReport();
        }
        else {
            this.setReportDefinition({});
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
    }

    refreshReport() {
        if (this.props.reportId > 0) {
            this.$report.getReportDefinition(this.props.reportId).then(qm => {
                this.setReportDefinition(qm);
            });
        }
        else if (this.state.definition) {
            this.title = this.state.definition.queryName;
        }
    }

    setReportDefinition(definition) {
        this.setState({ definition });
    }

    getApi = (api) => this.viewer = api;

    renderCustomActions() {
        return <>
            {!this.isGadget && <Button icon={this.isFullScreen ? 'fa fa-compress' : 'fa fa-expand'} onClick={this.toggleFullScreen} title="Toggle full screen" />}
            {this.viewer.canShowParams && <Button icon="fa fa-plus-circle" onClick={this.viewer.showParameters} title="Change report params" />}
            {!this.isGadget && <Button icon="fa fa-edit" onClick={this.props.onCancelView} title="Edit report" />}
        </>;
    }

    render() {
        const { state: { definition, showGroupsPopup, groups } } = this;

        return super.renderBase(<>
            {definition && <JSRViewer api={this.getApi} definition={definition} />}
            {showGroupsPopup && <GroupEditor groups={groups} onHide={this.usersSelected} />}
        </>
        );
    }
}

export default ReportViewer;