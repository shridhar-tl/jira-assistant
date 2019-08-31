import * as moment from 'moment';
import { ApiUrls, DummyWLId } from '../_constants';

export default class WorklogService {
    static dependencies = ["UserUtilsService", "JiraService", "SessionService", "DatabaseService", "TicketService", "AjaxService", "UtilsService", "MessageService"];

    //ToDo: FormatTsPipe is not a service
    constructor($userutils, $jira, $session, $db, $ticket, $ajax, $transform, $message) {
        this.$userutils = $userutils;
        this.$jira = $jira;
        this.$session = $session;
        this.$db = $db;
        this.$ticket = $ticket;
        this.$ajax = $ajax;
        this.$utils = $transform;
        this.$message = $message;
    } // format ts should be pipe

    getUploadedWorklogs(fromDate, toDate, userList, fields) {
        const mfromDate = moment(fromDate).startOf('day');
        const mtoDate = moment(toDate).endOf('day');

        fromDate = mfromDate.toDate();
        toDate = mtoDate.toDate();

        if (!userList || userList.length === 0) {
            userList = [this.$session.CurrentUser.name];
        }
        const jql = `worklogAuthor in ("${userList.join("\", \"")}") and worklogDate >= '${
            mfromDate.clone().add(-1, 'days').format("YYYY-MM-DD")}' and worklogDate < '${
            mtoDate.clone().add(1, 'days').format("YYYY-MM-DD")}'`;
        if (!fields || fields.length === 0) {
            fields = ["worklog"];
        } //, "summary", "issuetype", "parent", "status", "assignee"
        return this.$jira.searchTickets(jql, fields)
            .then((issues) => {
                const arr = userList.map((u) => { return { logData: [], userName: u.toLowerCase() }; });
                const report = {};
                for (let x = 0; x < arr.length; x++) {
                    const a = arr[x];
                    report[a.userName] = a;
                }
                for (let iss = 0; iss < issues.length; iss++) {
                    const issue = issues[iss];
                    const fields = issue.fields || {};
                    const worklogs = (fields.worklog || {}).worklogs || [];
                    for (let i = 0; i < worklogs.length; i++) {
                        const worklog = worklogs[i] || {};
                        const startedTime = moment(worklog.started).toDate();
                        const startedDate = moment(worklog.started).startOf("day").toDate();
                        if (startedDate.getTime() >= fromDate.getTime() && startedDate.getTime() <= toDate.getTime()) {
                            const reportUser = report[((worklog.author || {}).name || '').toLowerCase()];
                            if (reportUser) {
                                const mins = worklog.timeSpentSeconds / 60;
                                reportUser.logData.push({
                                    ticketNo: issue.key,
                                    url: this.$userutils.getTicketUrl(issue.key),
                                    issueType: (fields.issuetype || "").name,
                                    parent: (fields.parent || "").key,
                                    summary: fields.summary,
                                    logTime: startedTime,
                                    comment: worklog.comment,
                                    totalHours: `${parseInt((mins / 60).toString()).pad(2)}:${parseInt((mins % 60).toString()).pad(2)}`,
                                    worklogId: worklog.id
                                });
                            }
                        }
                    }
                }
                return arr;
            });
    }

    getPendingWorklogs() {
        return this.$db.worklogs.where("createdBy").equals(this.$session.userId).and((w) => { return !w.isUploaded; }).toArray().then((worklogs) => {
            const keys = worklogs.distinct((w) => { return w.ticketNo; });
            return this.$ticket.getTicketDetails(keys).then((tickets) => {
                const wlList = worklogs.map((w) => {
                    const fields = (tickets[w.ticketNo.toUpperCase()] || {}).fields || {};
                    const data = w;
                    data.summary = fields.summary || "(unavailable)";
                    data.status = (fields.status || "").name || "(unavailable)";
                    return data;
                });
                return wlList;
            });
        });
    }

    uploadWorklogs(ids) {
        return this.$db.worklogs.where("id").anyOf(ids).toArray().then((worklogs) => {
            const promises = worklogs.groupBy(wl => wl.ticketNo).map(grp => {
                let promise = null;
                grp.values.forEach(wl => {
                    if (!promise) {
                        promise = this.uploadWorklog(wl);
                    }
                    else {
                        promise = promise.then(res => this.uploadWorklog(wl));
                    }
                });
                return promise;
            });
            return Promise.all(promises);
            //return Promise.all(worklogs.map((wl) => { return this.uploadWorklog(wl); }));
        }).then(res => this.getPendingWorklogs());
    }

