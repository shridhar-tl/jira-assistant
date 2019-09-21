import { ApiUrls, DummyWLId } from '../_constants';
import * as moment from 'moment';

export default class JiraService {
    static dependencies = ["AjaxService", "CacheService", "MessageService", "SessionService"];

    constructor($ajax, $jaCache, $message, $session) {
        this.$ajax = $ajax;
        this.$jaCache = $jaCache;
        this.$message = $message;
        this.$session = $session;
        this.runningRequests = {};
    }

    searchTickets(jql, fields, startAt) {
        startAt = startAt || 0;
        return new Promise((resolve, reject) => {
            const postData = { jql: jql, fields: fields, maxResults: 1000 };
            if (startAt > 0) {
                postData.startAt = startAt;
            }
            this.$ajax.post(ApiUrls.search, postData)
                .then((result) => {
                    const issues = result.issues;
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
                                this.fillWorklogs(isus, cback);
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
                    const messages = (err.error || {}).errorMessages;
                    if (messages && messages.length > 0) {
                        this.$message.error(messages.join('<br/>'), "Error fetching ticket details");
                    }
                    reject(err);
                });
        }).then((result) => {
            const issues = result.issues;
            if ((issues.length + result.startAt) < result.total && issues.length > 0) {
                return this.searchTickets(jql, fields, result.startAt + issues.length).then(res => issues.addRange(res));
            }
            else {
                return issues;
            }
        });
    }

    getWorklogs(jiraKey) {
        return this.$ajax.get(ApiUrls.issueWorklog, jiraKey);
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

        result = await this.$ajax.get(ApiUrls.rapidViews);
        result = result.views;

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
                return this.$ajax.get(ApiUrls.getProjectImportMetadata + projectsToPull.join(","))
                    .then((metadata) => {
                        result = metadata.projects.reduce((r, prj) => {
                            r[prj.key] = prj;
                            return r;
                        }, {});

                        success(onlyOne ? result[projects[0]] : result);
                    }, fail);
            }
        });
    }

    getIssueMetadata(issuekey) {
        return this.$ajax.get(ApiUrls.getIssueMetadata, issuekey);
    }

    createIssue(issue) {
        return this.$ajax.post(ApiUrls.getIssue, { fields: issue });
    }

    bulkImportIssues(issueUpdates) {
        return this.$ajax.post(ApiUrls.bulkImportIssue, { issueUpdates });
    }

    updateIssue(key, issue) {
        return this.$ajax.put(ApiUrls.individualIssue, issue, key);
    }

    getRapidSprintList(rapidIds) {
        const reqArr = rapidIds.map((rapidId) => {
            return this.$jaCache.session.getPromise(`rapidSprintList${rapidId}`).then((value) => {
                if (value) {
                    return value;
                }
                return this.$ajax.get(ApiUrls.rapidSprintList, rapidId)
                    .then((result) => {
                        const sprints = result.sprints;
                        sprints.forEach((sp) => { sp.rapidId = rapidId; });
                        this.$jaCache.session.set(`rapidSprintList${rapidId}`, sprints, 10);
                        return sprints;
                    });
            });
        });
        return Promise.all(reqArr).then((results) => { return results.union(); });
    }

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

    getOpenTickets(refresh) {
        if (!refresh) {
            const value = this.$jaCache.session.get("myOpenTickets");
            if (value) {
                return new Promise(resolve => resolve(value));
            }
        }
        return this.searchTickets("assignee=currentUser() AND resolution=Unresolved and status != Closed", ["issuetype", "summary", "reporter", "priority", "status", "resolution", "created", "updated"])
            .then((result) => { this.$jaCache.session.set("myOpenTickets", result); return result; });
    }

    searchUsers(text, maxResult = 10, startAt = 0) { return this.$ajax.get(ApiUrls.searchUser, text, maxResult, startAt); }

    fillWorklogs(issues, callback) {
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
            this.fillWL(issues[i]).then(onSuccess);
        }
        if (issues.length === 0) {
            callback(issues.length);
        }
    }

    fillWL(issue) {
        console.log(`Started fetching worklog for ${issue.key}`);
        return this.getWorklogs(issue.key).then((res) => {
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

        return this.fetchCachedData(keyName, () => {
            return this.$ajax.get(ApiUrls.getUserDetails, username)
                .then((user) => { this.$jaCache.session.set(keyName, user, 10); return user; }, this.jiraErrorHandler);
        });
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
    }

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
