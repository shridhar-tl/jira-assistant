import Queue from 'queue';
import { DummyWLId } from '../constants/common';
import { defaultSettings, defaultJiraFields } from '../constants/settings';
import { ApiUrls } from '../constants/api-urls';
import * as moment from 'moment';
import { mergeUrl, prepareUrlWithQueryString, viewIssueUrl, waitFor } from '../common/utils';

export default class JiraService {
    static dependencies = ["AjaxService", "CacheService", "MessageService", "SessionService"];

    constructor($ajax, $jaCache, $message, $session) {
        this.$ajax = $ajax;
        this.$jaCache = $jaCache;
        this.$message = $message;
        this.$session = $session;
        this.runningRequests = {};
    }

    searchTickets(jql, fields, startAt, opts) {
        startAt = startAt || 0;
        const { worklogStartDate, worklogEndDate } = opts || {};
        return new Promise((resolve, reject) => {
            const postData = { jql, fields, maxResults: opts?.maxResults || 1000 };
            if (opts?.expand?.length) {
                postData.expand = opts.expand;
            }

            if (startAt > 0) {
                postData.startAt = startAt;
            }
            this.$ajax.get(prepareUrlWithQueryString(ApiUrls.search, postData))
                .then((result) => {
                    const issues = result.issues;
                    if (opts?.ignoreWarnings !== true) {
                        if (result.warningMessages?.length) {
                            const msg = result.warningMessages.join('\r\n');
                            this.$message.warning(msg, 'Query Error');
                        }
                    }
                    //if (result.maxResults < result.total) {
                    //  this.$message.warning("Your filter returned " + result.total + " tickets but only first " + result.maxResults + " were fetched!");
                    //}
                    if (fields.indexOf("worklog") > -1) {
                        let prevCount = issues.length;
                        let retryCount = 3;
                        const cback = (remaining, isus) => {
                            if (remaining === 0) {
                                resolve({ total: result.total, issues: issues, startAt: startAt });
                            }
                            else if (prevCount > remaining || --retryCount >= 0) {
                                prevCount = remaining;
                                this.fillWorklogs(isus, worklogStartDate, worklogEndDate, cback);
                            }
                            else {
                                reject(null);
                            }
                        };
                        cback(false, issues);
                        retryCount = 3;
                    }
                    else {
                        resolve({ total: result.total, issues: issues, startAt: startAt });
                    }
                }, (err) => {
                    if (opts?.ignoreErrors !== true) {
                        const messages = err.error?.errorMessages;
                        if (messages?.length > 0) {
                            this.$message.error(messages.join('<br/>'), "Error fetching ticket details");
                        }
                    }
                    reject(err);
                });
        }).then((result) => {
            const issues = result.issues;
            if ((issues.length + result.startAt) < result.total && issues.length > 0) {
                return this.searchTickets(jql, fields, result.startAt + issues.length, opts).then(res => issues.addRange(res));
            }
            else {
                return issues;
            }
        });
    }

    getWorklogs(jiraKey, startDate, endDate) {
        const url = this.$ajax.prepareUrl(ApiUrls.issueWorklog, jiraKey);

        const reqObj = {
            maxResults: 5000,
            startAt: 0
        };

        const threshold = 24 * 60 * 60 * 1000; // have 24 hours threshold to avoid timezone issues while pulling worklogs

        if (startDate && startDate instanceof Date) {
            reqObj.startedAfter = startDate.getTime() - threshold; // Pull from 24 hours before the given time
        }

        if (endDate && endDate instanceof Date) {
            reqObj.startedBefore = endDate.getTime() + threshold; // pull till next 24 hours
        }

        return this.$ajax.get(url, reqObj);
    }

    async getJQLAutocomplete() {
        let result = await this.$jaCache.session.getPromise("jql_autocomplete");

        if (result) {
            return result;
        }

        result = await this.$ajax.get(ApiUrls.getJQLAutocomplete);

        this.$jaCache.session.set("jql_autocomplete", result, 10);

        return result;
    }

