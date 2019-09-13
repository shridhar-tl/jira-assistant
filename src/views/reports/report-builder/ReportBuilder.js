import React from 'react';
import { inject } from '../../../services';
import { ReportBuilder as JSReportBuilder } from 'jsd-report';
import BaseGadget from '../../../gadgets/BaseGadget';
import ReportViewer from './ReportViewer';
import { Button, SelectBox } from '../../../controls';
import "./ReportBuilder.scss";
import SaveReportDialog from '../../../dialogs/SaveReportDialog';
import JQLEditorDialog from './JQLEditorDialog';
import Dialog from '../../../dialogs';

class ReportBuilder extends BaseGadget {
    constructor(props) {
        super(props, "Report Builder");
        inject(this, "JiraService", "MessageService", "ReportService", "ReportConfigService");
        this.isGadget = false;
        this.hideRefresh = true;
        this.hideMenu = true;

        this.$reportConfig.configureBuilder();
        this.$reportConfig.parameters.removeAllListeners();
        this.$reportConfig.datasets.on("resolveSchema_JQL", this.resolveSchema_JQL.bind(this));
        this.state = { reportDefinition: this.getEmptyDefinition() };
    }

    setReportDefinition = (definition, update) => {
        this.setState({ reportDefinition: definition, selQueryId: definition.id });
    }

    getApi = api => (this.builderAPI = api)

    UNSAFE_componentWillMount() {
        const { match: { params } } = this.props;

        const queryId = parseInt(params['queryId'] || 0) || null;
        if (queryId) {
            this.queryChanged(queryId);
        }
        this.fillQueriesList();
    }

    resolveSchema_JQL(e) {
        this.resolveJQLEvent = e;
        this.filterQuery = e.props;
        this.setState({ selectedDatasetType: "JQL" });
    }

    saveDataset_JQL = (query, data) => {
        if (!query) {
            this.setState({ selectedDatasetType: null });
            this.resolveJQLEvent.schema.reject(false);
            this.resolveJQLEvent.data.reject(false);
            return;
        }

        const processedData = this.$reportConfig.processSearchData(data);
        this.resolveJQLEvent.schema.resolve(query);
        this.resolveJQLEvent.data.resolve(processedData);
        this.resolveJQLEvent = null;

        this.setState({ selectedDatasetType: null });
    }

    fillQueriesList() {
        return this.$report.getReportsList().then((result) => {
            const queryList = result.filter(q => q.advanced).map(q => { return { value: q.id, label: q.queryName }; });
            this.setState({ queryList });
        });
    }

    initModel = () => {
        this.filterQuery = {};
        this.setReportDefinition(this.getEmptyDefinition());
    }

    getEmptyDefinition() {
        return {
            datasets: {},
            reportItems: []
        };
    }

    queryChanged = (selQueryId) => {
        return this.$report.getReportDefinition(selQueryId)
            .then(this.setReportDefinition);
    }

    deleteQuery = () => {
        Dialog.confirmDelete(`Are you sure to delete the report named "${this.state.reportDefinition.queryName}" permenantly?`)
            .then(() => {
                this.$report.deleteSavedQuery(this.state.selQueryId).then(q => {
                    this.$message.success('Report deleted successfully!');
                    this.setState({ selQueryId: null });
                    this.initModel();
                    this.fillQueriesList();
                });
            });
    }

    saveQuery = (queryName, copy) => {
        const reportDefinition = { ...this.state.reportDefinition, ...this.builderAPI.getReportDefinition(), advanced: true };

        const oldQryName = reportDefinition.queryName;
        let refillList = false;

        reportDefinition.queryName = queryName;
        if (copy) {
            delete reportDefinition.id;
            refillList = true;
        }
        else if (oldQryName !== queryName) {
            refillList = true;
        }

        this.$report.saveQuery(reportDefinition).then((result) => {
            reportDefinition.id = result;
            this.setState({ showSaveDialog: false, selQueryId: reportDefinition.id });
            this.setReportDefinition(reportDefinition);
            if (refillList) {
                this.fillQueriesList();
            }
            this.$message.success("Query saved successfully!");
            //this.$analytics.trackEvent("Query Saved");
        }, (err) => {
            if (err && err.message) {
                this.$message.error(err.message);
            }
        });
    }

    viewReport = () => {
        this.setReportDefinition(this.builderAPI.getReportDefinition());
        this.setState({ reportMode: true });
    }

    viewBuilder = () => this.setState({ reportMode: false })

    showSaveDialog = () => this.setState({ showSaveDialog: true })
    saveAs = () => this.saveQuery(this.state.reportDefinition.queryName)
    hideSaveDialog = () => this.setState({ showSaveDialog: false })

    renderCustomActions() {
        const { queryList, selQueryId } = this.state;

        if (!queryList || !queryList.length) { return null; }

        return <>
            <SelectBox dataset={queryList} value={selQueryId} placeholder="Select a query to edit" onChange={this.queryChanged} />
            <Button icon="fa fa-plus" onClick={this.initModel} label="New query" />
        </>;
    }

    renderFooter() {
        const {
            state: { reportDefinition }
        } = this;

        const isEditing = reportDefinition.id > 0;

        return <div className="pnl-footer">
            {isEditing && <div className="pull-left">
                <Button icon="fa fa-trash" label="Delete Query" type="danger" onClick={this.deleteQuery} />
                <Button icon="fa fa-floppy-o" label="Save Query As" type="success" onClick={this.showSaveDialog} />
            </div>}

            <div className="pull-right">
                <Button type="success" icon="fa fa-floppy-o" label="Save Query" onClick={isEditing ? this.saveAs : this.showSaveDialog} />
                <Button type="info" icon="fa fa-list" label="View Report" onClick={this.viewReport} disabled={!((reportDefinition || {}).reportItems || []).length} />
            </div>
        </div>;
    }

    hideDatasetPopup = () => this.setState({ selectedDatasetType: null })

    render() {
        const {
            state: { reportDefinition, reportMode, showSaveDialog, selectedDatasetType }
        } = this;

        const isEditing = reportDefinition.id > 0;

        if (reportMode) {
            return <ReportViewer isGadget={false} definition={reportDefinition} onCancelView={this.viewBuilder} />;
        }
        else {
            return super.renderBase(<>
                {reportDefinition && <JSReportBuilder api={this.getApi} definition={reportDefinition} />}
                {showSaveDialog && <SaveReportDialog queryName={reportDefinition.queryName} allowCopy={isEditing}
                    onHide={this.hideSaveDialog} onChange={this.saveQuery} />}
                {selectedDatasetType === 'JQL' && <JQLEditorDialog onHide={this.hideDatasetPopup} onResolve={this.saveDataset_JQL} />}
            </>
            );
        }
    }
}

export default ReportBuilder;