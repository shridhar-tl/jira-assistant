import React, { PureComponent } from 'react';
import { inject } from '../../../services/injector-service';
import QueryEditor from './QueryEditor';
import SaveReportDialog from '../../../dialogs/SaveReportDialog';
import Dialog from '../../../dialogs';
import ReportViewer from './ReportViewer';
import './Common.scss';

class CustomReport extends PureComponent {
    constructor(props) {
        super();
        inject(this, "ReportService", "JiraService", "MessageService", "AnalyticsService");
        let { match: { params: { reportId } } } = props;

        if (reportId) {
            reportId = parseInt(reportId);
        }

        this.state = this.getEmptyReport(reportId);

        this.loadReport(reportId);
    }

    UNSAFE_componentWillReceiveProps(props) {
        let { match: { params: { reportId } } } = props;
        if (reportId) {
            reportId = parseInt(reportId);
        }
        if (this.state.reportId !== reportId) {
            this.loadReport(reportId);
        }
    }

    getEmptyReport(reportId = null) {
        return {
            reportId,
            query: {
                jql: '',
                fields: []
            }
        };
    }

    initModel = () => this.querySelected('');

    loadReport = async (reportId) => {
        await this.fillQueriesList(reportId);

        if (!reportId) {
            return;
        }

        const query = await this.$report.getReportDefinition(reportId);

        this.setState({ reportId, query, reportQuery: null, hasUnsavedChanges: false });
    }

    fillQueriesList = async (reportId) => {
        const result = await this.$report.getReportsList();

        const reportsList = result
            .filter(q => q.isNew)
            .map(q => ({ value: q.id, label: q.queryName }));

        this.setState({ reportId, reportsList });
    }

    querySelected = (reportId) => {
        let { history, match: { path } } = this.props;

        if (path.indexOf(':reportId') >= 0) {
            path = path.replace(':reportId', reportId).clearEnd('/');
        }
        else if (reportId) {
            path = `${path}/${reportId}`;
        }
        else { // When report id is not available then user clicked on New Query button
            this.setState(this.getEmptyReport());
            return;
        }

        history.push(path);
    }

    queryChanged = (query) => this.setState({ query, hasUnsavedChanges: true });

    deleteQuery = () => {
        const { reportId, query: { queryName } } = this.state;

        Dialog.confirmDelete(`Are you sure to delete the report named "${queryName}" permenantly?`)
            .then(() => {
                this.$report.deleteSavedQuery(reportId).then(q => {
                    this.$message.success('Report deleted successfully!');
                    this.querySelected('');
                });
            });
    }

    viewReport = () => this.setState({ reportQuery: this.state.query });
    showSaveDialog = () => this.setState({ showSaveDialog: true });
    saveAs = () => this.saveQuery(this.state.query.queryName);
    hideSaveDialog = () => this.setState({ showSaveDialog: false });

    saveQuery = (queryName, copy) => {
        let { query } = this.state;
        query = { ...query };

        const oldQryName = query.queryName;
        let refillList = false;

        query.queryName = queryName;
        if (copy) {
            delete query.id;
            refillList = true;
        }
        else if (oldQryName !== queryName) {
            refillList = true;
        }

        this.$report.saveQuery(query).then((id) => {
            query.id = id;

            this.setState({ showSaveDialog: false, hasUnsavedChanges: false, reportId: id, query });

            this.$message.success("Report saved successfully!");
            this.$analytics.trackEvent("Custom Report Saved");

            if (refillList) {
                this.fillQueriesList(id);

                if (copy) {
                    this.querySelected(id);
                }
            }
        }, (err) => {
            if (err && err.message) {
                this.$message.error(err.message);
            }
        });
    }

    settingsChanged = (settings) => {
        let { query, reportQuery } = this.state;

        query = { ...query, settings };
        reportQuery = { ...reportQuery, settings };

        this.setState({ query, reportQuery, hasUnsavedChanges: true });
    }

    render() {
        const { reportId, query, reportQuery, reportsList, showSaveDialog, hasUnsavedChanges } = this.state;

        return (
            <div className="custom-report">
                <QueryEditor
                    reportId={reportId}
                    query={query}
                    reportsList={reportsList}
                    onChange={this.queryChanged}
                    querySelected={this.querySelected}
                    deleteQuery={this.deleteQuery}
                    viewReport={this.viewReport}
                    showSaveDialog={this.showSaveDialog}
                    saveAs={this.saveAs}
                    allowSave={hasUnsavedChanges}
                    initModel={this.initModel}
                />
                {reportQuery && <ReportViewer
                    isGadget={false}
                    query={reportQuery}
                    settingsChanged={this.settingsChanged}
                />}
                {showSaveDialog && <SaveReportDialog queryName={query.queryName} allowCopy={query.id > 0}
                    onHide={this.hideSaveDialog} onChange={this.saveQuery} />}
            </div>
        );
    }
}

export default CustomReport;