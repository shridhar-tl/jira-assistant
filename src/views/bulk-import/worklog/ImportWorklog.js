import React from 'react';
import { ScrollableTable, THead, TRow, TBody, Column, NoDataRow } from '../../../components/ScrollableTable';
import BaseImport from '../BaseImport';
import { inject } from '../../../services/injector-service';
import { Button, Checkbox } from '../../../controls';
import "./ImportWorklog.scss";
import { parseTimespent, exportCsv } from '../../../common/utils';
//import { EditableGrid, THead, TBody, Column } from '../../../components/EditableGrid/EditableGrid';

const wlStatus_WillImport = "Will Import";
const wlStatus_Invalid = "Invalid";
const wlStatus_Error = "Error";
const wlStatus_Excluded = "Excluded";

const fieldTicketNo = "ticketNo";
const fieldStartDate = "startDate";
const fieldTimeSpent = "timespent";
const fieldComment = "comment";

const fieldMapping = {
    ticketno: fieldTicketNo,
    ticket: fieldTicketNo,
    issuekey: fieldTicketNo,
    issue: fieldTicketNo,
    key: fieldTicketNo,
    id: fieldTicketNo,

    startdate: fieldStartDate,
    started: fieldStartDate,
    logdate: fieldStartDate,
    loggeddate: fieldStartDate,
    worklogdate: fieldStartDate,
    date: fieldStartDate,

    timespent: fieldTimeSpent,
    timespentseconds: fieldTimeSpent,
    seconds: fieldTimeSpent,
    hoursspent: fieldTimeSpent,
    time: fieldTimeSpent,
    spent: fieldTimeSpent,

    comment: fieldComment,
    comments: fieldComment,
    description: fieldComment,
    details: fieldComment
};

class ImportWorklog extends BaseImport {
    constructor(props) {
        super(props, "Worklog", "fa fa-clock-o");
        inject(this, "UtilsService", "UserUtilsService", "TicketService", "QueueService", "WorklogService", "SessionService", "MessageService");

        this.maxHrsToLog = this.$session.CurrentUser.maxHours;
        const autoUpload = this.$session.CurrentUser.autoUpload || false;

        this.state = { autoUpload, ticketSummary: {}, selectedCount: '' };
        this.$q.on("completed", () => {
            this.$message.info("Worklog upload completed");
            this.setState({ isLoading: false, selectedCount: '' });
        });
    }

    transformHeader = (c) => fieldMapping[c.replace(/ /g, '').toLowerCase()] || null;

    processData(data) {
        const worklogData = data.map(w => {
            let { ticketNo = "", startDate = "", timespent = "", comment = "" } = w;

            ticketNo = ticketNo.trim();
            startDate = startDate.trim();
            timespent = timespent.trim();
            comment = comment.trim();

            let selected = true, disabled = false, status = wlStatus_WillImport, error = "";

            const setError = (errorText) => {
                selected = false;
                disabled = true;
                status = wlStatus_Invalid;
                if (error) {
                    error += `;${errorText}`;
                } else {
                    error = errorText;
                }
            };

            if (!ticketNo) {
                setError("Ticket No is required");
            }

            if (!startDate) {
                setError("Log Date is required");
            }
            else {
                const _startDate = this.$utils.convertDate(startDate);

                if (_startDate instanceof Date) {
                    startDate = _startDate;
                }
                else {
                    setError("Log Date is invalid");
                }
            }

            if (!timespent) {
                setError("Timespent is required");
            }
            else {
                const _timeSpent = parseTimespent(timespent);

                if (_timeSpent > 0) {
                    timespent = _timeSpent;
                }
                else {
                    setError("Timespent is invalid");
                }
            }

            return {
                selected,
                disabled,
                status,
                error,
                ticketNo,
                startDate,
                timespent,
                comment
            };
        });

        const selectedWorklogs = this.getSelectedLogs(worklogData);
        const ticketList = selectedWorklogs.map(w => w.ticketNo).distinct();

        this.$ticket.getTicketDetails(ticketList, true).then(list => {
            const ticketSummary = list.reduce((obj, t) => {
                const { key, fields: { summary, assignee: { displayName } = {}, issuetype: { iconUrl, name } = {} } } = t;

                obj[key] = {
                    summary,
                    assignee: displayName,
                    issueTypeIcon: iconUrl,
                    issueType: name
                };

                return obj;
            }, {});
            this.setState({ ticketSummary });
        });

        const ticketSummary = ticketList.reduce((obj, t) => {
            obj[t] = { summary: "Loading..." };

            return obj;
        }, {});

        this.setState({ worklogData, ticketSummary, selectAll: true, selectedCount: selectedWorklogs.length || "" });
    }

