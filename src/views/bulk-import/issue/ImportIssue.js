import React, { PureComponent } from 'react';
import BaseImport from '../BaseImport';
import { ScrollableTable, THead, TRow, TBody, Column, NoDataRow } from '../../../components/ScrollableTable';
import { Checkbox, Button } from '../../../controls';
import { inject } from '../../../services/injector-service';
import "./ImportIssue.scss";

const fieldTicketNo = "issuekey";
const parentKey = "parent";
const fieldProject = "project";
const fieldIssueType = "issuetype";
const fieldAssignee = "assignee";
const fieldReporter = "reporter";
const originalEstimate = "timetracking.originalEstimate";
const remainingEstimate = "timetracking.remainingEstimate";

const fieldMapping = {
    issuekey: fieldTicketNo,
    ticketno: fieldTicketNo,
    ticket: fieldTicketNo,
    issue: fieldTicketNo,
    key: fieldTicketNo,
    id: fieldTicketNo,

    project: fieldProject,
    projectkey: fieldProject,

    parent: parentKey,
    parentkey: parentKey,
    parentticket: parentKey,
    parentissue: parentKey,

    status: "status",
    issuestatus: "status",

    summary: "summary",
    priority: "priority",
    resolution: "resolution",
    description: "description",

    estimate: originalEstimate,
    originalestimate: originalEstimate,
    remaining: remainingEstimate,
    remainingestimate: remainingEstimate,

    assignee: fieldAssignee,
    assignto: fieldAssignee,
    assignedto: fieldAssignee,

    reporter: fieldReporter,
    reported: fieldReporter,
    reportedby: fieldReporter,

    issuetype: fieldIssueType,
    type: fieldIssueType
};

class ImportIssue extends BaseImport {
    constructor(props) {
        super(props, "Issue", "fa fa-ticket");
        inject(this, "JiraService", "TicketService", "MessageService");

        this.metadata = {};
        this.state = { importFields: [], ticketDetails: {} };
    }

    UNSAFE_componentWillMount() {
        this.$jira.getCustomFields().then(fields => this.customFields = fields);
    }

    transformHeader = (c) => {
        c = c.replace(/ /g, '').toLowerCase();
        let fieldName = fieldMapping[c] || null;

        if (!fieldName) {
            const field = this.customFields.first(cf =>
                cf.id.toLowerCase() === c // Match with field id
                || cf.name.replace(/ /g, '').toLowerCase() === c // Try match with name field
                || (cf.clauseNames && cf.clauseNames.some(cn => cn.replace(/ /g, '').toLowerCase() === c)) // Try find in clause names
            );

            if (field) {
                fieldName = field.id;
            }
        }

        return fieldName || c;
    }

    processData(data) {
        this.$ticket.processIssuesForImport(data).then(details => {
            const { importData } = details;

            if (importData) {
                importData.forEach(t => {
                    t.disabled = t.hasError;
                    t.selected = !t.disabled;
                });
            }

            this.setState({ ...details, selectedCount: this.getSelectedCount(importData) });
        });
    }

    toggleAllRows = () => {
        let { importData, selectAll } = this.state;
        selectAll = !selectAll;

        importData = importData.map(t => {
            t = { ...t };
            t.selected = !t.disabled && selectAll;
            return t;
        });

        this.setState({ importData, selectAll, selectedCount: this.getSelectedCount(importData) });
    }

    toggleSelection = (row, i) => {
        row = { ...row };
        row.selected = !row.disabled && !row.selected;

        let { importData } = this.state;
        importData = [...importData];
        importData[i] = row;

        this.setState({ selectAll: true, importData, selectedCount: this.getSelectedCount(importData) });
    }

    getSelectedCount = (importData) => importData.filter(t => t.selected).length

    importIssues = () => {
        let { importData } = this.state;

        const selectedRowsIndex = importData.findIndex(t => t.selected);
        const selectedRows = selectedRowsIndex.map(i => importData[i]);

        this.setState({ isLoading: true, uploading: true });

        this.$ticket.importIssues(selectedRows).then(result => {
            importData = [...importData];

            selectedRowsIndex.forEach((arrayIndex, loopIndex) => {
                importData[arrayIndex] = result[loopIndex];
            });

            this.setState({ isLoading: false, uploading: false, importData });
        }, (error) => {
            this.$message.error(error, "Import failed");
            this.setState({ isLoading: false, uploading: false });
        });

    }