    async getJQLSuggestions(fieldName, fieldValue) {
        return await this.$ajax.get(ApiUrls.getJQLSuggestions, { fieldName, fieldValue });
    }

    async getCustomFields() {
        let result = await this.$jaCache.session.getPromise("customFields");

        if (result) {
            return result;
        }

        result = await this.$ajax.get(ApiUrls.getCustomFields);

        this.$jaCache.session.set("customFields", result, 10);

        return result;

    }

    async getRapidViews() {
        let result = await this.$jaCache.session.getPromise("rapidViews");

        if (result) {
            return result;
        }
        try {
            let startAt = 0, maxLoop = 10;
            let data = null;

            do {
                data = await this.$ajax.get(`${ApiUrls.scrumBoards}&startAt=${encodeURIComponent(startAt)}`);
                startAt = data.maxResults + data.startAt;

                if (!result) { result = data; }
                else {
                    result.values.push(...data.values);
                }
            } while (data.total > startAt && --maxLoop > 0);
        }
        catch (err) {
            console.warn("Getting board list failed. Trying alternate option", err);
            result = await this.$ajax.get(ApiUrls.rapidViews);
        }
        result = result.views || result.values;

        this.$jaCache.session.set("rapidViews", result, 10);

        return result;
    }

    getProjects() {
        const value = this.$jaCache.session.get("projects");
        if (value) {
            return new Promise((resolve) => resolve(value));
        }
        return this.$ajax.get(ApiUrls.getAllProjects)
            .then((projects) => { this.$jaCache.session.set("projects", projects, 10); return projects; });
    }

    getIssueTypes() {
        const value = this.$jaCache.session.get("issuetypes");
        if (value) {
            return new Promise((resolve, reject) => resolve(value));
        }
        return this.$ajax.get(ApiUrls.getAllIssueTypes)
            .then((issuetypes) => { this.$jaCache.session.set("issuetypes", issuetypes, 10); return issuetypes; });
    }

    getProjectImportMetadata(projects) {
        let onlyOne = false;
        if (typeof projects === "string") {
            projects = [projects];
            onlyOne = true;
        }

        projects = projects.map(p => p.toUpperCase());

        return new Promise((success, fail) => {
            let result = {};
            const projectsToPull = [];
            projects.forEach(p => {
                const project = this.$jaCache.session.get(`projectMetadata_${p}`);
                if (project) {
                    result[p] = project;
                } else {
                    projectsToPull.push(p);
                }
            });

            if (projectsToPull.length === 0) {
                success(onlyOne ? result[projects[0]] : result);
            }
            else {
                return this.$ajax.get(ApiUrls.getProjectImportMetadata + encodeURIComponent(projectsToPull.join(",")))
                    .then((metadata) => {
                        result = metadata.projects.reduce((r, prj) => {
                            prj.issuetypesObj = prj.issuetypes.reduce((types, type) => {
                                types[type.name.toLowerCase().replace(/ /g, '-')] = type;
                                return types;
                            }, {});
                            r[prj.key] = prj;
                            return r;
                        }, {});

                        success(onlyOne ? result[projects[0]] : result);
                    }, fail);
            }
        });
    }

    async getProjectStatuses(projects) {
        let onlyOne = false;
        if (typeof projects === "string") {
            projects = [projects];
            onlyOne = true;
        }

        projects = projects.map(p => p.toUpperCase());

        const result = await Promise.all(projects.map(async p => {
            const cacheKey = `projectStatuses_${p}`;
            let project = this.$jaCache.session.get();

            if (!project) {
                project = await this.$ajax.get(ApiUrls.getProjectStatuses, p);
                this.$jaCache.session.set(cacheKey, project);
            }

            return project;
        }));

        return onlyOne ? result[0] : result;
    }

