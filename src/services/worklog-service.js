import * as moment from 'moment';
import { ApiUrls } from '../constants/api-urls';
import { DummyWLId } from '../constants/common';
import { getUserName, prepareUrlWithQueryString } from '../common/utils';
import BaseService from './base-service';

export default class WorklogService extends BaseService {
    static dependencies = ["UserUtilsService", "JiraService", "SessionService", "StorageService", "TicketService", "AjaxService", "UtilsService", "MessageService"];

    constructor($userutils, $jira, $session, $storage, $ticket, $ajax, $utils) {
        super();
        this.$userutils = $userutils;
        this.$jira = $jira;
        this.$session = $session;
        this.$storage = $storage;
        this.$ticket = $ticket;
        this.$ajax = $ajax;
        this.$utils = $utils;
    }

    getUploadedWorklogs(fromDate, toDate, userList, fields) {
        const mfromDate = moment(fromDate).startOf('day');
        const mtoDate = moment(toDate).endOf('day');

        fromDate = mfromDate.toDate();
        toDate = mtoDate.toDate();
        let listForQuery = '';

        if (!userList || userList.length === 0) {
            listForQuery = 'currentUser()';
            userList = [getUserName(this.$session.CurrentUser)];
        } else {
            listForQuery = `"${userList.join("\", \"")}"`;
        }

        const worklogJQLSuffix = this.$session?.CurrentUser?.worklogJQLSuffix?.trim() || '';

        if (worklogJQLSuffix) {
            console.warn('Appended custom JQL to pull worklog information');
        }

        const jql = `worklogAuthor in (${listForQuery}) and worklogDate >= '${mfromDate.clone().add(-1, 'days').format("YYYY-MM-DD")}' and worklogDate < '${mtoDate.clone().add(1, 'days').format("YYYY-MM-DD")}' ${worklogJQLSuffix}`.trim();
        if (!fields || fields.length === 0) {
            fields = ["worklog"];
        } //, "summary", "issuetype", "parent", "status", "assignee"
        return this.$jira.searchTickets(jql, fields, 0, { worklogStartDate: fromDate, worklogEndDate: toDate })
            .then((issues) => {
                const arr = userList.map((u) => ({ logData: [], userName: u.toLowerCase() }));
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
                            const reportUser = report[getUserName(worklog.author, true)];
                            if (reportUser) {
                                const mins = worklog.timeSpentSeconds / 60;
                                reportUser.logData.push({
                                    ticketNo: issue.key,
                                    url: this.$userutils.getTicketUrl(issue.key),
                                    issueType: (fields.issuetype || "").name,
                                    parent: (fields.parent || "").key,
                                    summary: fields.summary,
                                    logTime: startedTime,
                                    logCreated: moment(worklog.created).toDate(),
                                    logUpdated: moment(worklog.updated || worklog.created).toDate(),
                                    comment: worklog.comment,
                                    totalHours: `${parseInt((mins / 60).toString()).pad(2)}:${parseInt((mins % 60).toString()).pad(2)}`,
                                    totalMins: mins,
                                    totalSecs: worklog.timeSpentSeconds,
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
        return this.$storage.getPendingWorlogByUserId(this.$session.userId).then((worklogs) => {
            const keys = worklogs.distinct((w) => w.ticketNo);
            return this.$ticket.getTicketDetails(keys).then((tickets) => {
                const wlList = worklogs.map((w) => {
                    const fields = (tickets[w.ticketNo.toUpperCase()] || {}).fields || {};
                    const data = w;
                    data.assignee = fields.assignee?.displayName || "(unassigned)";
                    data.summary = fields.summary || "(unavailable)";
                    data.status = fields.status?.name || "(unavailable)";
                    return data;
                });
                return wlList;
            });
        });
    }

    uploadWorklogs(ids, sameObjects) {
        return this.$storage.getWorklogsWithIds(ids).then((worklogs) => {
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
            return Promise.all(promises).then(() => worklogs);
            //return Promise.all(worklogs.map((wl) => { return this.uploadWorklog(wl); }));
        }).then(res => (sameObjects ? res : this.getPendingWorklogs()));
    }

    uploadWorklog(entry, opts) {
        const timeSpent = entry.overrideTimeSpent || entry.timeSpent;

        const uploadRequest = this.upload(entry.ticketNo, entry.dateStarted, timeSpent, entry.description, entry.worklogId, opts);

        return uploadRequest.then((result) => {
            entry.worklogId = result.id;
            entry.isUploaded = true;
            entry.timeSpent = timeSpent;
            delete entry.overrideTimeSpent;

            if (entry.parentId) {
                return this.$storage.addOrUpdateWorklog(entry);
            }
            else {
                if (entry.id !== DummyWLId) {
                    return this.$storage.deleteWorklog(entry.id).then(() => { entry.id = DummyWLId; return entry; });
                }
                else {
                    return entry;
                }
            }
        });
    }

    upload(ticketNo, dateStarted, timeSpent, comment, worklogId, opts) {
        if (opts && typeof opts !== 'object') {
            opts = undefined;
        }
        let { adjustEstimate, estimate } = opts || {};
        if (!estimate && adjustEstimate !== 'leave') {
            adjustEstimate = 'AUTO';
        }

        adjustEstimate = adjustEstimate || 'AUTO';

        if (estimate) {
            estimate = this.$utils.formatTs(estimate);
        }

        const query = {
            adjustEstimate,
            newEstimate: adjustEstimate === 'new' ? estimate : undefined,
            reduceBy: adjustEstimate === 'manual' ? estimate : undefined
        };

        const request = {
            comment,
            started: this.$utils.formatDateTimeForJira(dateStarted), // `${dateStarted.toISOString().replace('Z', '').replace('z', '')}+0000`,
            timeSpent: this.$utils.formatTs(timeSpent) //,
            //visibility = new Visibility { type="group", value= "Deployment Team" }
        };

        const { notifyUsers, isAtlasCloud } = this.$session.CurrentUser;
        if (isAtlasCloud && notifyUsers === false) {
            request.notifyUsers = notifyUsers;
        }
        let uploadRequest = null;

        if (worklogId > 0) {
            uploadRequest = this.$ajax.put(prepareUrlWithQueryString(ApiUrls.individualWorklog, query), request, ticketNo, worklogId);
        }
        else {
            uploadRequest = this.$ajax.post(prepareUrlWithQueryString(ApiUrls.issueWorklog, query), request, ticketNo, worklogId || 0);
        }

        return uploadRequest.then(null, (err) => {
            if (err.status === 400) {
                console.error(`Error uploading worklog to ${ticketNo}.`, err);
                const errors = (err.error || {}).errorMessages || [];
                let message = null;
                if (errors.some((e) => e.includes("non-editable") || e.includes("permission"))) {
                    message = `Permission denied to log work on ${ticketNo}`;
                } else {
                    message = `Unable to upload worklog for ${ticketNo}. Look at console for more details`;
                }
                return Promise.reject({ message });
            }
            return Promise.reject(err);
        });
    }

    deleteWorklogs(ids) {
        const reqArr = [];
        return this.$storage.getWorklogsWithIds(ids).then((wls) => {
            wls.forEach((entry) => { reqArr.push(this.deleteWorklog(entry)); });
            return Promise.all(reqArr);
        });
    }

    deleteWorklog(entry) {
        const delReq = this.$storage.deleteWorklog(entry.id).then(null, (e) => {
            if (!entry.worklogId) {
                return Promise.reject(e);
            }
            return 0;
        });
        if (entry.worklogId > 0) {
            delReq.then(() => this.$ajax.delete(ApiUrls.individualWorklog, entry.ticketNo, entry.worklogId));
        }
        return delReq;
    }

    /* Commented as no reference was found
    deleteWorklogsBefore(date) {
        return this.$storage.deleteWorklogsBefore(date);
    }

    getLocalWorklog(worklogId) {
        return this.$storage.getSingleWorklogWithId(parseInt(`${worklogId}`));
    }*/

    getWorklogs(range, fields) {
        const curUserId = this.$session.userId;
        const fromDate = moment(range.fromDate).toDate();
        const toDate = moment(range.toDate).endOf('day').toDate();
        const prom = this.$storage.getWorklogsBetween(fromDate, toDate, curUserId).then(async data => {
            const pending = data.filter(w => !w.isUploaded && !w.worklogId);
            const ticketNos = pending.distinct(w => w.ticketNo);
            const ticketDetails = await this.$ticket.getTicketDetails(ticketNos, false, ['summary'], { allowCache: false });
            pending.forEach(wl => {
                wl.summary = ticketDetails[wl.ticketNo]?.fields?.summary || '';
            });

            return pending;
        });
        const uploadedWL = this.getUploadedWorklogs(fromDate, toDate, undefined, fields).then(wl => {
            const logData = wl.first().logData;
            const wlArr = logData.map(ld => ({
                createdBy: curUserId,
                dateStarted: ld.logTime,
                description: ld.comment,
                id: DummyWLId,
                isUploaded: true,
                timeSpent: ld.totalHours,
                totalSecs: ld.totalSecs,
                totalMins: ld.totalMins,
                ticketNo: ld.ticketNo,
                worklogId: ld.worklogId,
                summary: ld.summary
                //parentId:0 - ToDo: Something to be thought of
            }));
            return wlArr;
        });
        let modProm = Promise.all([prom, uploadedWL])
            .then((wls) => {
                const pending = wls[0];

                const getTotalSecs = this.$utils.getTotalSecs;
                pending.forEach(wl => {
                    const timeSpent = wl.overrideTimeSpent || wl.timeSpent;
                    wl.totalSecs = getTotalSecs(timeSpent);
                    wl.totalMins = wl.totalSecs / 60;
                });

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

    getWorklogsEntry(start, end, fields) {
        return this.getWorklogs({ fromDate: start.toDate(), toDate: end.toDate() }, fields)
            .then((worklogs) => {
                const result = worklogs.map(w => this.getWLCalendarEntry(w));
                return result;
            });
    }

    copyWorklog(wl, startDate) {
        const newWL = {
            createdBy: this.$session.CurrentUser.userId,
            dateStarted: moment(startDate || wl.dateStarted).clone().toDate(),
            description: wl.description,
            timeSpent: wl.overrideTimeSpent || wl.timeSpent,
            ticketNo: wl.ticketNo,
            isUploaded: false
        };
        return this.$storage.addWorklog(newWL).then((id) => { newWL.id = id; return this.getWLCalendarEntry(newWL); });
    }

    changeWorklogDate(worklog, startDate) {
        let pro = null;
        if (!isNaN(Number(worklog.id)) && worklog.id !== DummyWLId) {
            pro = this.$storage.getSingleWorklogWithId(worklog.id);
        }
        else {
            pro = Promise.resolve(worklog);
        }
        return pro.then((wl) => {
            wl.dateStarted = moment(startDate).toDate();
            const getCalEntry = () => this.getWLCalendarEntry(wl);
            if (wl.worklogId > 0) {
                return this.uploadWorklog(wl).then(() => getCalEntry());
            }
            else {
                return this.$storage.addOrUpdateWorklog(wl).then(() => getCalEntry());
            }
        });
    }

    changeWorklogTS(worklog, timeSpent) {
        let pro = null;
        if (!isNaN(Number(worklog.id)) && worklog.id !== DummyWLId) {
            pro = this.$storage.getSingleWorklogWithId(worklog.id);
        }
        else {
            pro = Promise.resolve(worklog);
        }
        return pro.then((wl) => {
            wl.timeSpent = timeSpent;
            delete wl.overrideTimeSpent;
            const getCalEntry = () => this.getWLCalendarEntry(wl);
            if (wl.worklogId > 0) {
                return this.uploadWorklog(wl).then(() => getCalEntry());
            }
            else {
                return this.$storage.addOrUpdateWorklog(wl).then(getCalEntry);
            }
        });
    }

    async getWorklog(worklog) {
        if (worklog.isUploaded) {
            return this.$jira.getJAWorklog(worklog.worklogId, worklog.ticketNo);
        }
        else {
            const wl = await this.$storage.getSingleWorklogWithId(worklog.id);

            if (wl.overrideTimeSpent) {
                wl.timeSpent = wl.overrideTimeSpent;
                delete wl.overrideTimeSpent;
            }

            return wl;
        }
    }

    saveWorklog(worklog, upload) {
        return this.$ticket.getTicketDetails(worklog.ticketNo).then((ticket) => {
            if (!ticket) {
                return Promise.reject(`${worklog.ticketNo} is not a valid Jira Key`);
            }
            if (!this.$session.CurrentUser.allowClosedTickets) {
                if (ticket.fields.status.name.toLowerCase() === "closed") {
                    return Promise.reject(`${ticket.key} is already closed. Cannot add worklog for closed ticket!`);
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
            if (worklog.overrideTimeSpent) { // ToDo: This block can be removed later
                wl.timeSpent = worklog.overrideTimeSpent;
            }
            if (worklog.parentId) {
                wl.parentId = worklog.parentId;
            }
            worklog = wl;
            let pro = null;
            if (worklog.id > 0) {
                pro = this.$storage.addOrUpdateWorklog(worklog);
            }
            else {
                pro = this.$storage.addWorklog(worklog).then((id) => { worklog.id = id; });
            }
            if (upload || worklog.worklogId) {
                pro = pro.then(() => this.uploadWorklog(worklog, upload));
            }
            return pro.then(() => this.getWLCalendarEntry(worklog));
        }, (err) => { console.error("Error for ticket number", err); return Promise.reject(err); });
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
        let entries = data.groupBy((l) => l.dateStarted.format("yyyy-MM-dd"));
        entries = dateArr.leftJoin(entries, (left, right) => left.date.format("yyyy-MM-dd") === right.key)
            .map((data) => {
                const l = data.right || (data.left.isHoliday || data.left.isFuture ? null : {
                    key: data.left.date.format("yyyy-MM-dd"), values: []
                });
                if (!l) { return l; }

                const $values = l.values;
                const logDate = moment(l.key, "YYYY-MM-DD").toDate();
                return {
                    key: l.key,
                    dateLogged: logDate,
                    difference: 0,
                    uploaded: $values.filter((d) => d.isUploaded).sum(t => this.getTimeSpent(t)) * 60 * 1000,
                    pendingUpload: $values.filter((d) => !d.isUploaded).sum(tkt => this.getTimeSpent(tkt)) * 60 * 1000,
                    totalHours: $values.sum(t => this.getTimeSpent(t)) * 60 * 1000,
                    totalSecs: $values.sum('totalSecs'),
                    ticketList: $values.map((d) => ({ id: d.id, ticketNo: d.ticketNo, uploaded: (d.overrideTimeSpent || d.timeSpent), comment: d.description, worklogId: d.worklogId }))
                };
            }).filter(Boolean).orderByDescending((l) => l.key);

        let { maxHours, minHours = maxHours } = this.$session.CurrentUser;
        maxHours = maxHours * 60 * 60 * 1000;
        minHours = minHours * 60 * 60 * 1000;

        entries.forEach((d) => {
            //d.pendingUpload = d.totalHours - d.uploaded;
            if (maxHours && d.totalHours > maxHours) {
                const diff = d.totalHours - maxHours;
                if (diff !== 0) {
                    d.difference = diff;
                }
            } else if (minHours && d.totalHours < minHours) {
                const diff = d.totalHours - minHours;
                if (diff !== 0) {
                    d.difference = diff;
                }
            }
        });
        return entries;
    }

    getTWWorklog(data) {
        const $data = data;
        return this.$ticket.getTicketDetails($data.distinct((w) => w.ticketNo)).then((tickets) => {
            const entries = $data.groupBy((l) => l.ticketNo).map((l) => {
                const t = tickets[l.key];
                const item = {
                    ticketNo: l.key,
                    parentSumm: ((t.fields.parent || "").fields || "").summary,
                    parentKey: ((t.fields || "").parent || "").key,
                    summary: t.fields.summary,
                    status: (t.fields.status || "").name,
                    uploaded: l.values.filter((d) => d.isUploaded).sum(this.getTimeSpent) * 60 * 1000,
                    totalHours: l.values.sum(this.getTimeSpent) * 60 * 1000,
                    logData: l.values.map((d) => ({
                        id: d.id, dateLogged: d.dateStarted, uploaded: (d.overrideTimeSpent || d.timeSpent), worklogId: d.worklogId
                    }))
                };
                item.pendingUpload = item.totalHours - item.uploaded;
                return item;
            }).orderBy((d) => d.ticketNo);
            return entries;
        });
    }
}
