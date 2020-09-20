import React from 'react';
import GroupableGrid from '../../../components/GroupableGrid/GroupableGrid';
import BaseGadget from '../../../gadgets/BaseGadget';
import { inject } from '../../../services/injector-service';
import { loadReportData } from './actions';

class ReportViewer extends BaseGadget {
    constructor(props) {
        super(props, props.query?.queryName || 'Custom report viewer', 'fa-clock-o');
        inject(this, 'AnalyticsService', 'ReportService', 'JiraService', 'UtilsService', 'UserUtilsService');
        this.loadReportData(props.query);
    }

    async UNSAFE_componentWillReceiveProps(props) {
        super.UNSAFE_componentWillReceiveProps(props);
        this.loadReportData(props.query);
    }

    async loadReportData(query) {
        this.settings = { ...query.settings, ...this.settings };

        if (this.jql !== query.jql || this.fields !== query.fields) {
            this.jql = query.jql;
            this.fields = query.fields;
            this.setState(await loadReportData(query));
        }
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
        const { query } = this.props;
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

        return super.renderBase(
            <div>
                {!loading && reportData && <GroupableGrid dataset={reportData}
                    exportSheetName={query.queryName}
                    columns={columnList} allowSorting={true}
                    onChange={this.tableSettingsChanged}
                    displayColumns={displayColumns} groupBy={groupBy}
                    groupFoldable={groupFoldable} sortField={sortField} isDesc={isDesc}
                    noRowsMessage="No ticket details available"
                />}
            </div>
        );
    }
}

export default ReportViewer;