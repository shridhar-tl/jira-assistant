import React from 'react';
import GroupableGrid from '../../../components/GroupableGrid/GroupableGrid';
import BaseGadget from '../../../gadgets/BaseGadget';
import { inject } from '../../../services/injector-service';
import { loadReportData } from './actions';

class ReportViewer extends BaseGadget {
    constructor(props) {
        const { query, reportId } = props;
        super(props, query?.queryName || 'Custom report viewer', 'fa-clock-o');
        inject(this, 'AnalyticsService', 'ReportService', 'JiraService', 'UtilsService', 'UserUtilsService');
        this.state.isLoading = true;

        if (reportId) {
            this.loadReportDefinition(reportId);
        }
        else if (query) {
            this.loadReportData(query);
        }
    }

    UNSAFE_componentWillReceiveProps(props) {
        super.UNSAFE_componentWillReceiveProps(props);
        this.loadReportData(props.query);
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
        this.setState({ isLoading: true });
        this.setState(await loadReportData(query));
    }

    tableSettingsChanged = (settings) => {
        this.settings = { ...this.settings, ...settings };
        if (this.isGadget) {
            this.saveSettings();
        }
        else {
            this.props.settingsChanged(settings);
        }
    }

    render() {
        const { query: queryFromProps } = this.props;

        // When the report is loaded as gadget, it would have report definition in state
        const { query = queryFromProps } = this.state;

        const {
            loading,
            reportData,
            columnList,
            settings
        } = this.state;

        const {
            displayColumns,
            groupBy,
            groupFoldable,
            sortField,
            isDesc
        } = this.settings || settings || {};

        if (loading || !reportData) {
            return super.renderBase();
        }

        return super.renderBase(
            <GroupableGrid dataset={reportData}
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