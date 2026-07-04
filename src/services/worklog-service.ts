import { ApiUrls, DummyWLId } from '@/constants';

import {
    addDays,
    distinct,
    formatDate,
    getEndOfDay,
    getStartOfDay,
    getUserName,
    groupBy,
    leftJoin,
    orderBy,
    orderByDescending,
    prepareUrlWithQueryString,
    sum,
} from '@utils';

import type { WorklogCalendarEntry } from '@types';

import type AjaxService from './ajax-service';
import type JiraService from './jira-service';
import type SessionService from './session-service';
import type StorageService from './storage-service';
import type TicketService from './ticket-service';
import type UserUtilsService from './userutils-service';
import type UtilsService from './utils-service';

export default class WorklogService {
    static dependencies = [
        'UserUtilsService',
        'JiraService',
        'SessionService',
        'StorageService',
        'TicketService',
        'AjaxService',
        'UtilsService',
    ];

    private $userutils: UserUtilsService;
    private $jira: JiraService;
    private $session: SessionService;
    private $storage: StorageService;
    private $ticket: TicketService;
    private $ajax: AjaxService;
    private $utils: UtilsService;

    constructor(
        $userutils: UserUtilsService,
        $jira: JiraService,
        $session: SessionService,
        $storage: StorageService,
        $ticket: TicketService,
        $ajax: AjaxService,
        $utils: UtilsService,
    ) {
        this.$userutils = $userutils;
        this.$jira = $jira;
        this.$session = $session;
        this.$storage = $storage;
        this.$ticket = $ticket;
        this.$ajax = $ajax;
        this.$utils = $utils;
    }

    async getUploadedWorklogs(
        fromDate: Date,
        toDate: Date,
        userList?: string[],
        fields?: string[],
    ): Promise<Array<{ logData: any[]; userName: string }>> {
        const startDate = getStartOfDay(fromDate);
        const endDate = getEndOfDay(toDate);

        let listForQuery = '';
        let users: string[];

        if (!userList || userList.length === 0) {
            listForQuery = 'currentUser()';
            users = [getUserName(this.$session.CurrentUser) || ''];
        } else {
            listForQuery = `"${userList.join('", "')}"`;
            users = userList;
        }

        const worklogJQLSuffix = this.$session?.CurrentUser?.worklogJQLSuffix?.trim() || '';

        if (worklogJQLSuffix) {
            console.warn('Appended custom JQL to pull worklog information');
        }

        // Extend date range by 1 day on each side to account for timezone issues
        const fromDateStr = formatDate(addDays(startDate, -1), 'yyyy-MM-dd');
        const toDateStr = formatDate(addDays(endDate, 1), 'yyyy-MM-dd');

        const jql =
            `worklogAuthor in (${listForQuery}) and worklogDate >= '${fromDateStr}' and worklogDate < '${toDateStr}' ${worklogJQLSuffix}`.trim();

        const fieldsToUse = fields && fields.length > 0 ? fields : ['worklog'];

        const issues = await this.$jira.searchTickets(jql, fieldsToUse, undefined, {
            worklogStartDate: startDate,
            worklogEndDate: endDate,
        });

        // Initialize result array
        const arr = users.map((u: any) => ({ logData: [], userName: u.toLowerCase() }));
        const report: Record<string, { logData: any[]; userName: string }> = {};

        arr.forEach((a: any) => {
            report[a.userName] = a;
        });

        // Process worklogs
        for (const issue of issues) {
            const fields = issue.fields || {};
            const worklogs = (fields.worklog || {}).worklogs || [];

            for (const worklog of worklogs) {
                const startedTime = new Date(worklog.started);
                const startedDate = getStartOfDay(startedTime);

                if (startedDate.getTime() >= startDate.getTime() && startedDate.getTime() <= endDate.getTime()) {
                    const reportUser = report[getUserName(worklog.author, true) || ''];

                    if (reportUser) {
                        const mins = worklog.timeSpentSeconds / 60;
                        reportUser.logData.push({
                            ticketNo: issue.key,
                            url: this.$userutils.getTicketUrl(issue.key),
                            issueType: fields.issuetype?.name || '',
                            parent: fields.parent?.key || '',
                            summary: fields.summary,
                            logTime: startedTime,
                            logCreated: new Date(worklog.created),
                            logUpdated: new Date(worklog.updated || worklog.created),
                            comment: worklog.comment,
                            totalHours: `${Math.floor(mins / 60)
                                .toString()
                                .padStart(2, '0')}:${Math.floor(mins % 60)
                                .toString()
                                .padStart(2, '0')}`,
                            totalMins: mins,
                            totalSecs: worklog.timeSpentSeconds,
                            worklogId: worklog.id,
                            author: worklog.author,
                        });
                    }
                }
            }
        }

        return arr;
    }

