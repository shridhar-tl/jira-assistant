import React, { PureComponent } from 'react';
import BaseImport from '../BaseImport';
import { ScrollableTable, THead, TRow, TBody, Column, NoDataRow } from '../../../components/ScrollableTable';
import { Checkbox } from '../../../controls';
import { inject } from '../../../services/injector-service';
import { noRowMessage } from './helpers';
import "./ImportIssue.scss";
import Footer from './Footer';
import { transformHeader } from './field-mapping';

class ImportIssue extends BaseImport {
    constructor(props) {
        super(props, "Issue", "fa fa-ticket");
        inject(this, "JiraService", "TicketService", "MessageService");

        this.metadata = {};
        this.state = { importData: [], importFields: [], ticketDetails: {} };
    }

    UNSAFE_componentWillMount() {
        this.$jira.getCustomFields().then(fields => {
            this.customFields = fields;
            this.transformHeader = transformHeader(fields);
        });
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
    };

    toggleSelection = (row, i) => {
        row = { ...row };
        row.selected = !row.disabled && !row.selected;

        let { importData } = this.state;
        importData = [...importData];
        importData[i] = row;

        this.setState({ selectAll: true, importData, selectedCount: this.getSelectedCount(importData) });
    };

    getSelectedCount = (importData) => importData.filter(t => t.selected).length;

    importIssues = () => {
        let { importData } = this.state;

        const selectedRowsIndex = importData.findAllIndex(t => t.selected);
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
    };


    clearImportData = () => {
        this.setState({ importFields: [], ticketDetails: {}, importData: null, selectedCount: null });
    };

    renderFooter() {
        const { isLoading, selectedCount } = this.state;

        return (<Footer isLoading={isLoading} selectedCount={selectedCount}
            clearImportData={this.clearImportData} importIssues={this.importIssues} />);
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
                            <Column>Ticket No</Column>
                            {importFields.map((f, i) => <Column key={i}>{f.name}</Column>)}
                            <Column sortBy="status">Status</Column>
                        </TRow>
                    </THead>
                    <TBody>
                        {(row, i) => <IssueRow key={i} index={i} row={row} ticketDetails={ticketDetails} importFields={importFields}
                            toggleSelection={this.toggleSelection} getTicketLink={this.getTicketLink} />}
                    </TBody>
                    <NoDataRow span={12}>
                        {noRowMessage}
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
    };

    render() {
        const { row, ticketDetails, importFields, index } = this.props;
        const { raw, options, fields, hasError, disabled, selected, statusErrors } = row;
        const rawTicket = ticketDetails[raw.issuekey] || null;

        return (
            <tr className={row.error ? "row-error" : ""}>
                <td className={hasError ? "error-row" : "valid-row"}>{index + 1}</td>
                <td><Checkbox checked={selected} disabled={disabled} onChange={this.toggleSelection} /></td>
                <IssueKeyField rawTicket={rawTicket} issuekey={raw["issuekey"]} option={options["issuekey"]} getTicketLink={this.props.getTicketLink} />
                {importFields.map((f, i) => {
                    const fieldName = f.key;

                    const value = raw[fieldName];
                    const option = options[fieldName];
                    const field = fields[fieldName];

                    return <IssueField key={i} index={i} row={row} field={f} value={value} option={option} metadata={field} rawTicket={rawTicket} />;
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
        const className = `fa fa-exclamation-triangle ${hasErrors ? "msg-error" : "msg-warning"}`;
        return <span title={hasErrors ? errors : warnings} className={className} />;
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
        const { option, rawTicket, field: { key } = {} } = this.props;
        const { fields } = rawTicket || {};
        const { errors, warnings } = option || {};
        let { displayValue } = option || {};

        if (!displayValue && fields && key) {
            const value = fields[key];
            if (value && typeof value === "object") {
                displayValue = value.name || value.key || value.id;
            }
            else if (value) {
                displayValue = value;
            }
        }

        return <td>{displayValue} {getFieldStatusIcon(errors, warnings)}</td>;
    }
}