    async getIssueMetadata(issuekey) {
        let value = await this.$jaCache.session.getPromise(`issueMetadata_${issuekey}`);
        if (value) {
            return value;
        }

        value = await this.$ajax.get(ApiUrls.getIssueMetadata, issuekey);
        this.$jaCache.session.set(`issueMetadata_${issuekey}`, value, 10);

        return value;
    }

    createIssue(issue) {
        return this.$ajax.post(ApiUrls.createIssue, { fields: issue });
    }

    async cloneIssue(key, summary, fields) {
        const task = await this.$ajax.post(ApiUrls.cloneIssue, { includeAttachments: true, summary, optionalFields: fields || {} }, key);

        if (task.taskId) {
            await waitFor(1250);
            const result = await this.$ajax.get(ApiUrls.taskStatus, task.taskId);
            if (result.progress === 100 && result.result?.issueId) {
                const issue = await this.$ajax.get(`${ApiUrls.individualIssue}?fields=key`, result.result?.issueId);
                if (issue) {
                    return issue;
                }
            }
        }

        return task;
    }

    deleteIssue(issuekey) {
        return this.$ajax.delete(ApiUrls.individualIssue, issuekey);
    }

    bulkImportIssues(issueUpdates) {
        return this.$ajax.post(ApiUrls.bulkImportIssue, { issueUpdates });
    }

    updateIssue(key, issue) {
        return this.$ajax.put(ApiUrls.individualIssue, issue, key);
    }

    getRapidSprintList = (rapidIds, asObj) => {
        const reqArr = rapidIds.map((rapidId) => this.$jaCache.session.getPromise(`rapidSprintList${rapidId}`)
            .then(async (value) => {
                if (value) {
                    return value;
                }
                let result;
                try {
                    let startAt = 0, maxLoop = 15;
                    let data = null;

                    do {
                        data = await this.$ajax.get(ApiUrls.sprintListByBoard, rapidId, startAt);
                        startAt = data.maxResults + data.startAt;

                        // Avoid showing sprints of other boards.
                        // This can happen if a project contains stories which is assigned with sprint of other project
                        data.values = data.values.filter(s => !s.originBoardId || s.originBoardId === parseInt(rapidId));

                        if (!result) { result = data; }
                        else {
                            result.values.push(...data.values);
                        }
                    } while (!data.isLast && --maxLoop > 0);
                }
                catch (err) {
                    console.warn('Getting rapid sprint list failed. Using alternate api.', err);
                    result = await this.$ajax.get(ApiUrls.rapidSprintList, rapidId);
                }

                let sprints = result.sprints || result.values;
                sprints.forEach((sp) => {
                    sp.rapidId = rapidId;
                    if (sp.startDate) {
                        sp.startDate = new Date(sp.startDate);
                    }
                    if (sp.endDate) {
                        sp.endDate = new Date(sp.endDate);
                    }
                    if (sp.completeDate) {
                        sp.completeDate = new Date(sp.completeDate);
                    }
                });

                // By default sort the sprint in desc order
                sprints = sprints.sortBy(s => s.startDate?.getTime(), true);

                // Assign prev and next sprint start & end dates
                let prevSprint = null;
                sprints.forEach(cur => {
                    const prevEndDate = prevSprint?.completeDate || prevSprint?.endDate;
                    if (prevEndDate) {
                        cur.previousSprintEnd = prevEndDate;
                    }

                    const curStartDate = cur.startDate;
                    if (prevSprint && curStartDate) {
                        prevSprint.nextSprintStart = curStartDate;
                    }

                    prevSprint = cur;
                });

                this.$jaCache.session.set(`rapidSprintList${rapidId}`, sprints, 10);

                return sprints;
            }));

        return Promise.all(reqArr).then((results) => (
            asObj ? (rapidIds.reduce((obj, bid, i) => {
                obj[bid] = results[i];
                return obj;
            }, {}))
                : results.union()
        ));
    };

