import React, { PureComponent } from 'react';
import { inject } from '../../../services/injector-service';
import QueryEditor from './QueryEditor';
import SaveReportDialog from '../../../dialogs/SaveReportDialog';
import Dialog from '../../../dialogs';
import ReportViewer from './ReportViewer';
import './Common.scss';
import { EventCategory, UUID } from '../../../_constants';

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

        const queryFromDB = await this.$report.getReportDefinition(reportId);
        const query = await this.convertFromOldReport(queryFromDB);

        this.reportConverted = queryFromDB !== query;

        this.setState({
            reportId, query, renderReport: false,
            hasUnsavedChanges: this.reportConverted
        });
    };

    async convertFromOldReport(query) {
        if (Array.isArray(query?.fields)) {
            return query;
        }

        const msg = (<>
            Making changes and saving the report from here will upgrade the existing report definition.<br /><br />
            You will not be able to use it with old report once you save changes from here.<br /><br />
            <b>Note:</b> Only once you click on "Save Query" button, conversion will happen.
            Untill then you can safely preview the report without converting it.
        </>);

        await new Promise((result) => Dialog.alert(msg, "Convert report", null, { waitFor: 5 }).then(result));

        const { filterFields, outputFields, ...newQuery } = query;

        const groupBy = [];
        newQuery.settings = { groupBy };

        const functionMapper = {
            'formatSecs?1': 'sum',
            'sum?0': 'sum',
            'sum?1': 'sum',
            'avg?0': 'avg',
            'avg?1': 'avg',
            'count?0': 'count',
            'count?2': 'count',
            'formatUser?1': 'name',
            'formatUser?2': 'email',
            'formatUser?4': 'both'
        };

        newQuery.fields = outputFields.map(f => {
            const { functions, groupBy: grp, id, ...newField } = f;

            newField.id = UUID.generate();
            newField.field = id;

            const fId = functions?.id;

            if (grp || fId === 'sum?1' || fId === 'avg?1' || fId === 'count?2') {
                const settings = { showGroupCount: true };

                if (fId) {
                    const type = newField.type;
                    const funcValue = functionMapper[fId];

                    if (funcValue) {
                        if (type === 'number' || type === 'seconds') {
                            settings.funcType = funcValue;
                        }
                        else if (type === 'user' && fId.startsWith('formatUser')) {
                            settings.valueType = funcValue;
                        }
                    }
                }

                groupBy.push({ ...newField, settings });
            }

            return newField;
        });

        return newQuery;
    }

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
            this.$analytics.trackEvent(`${this.reportConverted ? 'Old: ' : ''}Custom Report Preview`,
                EventCategory.UserActions);
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
            if (this.reportConverted) {
                this.reportConverted = false;
                this.$analytics.trackEvent("Custom Report migrated");
            } else {
                this.$analytics.trackEvent("Custom Report Saved");
            }

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