    importWorklogs = () => {
        const { autoUpload, worklogData } = this.state;
        const selectedWorklogs = worklogData.filter(w => w.selected);

        if (autoUpload) {
            this.uploadSelectedWorklogs(selectedWorklogs);
        } else {
            const savedWorklogs = selectedWorklogs.map(wl => {
                wl.selected = false;
                wl.disabled = true;

                const { ticketNo, startDate, timespent, comment } = wl;
                let ts = (timespent / 60 / 60);

                if (ts > this.maxHrsToLog) {
                    wl.status = wlStatus_Error;
                    wl.error = `Timespent cannot be more than ${this.maxHrsToLog.toFixed(2)} hours per day.`;
                    return null;
                }

                ts = ts.toString().split(".");

                ts[0] = parseInt(ts[0]) || 0;
                ts[1] = parseInt(60 * (parseInt(ts[1]) || 0 / 100));

                ts = `${ts[0].pad(2)}:${ts[1].pad(2)}`;

                const entry = { ticketNo, dateStarted: startDate, timeSpent: ts, description: comment };

                return this.$worklog.saveWorklog(entry).then((s) => {
                    wl.id = s.id;
                    wl.status = "Imported";
                }, (err) => {
                    wl.status = wlStatus_Error;
                    wl.error = err;
                });
            });

            Promise.all(savedWorklogs).then(() => {
                this.$message.info("Worklog import completed");
                this.setState({ worklogData: [...worklogData], selectedCount: "" });
            });
        }
    }

    uploadSelectedWorklogs(selectedWorklogs) {
        selectedWorklogs.groupBy(w => w.ticketNo).forEach(g => {
            this.$q.add(() => {
                const wlList = g.values;

                if (wlList.length === 1) {
                    return this.uploadWorklog(wlList[0]);
                }
                else {
                    return wlList.reduce((promise, wl) => {
                        return promise.finally(() => this.uploadWorklog(wl));
                    }, Promise.resolve());
                }
            });
        });

        this.$q.start();
    }

    uploadWorklog(log) {
        const { ticketNo, startDate, timespent, comment } = log;

        log.status = "Uploading...";

        this.$worklog.upload(ticketNo, startDate, timespent * 1000, comment).then((wlId) => {
            log.disabled = true;
            log.selected = false;
            log.status = "Uploaded";
            log.worklogId = wlId.id;

            this.setState(({ worklogData }) => { return { worklogData: [...worklogData] }; });
        }, ({ message, error: { errors, errorMessages } = {} }) => {
            log.disabled = true;
            log.selected = false;
            log.status = wlStatus_Error;

            const errorKeys = errors && Object.keys(errors);

            if (message) {
                log.error = message;
            }
            else if (errorKeys && errorKeys.length) {
                log.error = errorKeys.reduce((err, key) => {
                    const msg = errors[key];

                    if (err) {
                        return `${err}; ${msg}`;
                    } else {
                        return msg;
                    }
                }, "");
            }
            else if (errorMessages && errorMessages.length) {
                log.error = errorMessages.reduce((err, msg) => {
                    if (err) {
                        return `${err}; ${msg}`;
                    } else {
                        return msg;
                    }
                }, "");
            }

            this.setState(({ worklogData }) => { return { worklogData: [...worklogData] }; });
        });

        this.setState(({ worklogData }) => { return { worklogData: [...worklogData] }; });
    }

    formatTimespent(value) {
        if (typeof value === "number") {
            return this.$utils.formatSecs(value);
        }
        else {
            return value;
        }
    }

    toggleAllRows = () => {
        let { selectAll, worklogData } = this.state;
        selectAll = !selectAll;
        const status = selectAll ? wlStatus_WillImport : wlStatus_Excluded;
        worklogData = [...worklogData];
        worklogData.forEach(w => {
            if (!w.disabled) {
                w.selected = selectAll;
                w.status = status;
            }
        });
        this.setState({ selectAll, worklogData, selectedCount: this.getSelectedLogs(worklogData).length || "" });
    }

    getSelectedLogs = (worklogData) => (worklogData || this.state.worklogData).filter(w => w.selected)

    toggleAutoUpload = (autoUpload) => this.setState({ autoUpload })