    getSprintList(projects) {
        if (Array.isArray(projects)) {
            projects = projects.join();
        }
        return this.$jaCache.session.getPromise(`sprintListAll${projects}`).then((value) => {
            if (value) {
                return value;
            }
            return this.$ajax.get(ApiUrls.sprintListAll, projects)
                .then((result) => { this.$jaCache.session.set(`sprintListAll${projects}`, result.sprints, 10); return result.sprints; });
        });
    }

    getRapidSprintDetails(rapidViewId, sprintId) {
        return this.$ajax.get(ApiUrls.rapidSprintDetails, rapidViewId, sprintId);
    }

    async getSprintIssues(sprintId, options) {
        const { worklogStartDate, worklogEndDate, ...opts } = options;
        const { issues } = await this.$ajax.get(ApiUrls.getSprintIssues.format(sprintId), opts);
        if (options?.fields?.indexOf("worklog") > -1) {
            await this.fillMissingWorklogs(issues, worklogStartDate, worklogEndDate);
        }

        return issues;
    }

    getOpenTickets(refresh) {
        if (!refresh) {
            const value = this.$jaCache.session.get("myOpenTickets");
            if (value) {
                return new Promise(resolve => resolve(value));
            }
        }

        const jql = this.$session.CurrentUser.openTicketsJQL || defaultSettings.openTicketsJQL;

        return this.searchTickets(jql, defaultJiraFields)
            .then((result) => { this.$jaCache.session.set("myOpenTickets", result); return result; });
    }

    getTicketSuggestion(refresh) {
        const jql = this.$session.CurrentUser.suggestionJQL;

        if (!jql) {
            return this.getOpenTickets(refresh);
        }
        else {
            if (!refresh) {
                const value = this.$jaCache.session.get("mySuggestionTickets");
                if (value) {
                    return new Promise(resolve => resolve(value));
                }
            }

            return this.searchTickets(jql, defaultJiraFields)
                .then((result) => { this.$jaCache.session.set("mySuggestionTickets", result); return result; });
        }
    }

    lookupIssues = async (query, options) => {
        const url = prepareUrlWithQueryString(ApiUrls.searchIssueForPicker, {
            ...options,
            query
        });

        const { sections } = await this.$ajax.get(url);
        const root = this.$session.CurrentUser.jiraUrl?.clearEnd('/');
        sections.forEach(s => s.issues.forEach(issue => {
            issue.root = root;
            if (issue.img) {
                issue.img = mergeUrl(root, issue.img);
                issue.url = viewIssueUrl(root, issue.key);
            }
        }));

        return sections;
    };

    async searchIssueForPicker(query, options) {
        const result = await this.lookupIssues(query, options);
        return result[0].issues;
    }

    async searchUsers(text, maxResult = 10, startAt = 0) {
        let result = null;

        try {
            result = await this.$ajax.get(ApiUrls.searchUser, text, maxResult, startAt);
        }
        catch (err) {
            console.warn("User search failed. Using alternate search mechanism.", err);
            result = await this.$ajax.get(ApiUrls.searchUser_Alt, text, maxResult, startAt);
        }

        return result;
    }

    async searchGroups(text, maxResult = 10) {
        const result = await this.$ajax.get(ApiUrls.searchGroup, text, maxResult);
        return result?.groups;
    }

    async getGroupMembers(groupId, maxResult = 50) {
        const users = this.$jaCache.session.get(`JiraGroup_${groupId}_Users`);
        if (users) {
            return new Promise(resolve => resolve(users));
        }
        const result = await this.$ajax.get(ApiUrls.getGroupMembers, groupId, maxResult);
        return result?.values;
    }

    fillWorklogs(issues, startDate, endDate, callback) {
        issues = issues.filter((iss) => !(iss.fields || {}).worklog || (((iss.fields || {}).worklog || {}).worklogs || []).length < iss.fields.worklog.total);
        let pendCount = issues.length;
        let successCount = 0;
        if (pendCount > 3) {
            pendCount = 3;
        }
        console.log(`FillStarted:- ${issues.length} tickets found`);

        const onSuccess = (res) => {
            if (res) {
                successCount++;
            }

            if (--pendCount === 0) {
                callback(issues.length - successCount, issues);
            }
        };

        for (let i = 0; i < pendCount; i++) {
            this.fillWL(issues[i], startDate, endDate).then(onSuccess);
        }
        if (issues.length === 0) {
            callback(issues.length);
        }
    }