    uploadWorklog(entry) {
        const timeSpent = entry.overrideTimeSpent || entry.timeSpent;
        const request = {
            comment: entry.description,
            started: `${entry.dateStarted.toISOString().replace('Z', '').replace('z', '')}+0000`,
            timeSpent: this.$utils.formatTs(timeSpent) //,
            //visibility = new Visibility { type="group", value= "Deployment Team" }
        };
        let uploadRequest = null;
        if (entry.worklogId > 0) {
            uploadRequest = this.$ajax.put(ApiUrls.updateIndividualWorklog, request, entry.ticketNo, entry.worklogId);
        }
        else {
            uploadRequest = this.$ajax.post(ApiUrls.addIssueWorklog, request, entry.ticketNo, entry.worklogId || 0);
        }
        return uploadRequest.then((result) => {
            entry.worklogId = result.id;
            entry.isUploaded = true;
            entry.timeSpent = timeSpent;
            delete entry.overrideTimeSpent;
            if (entry.parentId) {
                return this.$db.worklogs.put(entry).then(() => entry);
            }
            else {
                if (entry.id !== DummyWLId) {
                    return this.$db.worklogs.delete(entry.id).then(() => { entry.id = DummyWLId; return entry; });
                }
                else {
                    return entry;
                }
            }
        }, (err) => {
            if (err.status === 400) {
                const errors = (err.error || {}).errorMessages || [];
                if (errors.some((e) => e.indexOf("non-editable") > -1)) {
                    return Promise.reject({ message: `${entry.ticketNo} is already closed and cannot upload worklog` });
                }
            }
            return Promise.reject(err);
        });
    }

    deleteWorklogs(ids) {
        const reqArr = [];
        return this.$db.worklogs.where("id").anyOf(ids).toArray().then((wls) => {
            wls.forEach((entry) => { reqArr.push(this.deleteWorklog(entry)); });
            return Promise.all(reqArr);
        });
    }

    deleteWorklog(entry) {
        const delReq = this.$db.worklogs.where("id").equals(entry.id).delete().then(null, (e) => {
            if (!entry.worklogId) {
                return Promise.reject(e);
            }
            return 0;
        });
        if (entry.worklogId > 0) {
            delReq.then(() => { return this.$ajax.delete(ApiUrls.individualWorklog, entry.ticketNo, entry.worklogId); });
        }
        return delReq;
    }

    deleteWorklogsBefore(date) {
        return this.$db.worklogs.where("dateStarted").below(date).delete();
    }

    getWorklogs(range) {
        const curUserId = this.$session.userId;
        const fromDate = moment(range.fromDate).toDate();
        const toDate = moment(range.toDate).endOf('day').toDate();
        const prom = this.$db.worklogs.where("dateStarted").between(fromDate, toDate, true, true)
            .and((w) => { return w.createdBy === curUserId; }).toArray();
        const uploadedWL = this.getUploadedWorklogs(fromDate, toDate).then(wl => {
            const logData = wl.first().logData;
            const wlArr = logData.map(ld => {
                return {
                    createdBy: curUserId,
                    dateStarted: ld.logTime,
                    description: ld.comment,
                    id: DummyWLId,
                    isUploaded: true,
                    timeSpent: ld.totalHours,
                    ticketNo: ld.ticketNo,
                    worklogId: ld.worklogId
                    //parentId:0 - ToDo: Something to be thought of
                };
            });
            return wlArr;
        });
        let modProm = Promise.all([prom, uploadedWL])
            .then((wls) => {
                const pending = wls[0].filter(w => !w.isUploaded && !w.worklogId);
                wls[1].forEach(w => {
                    const relWL = wls[0].first(rw => rw.worklogId === w.worklogId);
                    if (relWL) {
                        w.id = relWL.id;
                        w.parentId = relWL.parentId;
                    }
                });
                return pending.addRange(wls[1]);
            });
        if (range.dateWise === true) {
            modProm = modProm.then(d => this.getDWWorklog(d, fromDate, toDate));
        }
        else if (range.dateWise === false) {
            modProm = modProm.then(d => this.getTWWorklog(d));
        }
        return modProm;
    }

