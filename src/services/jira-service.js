import Queue from 'queue';
import { DummyWLId } from '../constants/common';
import { defaultSettings, defaultJiraFields } from '../constants/settings';
import { ApiUrls } from '../constants/api-urls';
import * as moment from 'moment';
import { mergeUrl, prepareUrlWithQueryString, viewIssueUrl, waitFor } from '../common/utils';
import FeedbackPromise from 'src/common/FeedbackPromise';
import { isPluginBuild } from 'src/constants/build-info';

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
        fields = fields || defaultJiraFields;
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
                    issues.total = result.total;
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
            if (!opts?.maxResults && ((issues.length + result.startAt) < result.total && issues.length > 0)) {
                return this.searchTickets(jql, fields, result.startAt + issues.length, opts).then(res => issues.addRange(res));
            }
            else {
                return issues;
            }
        });
    }

    getWorklogs(jiraKey, startDate, endDate) {
        const url = this.$ajax.prepareUrl(ApiUrls.issueWorklog, [jiraKey]);

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

        const createdFieldIndex = result.findIndex(f => f.id === 'created');
        if (createdFieldIndex > 0) {
            const createdField = result[createdFieldIndex];
            const ageField = {
                ...createdField,
                custom: true,
                id: 'issueAge',
                name: 'Issue Age',
                schema: { type: 'ageindays' }
            };

            result.splice(createdFieldIndex + 1, 0, ageField);
        }

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

    async getBoardConfig(boardId) {
        let result = await this.$jaCache.session.getPromise(`boardConfig_${boardId}`);

        if (result) {
            return result;
        }

        result = await this.$ajax.get(ApiUrls.scrumBoardConfig, boardId);

        this.$jaCache.session.set(`boardConfig_${boardId}`, result, 10);

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
            let project = this.$jaCache.session.get(cacheKey);

            if (!project) {
                project = await this.$ajax.get(ApiUrls.getProjectStatuses, p);
                this.$jaCache.session.set(cacheKey, project);
            }

            return project;
        }));

        return onlyOne ? result[0] : result;
    }

    async getJiraStatuses() {
        const cacheKey = `jiraStatuses`;
        let statuses = this.$jaCache.session.get(cacheKey);

        if (!statuses) {
            statuses = await this.$ajax.get(ApiUrls.getJiraStatuses);
            this.$jaCache.session.set(cacheKey, statuses);
        }

        return statuses;
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

    getRapidSprintList = (rapidIds, opts) => {
        const asObj = typeof opts === 'boolean' ? opts : false;
        const defaultState = 'active,closed';
        const { state = defaultState, maxResults } = opts ?? {};

        const reqArr = rapidIds.map((rapidId) => this.$jaCache.session.getPromise(`rapidSprintList${rapidId}_${state || defaultState}_${maxResults}`)
            .then(async (value) => {
                if (value) {
                    return value;
                }
                let result;
                try {
                    let startAt = 0, maxLoop = 15;
                    let data = null;

                    do {
                        data = await this.$ajax.get(ApiUrls.sprintListByBoard, rapidId, startAt, state || defaultState, maxResults || 50);
                        startAt = data.maxResults + data.startAt;

                        // Avoid showing sprints of other boards.
                        // This can happen if a project contains stories which is assigned with sprint of other project
                        data.values = data.values.filter(s => !s.originBoardId || s.originBoardId === parseInt(rapidId));

                        if (!result) { result = data; }
                        else {
                            result.values.push(...data.values);
                        }
                        // eslint-disable-next-line no-unmodified-loop-condition
                    } while (!data.isLast && (!maxResults || result.values.length < maxResults) && --maxLoop > 0);
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

    async getSprintProperty(sprintId, propertyKey) {
        try {
            const result = await this.$ajax.get(ApiUrls.getSprintProperty.format(sprintId, propertyKey));
            return result?.value;
        } catch (err) {
            if (!err.error?.errorMessages?.[0]?.includes("does not exist")) {
                console.error(`Failed to fetch property ${propertyKey} for sprint ${sprintId}:`, err);
            }
            return null;
        }
    }

    getSprintIssues(sprintIds, options) {
        const { worklogStartDate, worklogEndDate, includeRemoved, boardId, ...opts } = options || {};

        const worker = async (sprintId) => {
            const { issues } = await this.$ajax.get(ApiUrls.getSprintIssues.format(sprintId), opts);

            if (includeRemoved) {
                await this.addRemovedIssuesToList(boardId, sprintId, issues, options?.fields, opts.jql);
            }

            if (options?.fields?.indexOf("worklog") > -1) {
                await this.fillMissingWorklogs(issues, worklogStartDate, worklogEndDate);
            }

            return issues.sortBy(t => parseInt(t.id));
        };


        if (!Array.isArray(sprintIds)) {
            return worker(sprintIds);
        } else {
            return new FeedbackPromise(async (resolve, _, progress) => {
                const sprints = {};
                const total = sprintIds.length;
                let completed = 0;
                await runOnQueue(sprintIds, 3, async (id) => {
                    sprints[id] = await worker(id, progress);
                    completed++;
                    progress(completed * 100 / total);
                });

                resolve(sprints);
            });
        }
    }

    // Based on internal API, try to find the list of removed issues part of sprint
    async getRemovedIssuesWithStoryPointForSprint(boardId, sprintId) {
        const details = await this.getRapidSprintDetails(boardId, sprintId);
        const addedLater = details?.contents?.issueKeysAddedDuringSprint || {};

        const getIssueObject = (issues, issueMap) => issues?.reduce((map, t) => {
            if (addedLater[t.key]) { return map; }

            const sp = t?.estimateStatistic?.statFieldValue?.value || 0;
            map[t.key] = { sp };
            return map;
        }, issueMap || {}) ?? {};

        let result = getIssueObject(details?.contents?.completedIssues);
        result = getIssueObject(details?.contents?.issuesNotCompletedInCurrentSprint, result);
        result = getIssueObject(details?.contents?.issuesCompletedInAnotherSprint, result);
        result = getIssueObject(details?.contents?.puntedIssues, result);

        return result;
    }

    async addRemovedIssuesToList(boardId, sprintId, issues, fieldsList, optsJql) {
        try { // if includeRemoved is true, then fetch removed issues based on custom properties added in sprint and add them to the list
            const issuesMapAtTheBeginningOfSprint = isPluginBuild ?
                await this.getSprintProperty(sprintId, 'jaSprintStartInfo') // If currently running as plugin, then issues list is stored in property
                : await this.getRemovedIssuesWithStoryPointForSprint(boardId, sprintId); // For extension/web users, get the details by calling internal reports api

            if (issuesMapAtTheBeginningOfSprint) {
                const allIssueKeys = Object.keys(issuesMapAtTheBeginningOfSprint);

                if (!allIssueKeys.length) { return; }

                const removedIssueKeys = allIssueKeys.filter(key => !issues.some(t => t.key === key)); // Remove all the issues which is already part of list

                if (removedIssueKeys.length) {
                    let jql = `key in (${removedIssueKeys.join(',')})`;

                    if (optsJql) {
                        jql = `(${optsJql}) AND (${jql})`;
                    }

                    const closedTickets = await this.searchTickets(jql, fieldsList, 0, { ignoreErrors: true });
                    closedTickets.forEach(t => t.removedFromSprint = true); // Set the removed from sprint flag to true
                    if (closedTickets?.length) {
                        issues.push(...closedTickets);
                    }
                }

                issues.forEach(t => {
                    const issueValue = issuesMapAtTheBeginningOfSprint[t.key];
                    if (issueValue && "sp" in issueValue) {
                        t.initialStoryPoints = parseFloat(issueValue.sp) || 0;
                    }
                });
            }
        } catch (e) {
            console.error("Error trying to retrieve removed issues for sprint", sprintId, e);
        }
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

    lookupIssues = async (query, options) => {
        const currentJQL = this.$session.CurrentUser.suggestionJQL || '';
        const url = prepareUrlWithQueryString(ApiUrls.searchIssueForPicker, {
            currentJQL,
            ...options,
            query,
            showSubTasks: true
        });

        const { sections } = await this.$ajax.get(url);
        const root = this.$session.CurrentUser.jiraUrl?.clearEnd('/');
        const labels = { hs: 'Recent issues', cs: 'Other issues' };
        const added = {};
        sections.forEach(s => {
            s.label = labels[s.id] || s.label;

            s.issues = s.issues.map(issue => {
                if (added[issue.key]) {
                    return null;
                }

                added[issue.key] = true;

                issue.root = root;
                if (issue.img) {
                    issue.img = mergeUrl(root, issue.img);
                    issue.url = viewIssueUrl(root, issue.key);
                }

                return issue;
            }).filter(Boolean);
        });

        return sections.filter(s => s.issues?.length);
    };

    async searchIssueForPicker(query, options) {
        const result = await this.lookupIssues(query, options);

        if (result.length === 1) {
            return result[0].issues;
        } else if (result.length > 1) {
            return result.reduce((all, cur) => {
                if (!all) {
                    return cur.issues;
                } else {
                    return all.concat(...cur.issues);
                }
            }, null);
        }

        return [];
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

    async getBulkIssueChangelogs(issueIdsOrKeys, fieldIds) {
        try {
            const { issueChangeLogs } = await this.$ajax.post(ApiUrls.bulkIssueChangelogs, {
                maxResults: 10000,
                issueIdsOrKeys,
                fieldIds
            });

            return issueChangeLogs.reduce((obj, item) => {
                obj[item.issueId] = item.changeHistories.sortBy(ch => ch.created).flatMap(({ items, ...ch }) => items.map(i => ({ ...ch, ...i })));
                return obj;
            }, {});
        } catch (err) {
            console.error("Unable to fetch changelogs for tickets: ", err);
        }
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
        const queue = new Queue({ results: [] });
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