    renderFooter() {
        const {
            state: { isLoading, selectedCount }
        } = this;

        const importLabel = `Import ${selectedCount || ''} Issues`;

        return <div className="pnl-footer">
            <div className="pull-right">
                <Button type="info" icon="fa fa-list" label="Clear" disabled={isLoading} onClick={this.clearImportData} />
                <Button type="success" icon="fa fa-upload" disabled={isLoading || !(selectedCount > 0)}
                    label={importLabel} onClick={this.importIssues} />
            </div>
        </div>;
    }

    render() {
        const { importData, importFields, ticketDetails, selectAll } = this.state;

        return super.renderBase(
            <div className="import-issue">
                <ScrollableTable dataset={importData} className="issue-table">
                    <THead>
                        <TRow>
                            <Column>#</Column>
                            <Column><Checkbox checked={selectAll} onChange={this.toggleAllRows} /></Column>
                            <Column sortBy="issuekey">Ticket No</Column>
                            {importFields.map((f, i) => <Column key={i}>{f.name}</Column>)}
                            <Column sortBy="status">Status</Column>
                        </TRow>
                    </THead>
                    <TBody>
                        {(row, i) => <IssueRow key={i} index={i} row={row} ticketDetails={ticketDetails} importFields={importFields}
                            toggleSelection={this.toggleSelection} getTicketLink={this.getTicketLink} />}
                    </TBody>
                    <NoDataRow span={12}>
                        Upload the list of issues by clicking the ( <span className="fa fa-upload" /> ) icon in top right corner.
                        Click <span className="link" onClick={this.downloadTemplate}>here</span> to download a sample template.
                    </NoDataRow>
                </ScrollableTable>
            </div>
        );
    }
}

export default ImportIssue;

class IssueRow extends PureComponent {

    toggleSelection = () => {
        const { row, index } = this.props;
        this.props.toggleSelection(row, index);
    }

    render() {
        const { row, ticketDetails, importFields, index } = this.props;
        const { raw, options, fields, hasError, disabled, selected, statusErrors } = row;
        const rawTicket = ticketDetails[row.issuekey] || null;

        return (
            <tr className={row.error ? "row-error" : ""}>
                <td className={hasError ? "error-row" : "valid-row"}>{index + 1}</td>
                <td><Checkbox checked={selected} disabled={disabled} onChange={this.toggleSelection} /></td>
                <IssueKeyField rawTicket={rawTicket} issuekey={raw["issuekey"]} option={options["issuekey"]} />
                {importFields.map((f, i) => {
                    const fieldName = f.key;

                    const value = raw[fieldName];
                    const option = options[fieldName];
                    const field = fields[fieldName];

                    return <IssueField key={i} index={i} row={row} field={f} value={value} option={option} metadata={field} />;
                })}
                <td title="One or more errors exists">{hasError && <span title={statusErrors} className="fa fa-exclamation-triangle msg-error" />} {row.status}</td>
            </tr>
        );
    }
}

function getFieldStatusIcon(errors, warnings) {
    const hasErrors = errors && errors.length > 0;
    const hasWarnings = warnings && warnings.length > 0;

    if (hasErrors || hasWarnings) {
        return <span title={hasErrors ? errors : warnings} className={`fa fa-exclamation-triangle ${hasErrors ? "msg-error" : "msg-warning"}`} />;
    }
}

class IssueKeyField extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService");
    }

    render() {
        const { issuekey, option, rawTicket } = this.props;
        const { errors, warnings } = option || {};

        const icon = getFieldStatusIcon(errors, warnings);

        if (rawTicket) { return <td>{this.props.getTicketLink(issuekey)} {icon}</td>; }
        else { return <td>{issuekey} {icon}</td>; }
    }
}

class IssueField extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService");
    }

    render() {
        const { option } = this.props;
        const { errors, warnings, displayValue } = option || {};

        return <td>{displayValue} {getFieldStatusIcon(errors, warnings)}</td>;
    }
}