    async getPendingWorklogs(): Promise<any[]> {
        const worklogs = await this.$storage.getPendingWorklogByUserId(this.$session.userId!);
        const keys = distinct(worklogs, (w: any) => w.ticketNo);
        const tickets = await this.$ticket.getTicketDetails(keys);

        const wlList = worklogs.map((w: any) => {
            const fields = (tickets[w.ticketNo.toUpperCase()] || {}).fields || {};
            const data = w;
            data.assignee = fields.assignee?.displayName || '(unassigned)';
            data.summary = fields.summary || '(unavailable)';
            data.status = fields.status?.name || '(unavailable)';
            return data;
        });

        return wlList;
    }

    async uploadWorklogs(ids: number[], sameObjects?: boolean): Promise<any> {
        const worklogs = await this.$storage.getWorklogsWithIds(ids);
        const groups = groupBy(worklogs, (wl: any) => wl.ticketNo);

        const promises = groups.map((grp) => {
            let promise: Promise<any> | null = null;
            grp.values.forEach((wl: any) => {
                if (!promise) {
                    promise = this.uploadWorklog(wl);
                } else {
                    promise = promise.then(() => this.uploadWorklog(wl));
                }
            });
            return promise!;
        });

        await Promise.all(promises);
        return sameObjects ? worklogs.map((w: any) => this.getWLCalendarEntry(w)) : this.getPendingWorklogs();
    }

    async uploadWorklog(entry: any, opts?: any): Promise<any> {
        const timeSpent = entry.overrideTimeSpent || entry.timeSpent;

        const result = await this.upload(entry.ticketNo, entry.dateStarted, timeSpent, entry.description, entry.worklogId, opts);

        entry.worklogId = result.id;
        entry.isUploaded = true;
        entry.timeSpent = timeSpent;
        delete entry.overrideTimeSpent;

        if (entry.parentId) {
            return this.$storage.addOrUpdateWorklog(entry);
        } else {
            if (entry.id !== DummyWLId) {
                await this.$storage.deleteWorklog(entry.id);
                entry.id = DummyWLId;
                return entry;
            } else {
                return entry;
            }
        }
    }

    upload(
        ticketNo: string,
        dateStarted: Date,
        timeSpent: string,
        comment: string,
        worklogId?: number,
        opts?: { adjustEstimate?: string; estimate?: string },
    ): Promise<any> {
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

        const query: any = {
            adjustEstimate,
            newEstimate: adjustEstimate === 'new' ? estimate : undefined,
            reduceBy: adjustEstimate === 'manual' ? estimate : undefined,
        };

        const request: any = {
            comment,
            started: this.$utils.formatDateTimeForJira(dateStarted),
            timeSpent: this.$utils.formatTs(timeSpent),
        };

        const { notifyUsers, isAtlasCloud } = this.$session.CurrentUser;
        if (isAtlasCloud && notifyUsers === false) {
            request.notifyUsers = notifyUsers;
        }

        let uploadRequest: Promise<any>;

        if (worklogId && worklogId > 0) {
            uploadRequest = this.$ajax.put(prepareUrlWithQueryString(ApiUrls.individualWorklog, query), request, ticketNo, worklogId);
        } else {
            uploadRequest = this.$ajax.post(prepareUrlWithQueryString(ApiUrls.issueWorklog, query), request, ticketNo, worklogId || 0);
        }

        return uploadRequest.catch((err: any) => {
            if (err.status === 400) {
                console.error(`Error uploading worklog to ${ticketNo}.`, err);
                const errors = (err.error || {}).errorMessages || [];
                let message = null;

                if (errors.some((e: string) => e.includes('non-editable') || e.includes('permission'))) {
                    message = `Permission denied to log work on ${ticketNo}`;
                } else {
                    message = `Unable to upload worklog for ${ticketNo}. Look at console for more details`;
                }

                return Promise.reject({ message });
            }
            return Promise.reject(err);
        });
    }