    toggleSelection = (row, index) => {
        let { worklogData } = this.state;
        worklogData = [...worklogData];
        row.selected = !row.selected;
        row.status = row.selected ? wlStatus_WillImport : wlStatus_Excluded;
        this.setState({ worklogData, selectedCount: this.getSelectedLogs(worklogData).length || "" });
    }

    downloadTemplate = () => {
        const today = new Date().format("dd-MMM-yyyy HH:mm:ss");
        const lines = [
            "Ticket No,Start Date,Timespent,Comment",
            `JA-1001,${today},1w 2d 3h 4m,Sample worklog 1`,
            `JA-1002,${today},12.5,Sample worklog 2`,
            `JA-1003,${today},14:45,Sample worklog 3`,
            `JA-1003,${today},8,Sample worklog 4`
        ];
        exportCsv(lines.join("\n"), "sample_worklog");
    }

    clearWorklogs = () => {
        this.$q.reset();
        this.setState({ isLoading: false, selectedCount: "", worklogData: null, ticketSummary: {}, selectAll: false });
    }

    renderFooter() {
        const {
            state: { autoUpload, isLoading, selectedCount }
        } = this;

        return <div className="pnl-footer">
            <div className="pull-left">
                <Checkbox checked={autoUpload} label="Directly upload worklog to Jira" disabled={isLoading} onChange={this.toggleAutoUpload} />
            </div>

            <div className="pull-right">
                <Button type="info" icon="fa fa-list" label="Clear" disabled={isLoading} onClick={this.clearWorklogs} />
                <Button type="success" icon={autoUpload ? "fa fa-upload" : "fa fa-floppy-o"} disabled={isLoading || !(selectedCount > 0)}
                    label={autoUpload ? `Upload ${selectedCount} worklogs` : `Import ${selectedCount} worklogs`} onClick={this.importWorklogs} />
            </div>
        </div>;
    }

    getWorklogLink(row) {
        const { ticketNo, worklogId, status } = row;

        return <a className="link" href={this.$userutils.getWorklogUrl(ticketNo, worklogId)} target="_blank" rel="noopener noreferrer">{status}</a>;
    }

    render() {
        const { worklogData, ticketSummary, selectAll } = this.state;

        return super.renderBase(
            <div className="import-worklog">
                <ScrollableTable dataset={worklogData} className="worklog-table">
                    <THead>
                        <TRow>
                            <Column><Checkbox checked={selectAll} onChange={this.toggleAllRows} /></Column>
                            <Column sortBy="ticketNo">Ticket No</Column>
                            <Column sortBy="issueType">Issue Type</Column>
                            <Column>Summary</Column>
                            <Column sortBy="startDate">Log Date</Column>
                            <Column sortBy="timespent">Timespent</Column>
                            <Column>Comment</Column>
                            <Column sortBy="assignee">Assignee</Column>
                            <Column sortBy="status">Status</Column>
                        </TRow>
                    </THead>
                    <TBody>
                        {(row, i) => {
                            const rawTicket = ticketSummary[row.ticketNo] || null;
                            const ticket = rawTicket || { summary: "Unavailable" };

                            return <tr key={i} className={row.error ? "row-error" : ""}>
                                <td><Checkbox checked={row.selected} disabled={row.disabled} onChange={() => this.toggleSelection(row, i)} /></td>
                                {rawTicket && <td>{this.getTicketLink(row.ticketNo)}</td>}
                                {!rawTicket && <td>{row.ticketNo}</td>}
                                <td>{ticket.issueTypeIcon && <img src={ticket.issueTypeIcon} alt="" />} {ticket.issueType}</td>
                                <td>{ticket.summary}</td>
                                <td>{this.formatDate(row.startDate)}</td>
                                <td>{this.formatTimespent(row.timespent)}</td>
                                <td>{row.comment}</td>
                                <td>{ticket.assignee}</td>
                                {row.worklogId && <td title="Worklog uploaded successfully">{this.getWorklogLink(row)}</td>}
                                {!row.worklogId && <td title={row.error}>{row.error && <span className="fa fa-exclamation-triangle msg-error" />} {row.status}</td>}
                            </tr>;
                        }}
                    </TBody>
                    <NoDataRow span={9}>
                        Upload the list of worklogs by clicking the ( <span className="fa fa-upload" /> ) icon in top right corner.
                        Click <span className="link" onClick={this.downloadTemplate}>here</span> to download a sample template.
                    </NoDataRow>
                </ScrollableTable>
            </div>
        );
    }
}

export default ImportWorklog;