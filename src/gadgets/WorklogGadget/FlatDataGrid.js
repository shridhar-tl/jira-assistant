import React, { PureComponent } from 'react';
import GroupableGrid from '../../components/GroupableGrid/GroupableGrid';

class FlatDataGrid extends PureComponent {
    constructor(props) {
        super(props);
        this.setPropsInClass(props);
        this.state = this.getNewState(props);
        this.state.groupBy = [];
    }

    UNSAFE_componentWillReceiveProps(props) {
        this.updateData(props);
    }

    updateData(props) {
        if (this.data !== props.flatData || this.pageSettings !== props.pageSettings) {
            this.setPropsInClass(props);
            this.setState(this.getNewState(props));
        }
    }

    getNewState(props) {
        return {
            columns: this.getColumnSettings(props)
        };
    }

    setPropsInClass(props) {
        this.data = props.flatData;
        this.pageSettings = this.props.pageSettings;
    }

    getColumnSettings(props) {
        const { formatDateTime, convertSecs } = props; //ToDo: , pageSettings: { hideEstimate }

        //displayFormat: null, sortValueFun: null, groupValueFunc: null
        //, allowSorting: true, allowGrouping: true

        return [
            { field: "groupName", displayText: "Group Name" },
            { field: "projectName", displayText: "Project Name" },
            { field: "issueType", displayText: "Issue Type" },
            { field: "epicDisplay", displayText: "Epic", format: (text, row) => this.formatTicket(text, row.epicUrl) },
            { field: "parent", displayText: "Parent", format: (text, row) => this.formatTicket(text, row.parentUrl) },
            { field: "ticketNo", displayText: "Ticket No", format: (text, row) => this.formatTicket(text, row.ticketUrl) },
            { field: "statusName", displayText: "Status" },
            { field: "summary", displayText: "Summary" },
            { field: "logTime", displayText: "Log Date & Time", format: formatDateTime },
            { field: "userDisplay", displayText: "User" },
            { field: "timeSpent", displayText: "Hr. Spent", format: convertSecs },
            { field: "originalestimate", displayText: "Ori. Estm.", format: convertSecs },
            { field: "totalLogged", displayText: "Total Worklogs", format: convertSecs },
            { field: "remainingestimate", displayText: "Rem. Estm.", format: convertSecs },
            { field: "estVariance", displayText: "Estm. Variance", format: (value) => (value > 0 ? "+" : "") + convertSecs(value) },
            { field: "comment", displayText: "Comment" },
        ];
    }

    formatTicket(text, url) {
        return text && <a href={url} className="link" target="_blank" rel="noopener noreferrer">{text}</a>;
    }

    settingsChanged = (grpconfig, event) => {
        this.props.onChange(grpconfig, event);
    }

    render() {
        const {
            props: {
                flatData,
                pageSettings: {
                    flatTableSettings: {
                        groupBy, groupFoldable, displayColumns, sortField, isDesc
                    } = {}
                } = {}
            },
            state: { columns } } = this;

        return (<GroupableGrid dataset={flatData} exportSheetName="Flat Worklogs"
            columns={columns} allowSorting={true} onChange={this.settingsChanged}
            displayColumns={displayColumns} groupBy={groupBy} groupFoldable={groupFoldable} sortField={sortField} isDesc={isDesc}
            noRowsMessage="No worklog details available"
        />);
    }
}

export default FlatDataGrid;