    getWorklogsEntry(start, end) {
        return this.getWorklogs({ fromDate: start.toDate(), toDate: end.toDate() })
            .then((worklogs) => {
                const result = worklogs.map(w => this.getWLCalendarEntry(w));
                return result;
            });
    }

    copyWorklog(wl, startDate) {
        const newWL = {
            createdBy: this.$session.CurrentUser.userId,
            dateStarted: moment(startDate).toDate(),
            description: wl.description,
            timeSpent: wl.overrideTimeSpent || wl.timeSpent,
            ticketNo: wl.ticketNo,
            isUploaded: false
        };
        return this.$db.worklogs.add(newWL).then((id) => { newWL.id = id; return this.getWLCalendarEntry(newWL); });
    }

    changeWorklogDate(worklog, startDate) {
        let pro = null;
        if (!isNaN(Number(worklog.id)) && worklog.id !== DummyWLId) {
            pro = this.$db.worklogs.where("id").equals(worklog.id).first();
        }
        else {
            pro = Promise.resolve(worklog);
        }
        return pro.then((wl) => {
            wl.dateStarted = moment(startDate).toDate();
            const getCalEntry = () => { return this.getWLCalendarEntry(wl); };
            if (wl.worklogId > 0) {
                return this.uploadWorklog(wl).then(() => getCalEntry());
            }
            else {
                return this.$db.worklogs.put(wl).then(() => getCalEntry());
            }
        });
    }

    changeWorklogTS(worklog, timeSpent) {
        let pro = null;
        if (!isNaN(Number(worklog.id)) && worklog.id !== DummyWLId) {
            pro = this.$db.worklogs.where("id").equals(worklog.id).first();
        }
        else {
            pro = Promise.resolve(worklog);
        }
        return pro.then((wl) => {
            wl.timeSpent = timeSpent;
            delete wl.overrideTimeSpent;
            const getCalEntry = () => { return this.getWLCalendarEntry(wl); };
            if (wl.worklogId > 0) {
                return this.uploadWorklog(wl).then(() => getCalEntry());
            }
            else {
                return this.$db.worklogs.put(wl).then(getCalEntry);
            }
        });
    }

    getLocalWorklog(worklogId) { return this.$db.worklogs.where("id").equals(parseInt(`${worklogId}`)).first(); }

    getWorklog(worklog) {
        if (worklog.isUploaded) {
            return this.$jira.getJAWorklog(worklog.worklogId, worklog.ticketNo);
        }
        else {
            return this.getLocalWorklog(worklog.id);
        }
    }

    saveWorklog(worklog, upload) {
        return this.$ticket.getTicketDetails(worklog.ticketNo).then((ticket) => {
            if (!ticket) {
                this.$message.error(`${worklog.ticketNo} is not a valid Jira Key`);
                return Promise.reject(`${worklog.ticketNo} is not a valid Jira Key`);
            }
            if (!this.$session.CurrentUser.allowClosedTickets) {
                if (ticket.fields.status.name.toLowerCase() === "closed") {
                    const msg = `${ticket.key} is already closed. Cannot add worklog for closed ticket!`;
                    this.$message.error(msg);
                    return Promise.reject(msg);
                }
            }
            const wl = {
                createdBy: this.$session.userId,
                dateStarted: moment(worklog.dateStarted).toDate(),
                ticketNo: ticket.key,
                description: worklog.description
            };
            if (worklog.id && worklog.id !== DummyWLId) {
                wl.id = worklog.id;
            }
            if (worklog.isUploaded) {
                wl.isUploaded = worklog.isUploaded;
            }
            if (worklog.worklogId) {
                wl.worklogId = worklog.worklogId;
            }
            if (worklog.timeSpent) {
                wl.timeSpent = worklog.timeSpent;
            }
            if (worklog.overrideTimeSpent) {
                wl.overrideTimeSpent = worklog.overrideTimeSpent;
            }
            if (worklog.parentId) {
                wl.parentId = worklog.parentId;
            }
            worklog = wl;
            let pro = null;
            if (worklog.id > 0) {
                pro = this.$db.worklogs.put(worklog);
            }
            else {
                pro = this.$db.worklogs.add(worklog).then((id) => { worklog.id = id; });
            }
            if (upload || worklog.worklogId) {
                pro = pro.then(() => this.uploadWorklog(worklog));
            }
            return pro.then(() => { return this.getWLCalendarEntry(worklog); });
        }, (err) => { console.log("error for ticket number", err); return Promise.reject(err); });
    }

