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

        this.state = {
            reportId,
            query: {
                jql: '',
                fields: []
            }
        };

        this.loadReport(reportId);
    }

    loadReport = async (reportId) => {
        const result = await this.$report.getReportsList();

        const reportsList = result
            .filter(q => q.isNew)
            .map(q => ({ value: q.id, label: q.queryName }));

        if (!reportId) {
            this.setState({ reportsList });
            return;
        }

        const query = await this.$report.getReportDefinition(reportId);

        this.setState({ reportsList, query });
    }

    querySelected = (reportId) => {
        let { history, match: { path } } = this.props;

        if (path.indexOf(':reportId') >= 0) {
            path = path.replace(':reportId', reportId);
        }
        else {
            path = `${path}/${reportId}`;
        }

        history.push(path);
    }

    queryChanged = (query) => this.setState({ query });

    deleteQuery = () => {
        const { reportId, query: { queryName } } = this.state;

        Dialog.confirmDelete(`Are you sure to delete the report named "${queryName}" permenantly?`)
            .then(() => {
                this.$report.deleteSavedQuery(reportId).then(q => {
                    this.$message.success('Report deleted successfully!');
                    this.setState({ reportId: null });
                    this.initModel();
                    this.fillQueriesList();
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

            this.setState({ showSaveDialog: false, reportId: id, query });

            if (refillList) {
                this.fillQueriesList();
            }

            //this.props.onSave(query);

            this.$message.success("Report saved successfully!");
            this.$analytics.trackEvent("Custom Report Saved");
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

        this.setState({ query, reportQuery });
    }

    render() {
        const { reportId, query, reportQuery, reportsList, showSaveDialog } = this.state;

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