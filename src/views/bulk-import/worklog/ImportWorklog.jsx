import React from 'react';
import { ScrollableTable, THead, TRow, TBody, Column, NoDataRow } from '../../../components/ScrollableTable';
import BaseImport from '../BaseImport';
import { inject } from '../../../services/injector-service';
import { Button, Checkbox } from '../../../controls';
import "./ImportWorklog.scss";
import { parseTimespent, exportCsv } from '../../../common/utils';
import Link from '../../../controls/Link';
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
        super(props, "Worklog", "fa fa-clock");
        inject(this, "UtilsService", "UserUtilsService", "TicketService", "QueueService", "WorklogService", "SessionService", "MessageService");

        this.maxHrsToLog = this.$session.CurrentUser.maxHours;
        const autoUpload = this.$session.CurrentUser.autoUpload || false;

        this.state = { autoUpload, ticketSummary: {}, selectedCount: '' };
        this.$q.on("completed", () => {
            this.$message.info("Worklog upload completed");
            this.setState({ isLoading: false, selectedCount: '' });
        });
    }

    transformHeader = (c) => {
        // As prototype functions of array are passed to this function, need to check if this is string
        if (!c || typeof c !== 'string') {
            return null;
        }

        return fieldMapping[c.replace(/[ "]/g, '').toLowerCase()] || null;
    };

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
                const { key, fields: { summary, assignee, issuetype: { iconUrl, name } = {} } } = t;
                const { displayName } = assignee || {};

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
                const hour = Math.floor(timespent / (60 * 60));
                const mins = Math.floor((timespent % (60 * 60)) / 60);

                const ts = `${hour.pad(2)}:${mins.pad(2)}`;

                const entry = { ticketNo, dateStarted: startDate, timeSpent: ts, description: comment };

                return this.$worklog.saveWorklog(entry).then((s) => {
                    wl.id = s.id;
                    wl.status = "Imported. Not Uploaded";
                }, (err) => {
                    wl.status = wlStatus_Error;
                    wl.error = err;
                });
            });

            Promise.all(savedWorklogs).then(() => {
                this.$message.info("Worklog import completed. Upload it to Jira from Calendar or Worklog gadget.");
                this.setState({ worklogData: [...worklogData], selectedCount: "" });
            });
        }
    };

    uploadSelectedWorklogs(selectedWorklogs) {
        selectedWorklogs.groupBy(w => w.ticketNo).forEach(g => {
            this.$q.add(() => {
                const wlList = g.values;

                if (wlList.length === 1) {
                    return this.uploadWorklog(wlList[0]);
                }
                else {
                    return wlList.reduce(async (promise, wl) => {
                        await promise;
                        return this.uploadWorklog(wl);
                    }, Promise.resolve());
                }
            });
        });

        this.$q.start();
    }

    uploadWorklog(log) {
        const { ticketNo, startDate, timespent, comment } = log;

        log.status = "Uploading...";
        this.setState(({ worklogData }) => ({ worklogData: [...worklogData] }));

        const result = this.$worklog.upload(ticketNo, startDate, timespent * 1000, comment).then((wlId) => {
            log.disabled = true;
            log.selected = false;
            log.status = "Uploaded";
            log.worklogId = wlId.id;

            this.setState(({ worklogData }) => ({ worklogData: [...worklogData] }));
        }, (err) => {
            const { message, response, status, error: { errors, errorMessages } = {} } = err;

            log.disabled = true;
            log.selected = false;
            log.status = wlStatus_Error;

            const errorKeys = errors && Object.keys(errors);

            if (message) {
                log.error = message;
            }
            else if (errorKeys?.length) {
                log.error = errorKeys.reduce((err, key) => {
                    const msg = errors[key];

                    if (err) {
                        return `${err}; ${msg}`;
                    } else {
                        return msg;
                    }
                }, "");
            }
            else if (errorMessages?.length) {
                log.error = errorMessages.reduce((err, msg) => {
                    if (err) {
                        return `${err}; ${msg}`;
                    } else {
                        return msg;
                    }
                }, "");
            } else if (response?.length > 5 && response.length <= 100) {
                log.error = response;
            }
            else if (status) {
                log.error = `Status Code: ${status}`;
            }

            this.setState(({ worklogData }) => ({ worklogData: [...worklogData] }));
            return Promise.resolve();
        });

        return result;
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
        if (!worklogData) { return; }

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
    };

    getSelectedLogs = (worklogData) => (worklogData || this.state.worklogData).filter(w => w.selected);

    toggleAutoUpload = (autoUpload) => this.setState({ autoUpload });

    toggleSelection = (row, index) => {
        let { worklogData } = this.state;
        worklogData = [...worklogData];
        row.selected = !row.selected;
        row.status = row.selected ? wlStatus_WillImport : wlStatus_Excluded;
        this.setState({ worklogData, selectedCount: this.getSelectedLogs(worklogData).length || "" });
    };

    downloadTemplate = () => {
        const today = new Date().format("dd-MMM-yyyy HH:mm:ss");
        const lines = [
            "Ticket No,Start Date,Timespent,Comment",
            `JA-1001,${today},1w 2d 3h 4m,Logs 59 hours and 4 mins`,
            `JA-1001,${today},1d 1h,Logs 9 hours`,
            `JA-1002,${today},12.5,Logs 12 hours and 30 mins`,
            `JA-1003,${today},14:4,Logs 14 hours and 40 mins`,
            `JA-1003,${today},8,Logs 8 hours`
        ];
        exportCsv(lines.join("\n"), "sample_worklog");
    };

    clearWorklogs = () => {
        this.$q.reset();
        this.setState({ isLoading: false, selectedCount: "", worklogData: null, ticketSummary: {}, selectAll: false });
    };

    renderFooter() {
        const {
            state: { autoUpload, isLoading, selectedCount }
        } = this;

        return <div className="pnl-footer">
            <div className="float-start">
                <Checkbox checked={autoUpload} label="Directly upload worklog to Jira" disabled={isLoading} onChange={this.toggleAutoUpload} />
            </div>

            <div className="float-end">
                <Button text type="info" icon="fa fa-list" label="Clear" disabled={isLoading} onClick={this.clearWorklogs} />
                <Button type="primary" icon={autoUpload ? "fa fa-upload" : "fa fa-save"} disabled={isLoading || !(selectedCount > 0)}
                    label={autoUpload ? `Upload ${selectedCount} worklogs` : `Import ${selectedCount} worklogs`} onClick={this.importWorklogs} />
            </div>
        </div>;
    }

    getWorklogLink(row) {
        const { ticketNo, worklogId, status } = row;

        return <Link className="link" href={this.$userutils.getWorklogUrl(ticketNo, worklogId)}>{status}</Link>;
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
                            <Column>Issue Type</Column>
                            <Column>Summary</Column>
                            <Column sortBy="startDate">Log Date</Column>
                            <Column sortBy="timespent">Timespent</Column>
                            <Column>Comment</Column>
                            <Column>Assignee</Column>
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