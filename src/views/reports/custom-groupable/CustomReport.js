import React, { PureComponent } from 'react';
import { inject } from '../../../services/injector-service';
import QueryEditor from './QueryEditor';
import SaveReportDialog from '../../../dialogs/SaveReportDialog';
import Dialog from '../../../dialogs';
import ReportViewer from './ReportViewer';
import { EventCategory } from '../../../constants/settings';
import './Common.scss';

class CustomReport extends PureComponent {
    constructor(props) {
        super();
        inject(this, "ReportService", "MessageService", "AnalyticsService");
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

        this.setState({ reportId, query, renderReport: false });
    };

    fillQueriesList = async (reportId) => {
        const result = await this.$report.getReportsList();

        const reportsList = result
            .filter(q => !q.advanced)
            .map(q => ({ value: q.id, label: q.queryName }));

        this.setState({ reportId, reportsList });
    };

    querySelected = (reportId) => {
        const { history } = this.props;
        let { match: { path } } = this.props;

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
    };

    queryChanged = (query) => this.setState({ query, hasUnsavedChanges: true });

    deleteQuery = () => {
        const { reportId, query: { queryName } } = this.state;

        Dialog.confirmDelete(`Are you sure to delete the report named "${queryName}" permanently?`)
            .then(() => {
                this.$report.deleteSavedQuery(reportId).then(q => {
                    this.$message.success('Report deleted successfully!');
                    this.$analytics.trackEvent("Custom Report Deleted");
                    this.querySelected('');
                });
            });
    };

    viewReport = () => {
        const { renderReport } = this.state;
        this.setState({ renderReport: !renderReport });

        if (!renderReport) {
            this.$analytics.trackEvent('Custom Report Preview', EventCategory.UserActions);
        }
    };

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
    };

    settingsChanged = (settings) => {
        let { query } = this.state;

        query = { ...query, settings };

        this.setState({ query, hasUnsavedChanges: true });
    };

    render() {
        const { reportId, query, renderReport, reportsList, showSaveDialog, hasUnsavedChanges } = this.state;

        return (
            <div className="custom-report">
                {!renderReport && <QueryEditor
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
                />}

                {renderReport && <ReportViewer
                    isGadget={false}
                    query={query}
                    settingsChanged={this.settingsChanged}
                    onEditClicked={this.viewReport}
                />}

                {showSaveDialog && <SaveReportDialog queryName={query.queryName} allowCopy={query.id > 0}
                    onHide={this.hideSaveDialog} onChange={this.saveQuery} />}
            </div>
        );
    }
}

export default CustomReport;