import React from 'react';
import BaseGadget from './BaseGadget';
import { inject } from '../services';
import { Button } from '../controls';
import { ReportViewer as JSRViewer } from "jsd-report";
import GroupEditor from '../dialogs/GroupEditor';

class ReportViewer extends BaseGadget {
    constructor(props) {
        super(props, 'Advanced report viewer', 'fa-clock-o');
        inject(this, "ReportConfigService", "AnalyticsService", "ReportService");

        this.viewer = {};

        this.$reportConfig.configureViewer();

        this.setReportDefinition({});
        this.viewerComponent = ReportViewer;
        this.$reportConfig.parameters.removeAllListeners();
        this.$reportConfig.parameters.on("click", this.parameterClicked.bind(this));
        const { definition } = props;
        this.state = { definition };
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.queryModel || props.queryId) {
            this.generateReport(this.queryModel);
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

    generateReport(queryModel) {
        this.setReportDefinition(queryModel);
        if (queryModel) {
            this.title = queryModel.queryName;
        }
        this.refreshReport();
    }

    refreshReport() {
        if (this.queryId > 0) {
            this.$report.getSavedQuery(this.queryId).then(qm => {
                this.setReportDefinition(qm);
            });
        }
    }

    setReportDefinition(definition) {
        this.setState({ definition });
    }

    getApi = (api) => this.viewer = api;

    renderCustomActions() {
        return <>
            <div>
                {!this.isGadget && <Button icon={this.isFullScreen ? 'fa fa-compress' : 'fa fa-expand'} onClick={this.toggleFullScreen} title="Toggle full screen" />}
                {this.viewer.canShowParams && <Button icon="fa fa-plus-circle" oClick={this.viewer.showParameters} title="Change report params" />}
                {/*!this.viewer.paramsMode && <Button icon="fa fa-refresh" onClick={() => fillReport(true)} title="Refresh data"></Button>*/}
                {/*hasReportData && <div jaExport element={tbl} fileName={queryModel.queryName}></div>*/}
                {!this.isGadget && <Button icon="fa fa-edit" onClick={this.props.onCancelView} title="Edit report" />}
            </div>
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