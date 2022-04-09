import React from 'react';
import GroupableGrid from '../../../components/GroupableGrid/GroupableGrid';
import { Button } from '../../../controls';
import BaseGadget from '../../../gadgets/BaseGadget';
import { inject } from '../../../services/injector-service';
import { loadReportData } from './actions';

class ReportViewer extends BaseGadget {
    constructor(props) {
        const { query } = props;
        super(props, query?.queryName || 'Custom report viewer', 'fa-clock-o');
        inject(this, 'AnalyticsService', 'ReportService', 'JiraService', 'UtilsService', 'UserUtilsService');
        this.state.isLoading = true;
        this.state.hideGroups = this.isGadget;
    }

    componentDidMount() {
        this.initWithProps(this.props);
    }

    renderCustomActions(isGadget) {
        if (isGadget) {
            return (<Button type="success" title="Click to toggle group options"
                icon={this.state.hideGroups ? 'fa fa-toggle-off' : 'fa fa-toggle-on'}
                onClick={this.toggleGroupOptions} />);
        } else {
            return (<Button type="success" label="Edit" title="Click to edit the report"
                icon="fa fa-edit" onClick={this.props.onEditClicked} />);
        }
    }

    toggleGroupOptions = () => this.setState({ hideGroups: !this.state.hideGroups });

    UNSAFE_componentWillReceiveProps(props) {
        super.UNSAFE_componentWillReceiveProps(props);
        this.initWithProps(props);
    }

    initWithProps(props) {
        const { query, reportId } = props;

        if (reportId) {
            if (this.reportId !== reportId) {
                this.reportId = reportId;
                this.loadReportDefinition(reportId);
            }
        }
        else if (query) {
            if (this.query !== query) {
                this.query = query;
                this.loadReportData(query);
            }
        }
    }

    async loadReportDefinition(reportId) {
        const query = await this.$report.getReportDefinition(reportId);
        this.title = query?.queryName || 'Custom report viewer';
        this.setState({ query });
        this.loadReportData(query);
    }

    loadReportData(query) {
        this.settings = { ...query.settings, ...this.settings };

        if (this.jql !== query.jql || this.fields !== query.fields) {
            this.jql = query.jql;
            this.fields = query.fields;
            this.loadData(query);
        }
    }

    refreshData = () => this.loadData(this.props.query || this.state.query);
    loadData = async (query) => {
        this.setState({ isLoading: true, hasError: false });
        try {
            this.setState(await loadReportData(query));
        } catch (err) {
            this.setState({ isLoading: false, hasError: true });
        }
    };

    tableSettingsChanged = (settings) => {
        this.settings = { ...this.settings, ...settings };

        if (this.isGadget) {
            this.saveSettings();
            this.setState({ settings });
        }
        else {
            this.props.settingsChanged(settings);
        }
    };

    render() {
        const { query: queryFromProps } = this.props;

        // When the report is loaded as gadget, it would have report definition in state
        const { query = queryFromProps } = this.state;

        const {
            loading,
            reportData,
            columnList,
            settings,
            hasError,
            hideGroups
        } = this.state;

        const {
            displayColumns,
            groupBy,
            groupFoldable,
            sortField,
            isDesc
        } = this.settings || settings || {};

        if (hasError) {
            return super.renderBase(<div className="error-block">Unable to load this report due to an error.</div>);
        }

        if (loading || !reportData) {
            return super.renderBase();
        }

        return super.renderBase(
            <GroupableGrid dataset={reportData}
                hideGroups={hideGroups}
                exportSheetName={query.queryName}
                columns={columnList} allowSorting={true}
                onChange={this.tableSettingsChanged}
                displayColumns={displayColumns} groupBy={groupBy}
                groupFoldable={groupFoldable} sortField={sortField} isDesc={isDesc}
                noRowsMessage="No ticket details available"
            />
        );
    }
}

export default ReportViewer;