    async fillMissingWorklogs(issues, startDate, endDate) {
        issues = issues.filter((iss) => !iss.fields?.worklog || iss.fields?.worklog?.worklogs?.length < iss.fields?.worklog?.total);
        await runOnQueue(issues, 3, async (issue) => {
            const res = await this.getWorklogs(issue.key, startDate, endDate);
            console.log(`Success fetching worklog for ${issue.key}`);
            if (!issue.fields) {
                issue.fields = {};
            }

            issue.fields.worklog = res;
        });
    }

    fillWL(issue, startDate, endDate) {
        console.log(`Started fetching worklog for ${issue.key} between ${startDate} & ${endDate}`);
        return this.getWorklogs(issue.key, startDate, endDate).then((res) => {
            console.log(`Success fetching worklog for ${issue.key}`);
            if (!issue.fields) {
                issue.fields = {};
            }
            issue.fields.worklog = res;
            return true;
        }, () => { console.log(`Failed fetching worklog for ${issue.key}`); return false; });
    }

    getUserDetails(username) {
        const keyName = `userdetail_${username}`;

        return this.fetchCachedData(keyName, () => this.$ajax.get(ApiUrls.getUserDetails, username)
            .then((user) => { this.$jaCache.session.set(keyName, user, 10); return user; }, this.jiraErrorHandler));
    }

    async fetchCachedData(keyName, http) {
        const value = this.getCachedData(keyName);
        if (value) { return value; }

        const runningRequest = this.runningRequests[keyName];

        if (runningRequest) {
            await runningRequest;
            return this.getCachedData(keyName);
        }

        const request = http();
        this.runningRequests[keyName] = request;
        return request;
    }

    getCachedData(keyName) {
        const value = this.$jaCache.session.get(keyName);

        if (value) {
            return Promise.resolve(value);
        }
    }

    jiraErrorHandler = (e) => {
        if (e.status === 401) {
            this.$message.warning("You must be authenticated in Jira to access this tool. Please authenticate in Jira and then retry.", "Unauthorized");
        }
        else if (e.error && e.error.errorMessages) {
            this.$message.warning(e.error.errorMessages, "Server error");
        }
        else {
            e = e.ref || e;
            this.$message.warning(`${e.status}:- ${e.statusText}`, "Unknown error");
        }
        return Promise.reject(e);
    };

    getCurrentUser() {
        return this.$ajax.get(ApiUrls.mySelf).then(null, this.jiraErrorHandler);
    }

    getJAWorklog(worklogId, ticketNo) {
        return this.getWorklog(worklogId, ticketNo).then(w => {
            const mins = (w.timeSpentSeconds / 60);
            const wl = {
                id: DummyWLId,
                createdBy: this.$session.CurrentUser.userId,
                dateStarted: moment(w.started).toDate(),
                description: w.comment,
                isUploaded: true,
                ticketNo: ticketNo,
                worklogId: Number(w.id),
                timeSpent: `${parseInt((mins / 60).toString()).pad(2)}:${parseInt((mins % 60).toString()).pad(2)}`
            };
            return wl;
        });
    }

    getWorklog(worklogId, ticketNo) {
        return this.$ajax.get(ApiUrls.individualWorklog, ticketNo, worklogId);
    }
}

function runOnQueue(items, concurrent, execute) {
    return new Promise((done, reject) => {
        const queue = Queue({ results: [] });
        queue.concurrency = concurrent;
        items.forEach(t => queue.push(() => execute(t)));
        queue.start((err) => {
            if (err) {
                reject(err);
            } else {
                done();
            }
        });
    });
}