    async deleteWorklogs(ids: number[]): Promise<any[]> {
        const wls = await this.$storage.getWorklogsWithIds(ids);
        const reqArr = wls.map((entry: any) => this.deleteWorklog(entry));
        return Promise.all(reqArr);
    }

    deleteWorklog(entry: any): Promise<any> {
        const delReq = this.$storage.deleteWorklog(entry.id).catch((e: any) => {
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

    async getWorklogs(range: { fromDate: Date; toDate: Date; dateWise?: boolean }, fields?: string[]): Promise<any> {
        const curUserId = this.$session.userId!;
        const fromDate = getStartOfDay(range.fromDate);
        const toDate = getEndOfDay(range.toDate);

        // Get pending worklogs from storage
        const pendingPromise = this.$storage.getWorklogsBetween(fromDate, toDate, curUserId).then(async (data: any[]) => {
            const pending = data.filter((w: any) => !w.isUploaded && !w.worklogId);
            const ticketNos = distinct(pending, (w: any) => w.ticketNo);
            const ticketDetails = await this.$ticket.getTicketDetails(ticketNos, false, ['summary'], {
                allowCache: false,
            });

            pending.forEach((wl: any) => {
                wl.summary = ticketDetails[wl.ticketNo]?.fields?.summary || '';
            });

            return pending;
        });

        // Get uploaded worklogs
        const uploadedPromise = this.getUploadedWorklogs(fromDate, toDate, undefined, fields).then((wl) => {
            const logData = wl[0]?.logData || [];
            const wlArr = logData.map((ld: any) => ({
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
                summary: ld.summary,
                author: ld.author,
                //parentId:0 - ToDo: Something to be thought of
            }));
            return wlArr;
        });

        let modProm = Promise.all([pendingPromise, uploadedPromise]).then((wls) => {
            const pending = wls[0];
            const uploaded = wls[1];

            // Calculate total seconds for pending worklogs
            pending.forEach((wl: any) => {
                const timeSpent = wl.overrideTimeSpent || wl.timeSpent;
                wl.totalSecs = this.$utils.getTotalSecs(timeSpent);
                wl.totalMins = wl.totalSecs / 60;
            });

            // Match uploaded worklogs with pending ones
            uploaded.forEach((w: any) => {
                const relWL = pending.find((rw: any) => rw.worklogId === w.worklogId);
                if (relWL) {
                    w.id = relWL.id;
                    w.parentId = relWL.parentId;
                }
            });

            return [...pending, ...uploaded];
        });

        if (range.dateWise === true) {
            modProm = modProm.then((d: any) => this.getDWWorklog(d, fromDate, toDate));
        } else if (range.dateWise === false) {
            modProm = modProm.then((d: any) => this.getTWWorklog(d));
        }

        return modProm;
    }

    async getWorklogsEntry(start: Date, end: Date, fields?: string[]): Promise<WorklogCalendarEntry[]> {
        const worklogs = await this.getWorklogs({ fromDate: start, toDate: end }, fields);
        const result = worklogs.map((w: any) => this.getWLCalendarEntry(w));
        return result;
    }

    async copyWorklog(wl: any, startDate?: Date): Promise<WorklogCalendarEntry> {
        const newWL = {
            createdBy: this.$session.CurrentUser.userId,
            dateStarted: startDate ? new Date(startDate) : new Date(wl.dateStarted),
            description: wl.description,
            timeSpent: wl.overrideTimeSpent || wl.timeSpent,
            ticketNo: wl.ticketNo,
            isUploaded: false,
        };

        const id = await this.$storage.addWorklog(newWL as any);
        (newWL as any).id = id;
        return this.getWLCalendarEntry(newWL);
    }

    async changeWorklogDate(worklog: any, startDate: Date): Promise<WorklogCalendarEntry> {
        let wl: any;

        if (!isNaN(Number(worklog.id)) && worklog.id !== DummyWLId) {
            wl = await this.$storage.getSingleWorklogWithId(worklog.id);
        } else {
            wl = worklog;
        }

        wl.dateStarted = new Date(startDate);

        const getCalEntry = () => this.getWLCalendarEntry(wl);

        if (wl.worklogId && wl.worklogId > 0) {
            await this.uploadWorklog(wl);
            return getCalEntry();
        } else {
            await this.$storage.addOrUpdateWorklog(wl);
            return getCalEntry();
        }
    }

    async changeWorklogTS(worklog: any, timeSpent: string): Promise<WorklogCalendarEntry> {
        let wl: any;

        if (!isNaN(Number(worklog.id)) && worklog.id !== DummyWLId) {
            wl = await this.$storage.getSingleWorklogWithId(worklog.id);
        } else {
            wl = worklog;
        }

        wl.timeSpent = timeSpent;
        delete wl.overrideTimeSpent;

        const getCalEntry = () => this.getWLCalendarEntry(wl);

        if (wl.worklogId && wl.worklogId > 0) {
            await this.uploadWorklog(wl);
            return getCalEntry();
        } else {
            await this.$storage.addOrUpdateWorklog(wl);
            return getCalEntry();
        }
    }

    async getWorklog(worklog: any): Promise<any> {
        if (worklog.isUploaded) {
            return this.$jira.getJAWorklog(worklog.worklogId, worklog.ticketNo);
        } else {
            const wl = await this.$storage.getSingleWorklogWithId(worklog.id);

            if (wl?.overrideTimeSpent) {
                wl.timeSpent = wl.overrideTimeSpent;
                delete wl.overrideTimeSpent;
            }

            return wl;
        }
    }

    async saveWorklog(worklog: any, upload?: any): Promise<WorklogCalendarEntry> {
        try {
            const ticket = await this.$ticket.getTicketDetails(worklog.ticketNo);

            if (!ticket) {
                return Promise.reject(`${worklog.ticketNo} is not a valid Jira Key`);
            }

            if (!this.$session.CurrentUser.allowClosedTickets) {
                if (ticket.fields.status.name.toLowerCase() === 'closed') {
                    return Promise.reject(`${ticket.key} is already closed. Cannot add worklog for closed ticket!`);
                }
            }

            const wl: any = {
                createdBy: this.$session.userId,
                dateStarted: new Date(worklog.dateStarted),
                ticketNo: ticket.key,
                description: worklog.description,
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
                // ToDo: This block can be removed later
                wl.timeSpent = worklog.overrideTimeSpent;
            }
            if (worklog.parentId) {
                wl.parentId = worklog.parentId;
            }

            let promise: Promise<any>;

            if (wl.id > 0) {
                promise = this.$storage.addOrUpdateWorklog(wl);
            } else {
                promise = this.$storage.addWorklog(wl).then((id) => {
                    wl.id = id;
                });
            }

            if (upload || wl.worklogId) {
                promise = promise.then(() => this.uploadWorklog(wl, upload));
            }

            await promise;
            return this.getWLCalendarEntry(wl);
        } catch (err) {
            console.error('Error for ticket number', err);
            return Promise.reject(err);
        }
    }

    getWLCalendarEntry(worklog: any): WorklogCalendarEntry {
        const entry: WorklogCalendarEntry = {
            entryType: 1,
            start: worklog.dateStarted,
            title: `${worklog.ticketNo}: ${worklog.description || '(no comment provided)'}`,
            id: worklog.id.toString() + (worklog.worklogId ? `#${worklog.worklogId}` : ''),
            url: '',
            end: new Date(worklog.dateStarted.getTime() + this.getTimeSpent(worklog) * 60 * 1000),
            editable: true,
            sourceObject: worklog,
        };

        if (worklog.parentId) {
            entry.parentId = worklog.parentId;
        }

        return entry;
    }

    getTimeSpent(entry: any | string, ticks?: boolean): number {
        if (!entry) {
            return 0;
        }

        const timeSpent = typeof entry === 'string' ? entry : entry.overrideTimeSpent || entry.timeSpent;

        if (!timeSpent) {
            return 0;
        }

        const tmp = timeSpent.replace(' ', '0').split(':');

        if (tmp.length === 2) {
            const hours = parseInt(`0${tmp[0]}`) || 0;
            const minutes = parseInt(`0${tmp[1]}`) || 0;
            return (hours * 60 + minutes) * (ticks ? 60 * 1000 : 1);
        } else {
            return 0;
        }
    }

    getDWWorklog(data: any[], fromDate: Date, toDate: Date): any[] {
        const dateArr = this.$userutils.getDays(fromDate, toDate);
        const entries = groupBy(data, (l: any) => formatDate(l.dateStarted, 'yyyy-MM-dd'));

        const joined = leftJoin(dateArr, entries, (left, right) => formatDate(left.date, 'yyyy-MM-dd') === right.key);

        const processed = joined
            .map((data) => {
                const l =
                    data.right ||
                    (data.left.isHoliday || data.left.isFuture
                        ? null
                        : {
                              key: formatDate(data.left.date, 'yyyy-MM-dd'),
                              values: [],
                          });

                if (!l) {
                    return l;
                }

                const $values = l.values;
                const logDate = new Date(l.key);

                return {
                    key: l.key,
                    dateLogged: logDate,
                    difference: 0,
                    uploaded:
                        sum(
                            $values.filter((d: any) => d.isUploaded),
                            (t: any) => this.getTimeSpent(t),
                        ) *
                        60 *
                        1000,
                    pendingUpload:
                        sum(
                            $values.filter((d: any) => !d.isUploaded),
                            (tkt: any) => this.getTimeSpent(tkt),
                        ) *
                        60 *
                        1000,
                    totalHours: sum($values, (t: any) => this.getTimeSpent(t)) * 60 * 1000,
                    totalSecs: sum($values, 'totalSecs'),
                    ticketList: $values.map((d: any) => ({
                        id: d.id,
                        ticketNo: d.ticketNo,
                        uploaded: d.overrideTimeSpent || d.timeSpent,
                        comment: d.description,
                        worklogId: d.worklogId,
                    })),
                };
            })
            .filter(Boolean);

        const sorted = orderByDescending(processed, (l: any) => l.key);

        const { maxHours, minHours = maxHours } = this.$session.CurrentUser;
        const maxHoursMs = (maxHours || 0) * 60 * 60 * 1000;
        const minHoursMs = (minHours || 0) * 60 * 60 * 1000;

        sorted.forEach((d: any) => {
            if (maxHoursMs && d.totalHours > maxHoursMs) {
                const diff = d.totalHours - maxHoursMs;
                if (diff !== 0) {
                    d.difference = diff;
                }
            } else if (minHoursMs && d.totalHours < minHoursMs) {
                const diff = d.totalHours - minHoursMs;
                if (diff !== 0) {
                    d.difference = diff;
                }
            }
        });

        return sorted;
    }

    async getTWWorklog(data: any[]): Promise<any[]> {
        const ticketNos = distinct(data, (w: any) => w.ticketNo);
        const tickets = await this.$ticket.getTicketDetails(ticketNos);

        const groups = groupBy(data, (l: any) => l.ticketNo);

        const entries = groups.map((l: any) => {
            const t = tickets[l.key];
            const item = {
                ticketNo: l.key,
                parentSumm: (t.fields?.parent?.fields || '').summary || '',
                parentKey: t.fields?.parent?.key || '',
                summary: t.fields?.summary || '',
                status: t.fields?.status?.name || '',
                uploaded:
                    sum(
                        l.values.filter((d: any) => d.isUploaded),
                        (d: any) => this.getTimeSpent(d),
                    ) *
                    60 *
                    1000,
                totalHours: sum(l.values, (d: any) => this.getTimeSpent(d)) * 60 * 1000,
                logData: l.values.map((d: any) => ({
                    id: d.id,
                    dateLogged: d.dateStarted,
                    uploaded: d.overrideTimeSpent || d.timeSpent,
                    worklogId: d.worklogId,
                })),
                pendingUpload: 0,
            };

            item.pendingUpload = item.totalHours - item.uploaded;
            return item;
        });

        return orderBy(entries, (d: any) => d.ticketNo);
    }
}
