import React, { PureComponent } from 'react';
import GroupableGrid from '../../components/GroupableGrid/GroupableGrid';

const estimateFieldsToBeHidden = ["-originalestimate", "-totalLogged", "-remainingestimate", "-estVariance"];

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
        const { formatDateTime, convertSecs } = props;

        //displayFormat: null, sortValueFun: null, groupValueFunc: null
        //, allowSorting: true, allowGrouping: true

        return [
            { field: "groupName", displayText: "Group Name", type: "string" },
            { field: "projectName", displayText: "Project Name", type: "string" },
            { field: "issueType", displayText: "Issue Type", type: "string" },
            { field: "epicDisplay", displayText: "Epic", type: "string", format: (text, row) => this.formatTicket(text, row.epicUrl) },
            { field: "parent", displayText: "Parent", type: "string", format: (text, row) => this.formatTicket(text, row.parentUrl) },
            { field: "ticketNo", displayText: "Ticket No", type: "string", format: (text, row) => this.formatTicket(text, row.ticketUrl) },
            { field: "statusName", displayText: "Status", type: "string" },
            { field: "summary", displayText: "Summary", type: "string" },
            { field: "logTime", displayText: "Log Date & Time", type: "datetime", format: formatDateTime },
            { field: "userDisplay", displayText: "Log user", type: "string" },
            { field: "assignee", displayText: "Assignee", type: "string" },
            { field: "reporter", displayText: "Reporter", type: "string" },
            { field: "timeSpent", displayText: "Hr. Spent", type: "number", format: convertSecs },
            { field: "originalestimate", displayText: "Ori. Estm.", type: "number", format: convertSecs },
            { field: "totalLogged", displayText: "Total Worklogs", type: "number", format: convertSecs },
            { field: "remainingestimate", displayText: "Rem. Estm.", type: "number", format: convertSecs },
            { field: "estVariance", displayText: "Estm. Variance", type: "number", format: (value) => (value > 0 ? "+" : "") + convertSecs(value) },
            { field: "comment", displayText: "Comment" },
        ];
    }

    formatTicket(text, url) {
        return text && <a href={url} className="link" target="_blank" rel="noopener noreferrer">{text}</a>;
    }

    settingsChanged = (grpconfig, event) => {
        this.props.onChange(grpconfig, event);
    };

    render() {
        const {
            props: {
                flatData,
                pageSettings: {
                    hideEstimate,
                    flatTableSettings: {
                        groupBy, groupFoldable, displayColumns, sortField, isDesc
                    } = { displayColumns: hideEstimate ? estimateFieldsToBeHidden : null }
                } = {}
            },
            state: { columns } } = this;

        return (<GroupableGrid className="flat-data-grid" dataset={flatData} exportSheetName="Flat Worklogs"
            columns={columns} allowSorting={true} onChange={this.settingsChanged}
            displayColumns={displayColumns} groupBy={groupBy} groupFoldable={groupFoldable} sortField={sortField} isDesc={isDesc}
            noRowsMessage="No worklog details available"
        />);
    }
}

export default FlatDataGrid;