    getWLCalendarEntry(worklog) {
        const obj = {
            entryType: 1,
            start: worklog.dateStarted,
            title: `${worklog.ticketNo}: ${worklog.description || '(no comment provided)'}`,
            id: worklog.id.toString() + (worklog.worklogId ? `#${worklog.worklogId}` : ""),
            url: "",
            end: moment(worklog.dateStarted).add(this.getTimeSpent(worklog), "minutes").toDate(),
            editable: true,
            sourceObject: worklog
        };
        if (worklog.parentId) {
            obj.parentId = worklog.parentId;
        }
        return obj;
    }

    getTimeSpent(entry, ticks) {
        if (!entry) {
            return 0;
        }
        const timeSpent = (typeof entry === 'string') ? entry : (entry.overrideTimeSpent || entry.timeSpent);
        if (!timeSpent) {
            return 0;
        }
        const tmp = timeSpent.replace(" ", "0").split(':');
        if (tmp.length === 2) {
            return ((parseInt(`0${tmp[0]}`) * 60) + parseInt(`0${tmp[1]}`)) * (ticks ? 60 * 1000 : 1);
        }
        else {
            return 0;
        }
    }

    getDWWorklog(data, fromDate, toDate) {
        const dateArr = this.$userutils.getDays(fromDate, toDate);
        let entries = data.groupBy((l) => { return l.dateStarted.format("yyyy-MM-dd"); });
        entries = dateArr.leftJoin(entries, (left, right) => left.date.format("yyyy-MM-dd") === right.key)
            .select(data => data.right || (data.left.isHoliday || data.left.isFuture ? null : {
                key: data.left.date.format("yyyy-MM-dd"),
                values: []
            }))
            .map((l) => {
                const $values = l.values;
                const logDate = moment(l.key, "YYYY-MM-DD").toDate();
                return {
                    key: l.key,
                    dateLogged: logDate,
                    difference: 0,
                    uploaded: $values.filter((d) => d.isUploaded).sum(t => this.getTimeSpent(t)) * 60 * 1000,
                    pendingUpload: $values.filter((d) => !d.isUploaded).sum(tkt => this.getTimeSpent(tkt)) * 60 * 1000,
                    totalHours: $values.sum(t => this.getTimeSpent(t)) * 60 * 1000,
                    ticketList: $values.map((d) => { return { id: d.id, ticketNo: d.ticketNo, uploaded: (d.overrideTimeSpent || d.timeSpent), comment: d.description, worklogId: d.worklogId }; })
                };
            }).orderByDescending((l) => { return l.key; });
        let maxHours = this.$session.CurrentUser.maxHours;
        maxHours = maxHours * 60 * 60 * 1000;
        entries.forEach((d) => {
            //d.pendingUpload = d.totalHours - d.uploaded;
            if (maxHours !== null && maxHours > 0) {
                const diff = d.totalHours - maxHours;
                if (diff !== 0) {
                    d.difference = diff;
                }
            }
        });
        return entries;
    }

    getTWWorklog(data) {
        const $data = data;
        return this.$ticket.getTicketDetails($data.distinct((w) => { return w.ticketNo; })).then((tickets) => {
            const entries = $data.groupBy((l) => { return l.ticketNo; }).map((l) => {
                const t = tickets[l.key];
                const item = {
                    ticketNo: l.key,
                    parentSumm: ((t.fields.parent || "").fields || "").summary,
                    parentKey: ((t.fields || "").parent || "").key,
                    summary: t.fields.summary,
                    status: (t.fields.status || "").name,
                    uploaded: l.values.filter((d) => { return d.isUploaded; }).sum(this.getTimeSpent) * 60 * 1000,
                    totalHours: l.values.sum(this.getTimeSpent) * 60 * 1000,
                    logData: l.values.map((d) => {
                        return {
                            id: d.id, dateLogged: d.dateStarted, uploaded: (d.overrideTimeSpent || d.timeSpent), worklogId: d.worklogId
                        };
                    })
                };
                item.pendingUpload = item.totalHours - item.uploaded;
                return item;
            }).orderBy((d) => { return d.ticketNo; });
            return entries;
        });
    }
}
