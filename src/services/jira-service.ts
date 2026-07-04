import { mergeUrl, orderBy, parseISOString, prepareUrlWithQueryString, sortBy, stringifyComment, viewIssueUrl, waitFor } from '@utils';

import { ApiUrls, defaultJiraFields, defaultSettings, DummyWLId, isPluginBuild } from '@constants';

import type AjaxService from './ajax-service';
import type CacheService from './cache-service';
import type MessageService from './message-service';
import type SessionService from './session-service';

export interface JiraUser {
    accountId?: string;
    name?: string;
    displayName?: string;
    emailAddress?: string;
    avatarUrls?: Record<string, string>;
    active?: boolean;
}

export default class JiraService {
    static dependencies = ['AjaxService', 'CacheService', 'MessageService', 'SessionService'];

    private $ajax: AjaxService;
    private $jaCache: CacheService;
    private $message: MessageService;
    private $session: SessionService;
    private runningRequests: Record<string, Promise<any>>;

    constructor($ajax: AjaxService, $jaCache: CacheService, $message: MessageService, $session: SessionService) {
        this.$ajax = $ajax;
        this.$jaCache = $jaCache;
        this.$message = $message;
        this.$session = $session;
        this.runningRequests = {};
    }

    async searchTickets(
        jql: string,
        fields?: string[],
        nextPageToken?: string,
        opts?: {
            maxResults?: number;
            expand?: string[];
            worklogStartDate?: Date;
            worklogEndDate?: Date;
            ignoreWarnings?: boolean;
            ignoreErrors?: boolean;
        },
    ): Promise<any[]> {
        const fieldsToUse = fields || defaultJiraFields;
        const { worklogStartDate, worklogEndDate } = opts || {};

        try {
            const postData: any = {
                jql,
                fields: fieldsToUse,
                maxResults: opts?.maxResults || 1000,
            };

            if (opts?.expand?.length) {
                postData.expand = opts.expand;
            }

            if (nextPageToken) {
                postData.nextPageToken = nextPageToken;
            }

            const result = await this.$ajax.get(prepareUrlWithQueryString(ApiUrls.search, postData));

            const issues = result.issues || [];

            if (opts?.ignoreWarnings !== true) {
                if (result.warningMessages?.length) {
                    const msg = result.warningMessages.join('\r\n');
                    this.$message.warning(msg, 'Query Error');
                }
            }

            // Process worklog comments
            if (fieldsToUse.includes('worklog')) {
                await this.validateForWorklogs(issues, worklogStartDate, worklogEndDate);
            }

            // Handle pagination using v3 API tokens
            if (!opts?.maxResults && result.nextPageToken && !result.isLast && issues.length > 0) {
                const nextResults = await this.searchTickets(jql, fieldsToUse, result.nextPageToken, opts);
                issues.push(...nextResults);
            }

            return issues;
        } catch (err: any) {
            if (!nextPageToken) {
                // Fallback to v2 only for the failure in first call
                console.error('JQL v3 search failed. Fallback to v2 search', err);
                return this.searchTicketsFallback_V2(jql, fieldsToUse, undefined, opts);
            }

            if (opts?.ignoreErrors !== true) {
                const messages = err.error?.errorMessages;
                if (messages?.length > 0) {
                    this.$message.error(messages.join('<br/>'), 'Error fetching ticket details');
                }
            }
            throw err;
        }
    }

    /**
     * Search for issues using JQL (v2 API fallback)
     * This function can be deleted after all Jira instances support v3 API
     */
    async searchTicketsFallback_V2(
        jql: string,
        fields?: string[],
        startAt?: number,
        opts?: {
            maxResults?: number;
            expand?: string[];
            worklogStartDate?: Date;
            worklogEndDate?: Date;
            ignoreWarnings?: boolean;
            ignoreErrors?: boolean;
        },
    ): Promise<any[]> {
        const startAtValue = startAt || 0;
        const fieldsToUse = fields || defaultJiraFields;
        const { worklogStartDate, worklogEndDate } = opts || {};

        const postData: any = {
            jql,
            fields: fieldsToUse,
            maxResults: opts?.maxResults || 1000,
        };

        if (opts?.expand?.length) {
            postData.expand = opts.expand;
        }

        if (startAtValue > 0) {
            postData.startAt = startAtValue;
        }

        try {
            const result = await this.$ajax.get(prepareUrlWithQueryString(ApiUrls.searchLegacyV2, postData));
            const issues = result.issues || [];
            const total = result.total;

            if (opts?.ignoreWarnings !== true) {
                if (result.warningMessages?.length) {
                    const msg = result.warningMessages.join('\r\n');
                    this.$message.warning(msg, 'Query Error');
                }
            }

            if (fieldsToUse.includes('worklog')) {
                await this.validateForWorklogs(issues, worklogStartDate, worklogEndDate);
            }

            // Handle pagination
            if (!opts?.maxResults && issues.length + startAtValue < total && issues.length > 0) {
                const nextResults = await this.searchTicketsFallback_V2(jql, fieldsToUse, startAtValue + issues.length, opts);
                issues.push(...nextResults);
            }

            return issues;
        } catch (err: any) {
            if (opts?.ignoreErrors !== true) {
                const messages = err.error?.errorMessages;
                if (messages?.length > 0) {
                    this.$message.error(messages.join('<br/>'), 'Error fetching ticket details');
                }
            }
            throw err;
        }
    }

    async validateForWorklogs(issues: any[], worklogStartDate?: Date, worklogEndDate?: Date): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            let prevCount = issues.length;
            let retryCount = 3;

            const callback = (remaining: number | false, isus?: any[]) => {
                if (remaining === 0) {
                    resolve();
                } else if (remaining === false || prevCount > remaining || --retryCount >= 0) {
                    prevCount = remaining as number;
                    this.fillWorklogs(isus || issues, worklogStartDate, worklogEndDate, callback);
                } else {
                    reject(null);
                }
            };

            callback(false, issues);
            retryCount = 3;
        });

        // Stringify worklog comments
        issues.forEach((issue) => {
            const worklogs = issue.fields?.worklog?.worklogs;
            if (Array.isArray(worklogs) && worklogs.length) {
                worklogs.forEach((w: any) => {
                    w.comment = stringifyComment(w.comment);
                });
            }
        });
    }

    getWorklogs(jiraKey: string, startDate?: Date, endDate?: Date): Promise<any> {
        const url = this.$ajax.prepareUrl(ApiUrls.issueWorklog, [jiraKey]);

        const reqObj: any = {
            maxResults: 5000,
            startAt: 0,
        };

        const threshold = 24 * 60 * 60 * 1000; // 24 hours threshold to avoid timezone issues

        if (startDate && startDate instanceof Date) {
            reqObj.startedAfter = startDate.getTime() - threshold;
        }

        if (endDate && endDate instanceof Date) {
            reqObj.startedBefore = endDate.getTime() + threshold;
        }

        return this.$ajax.get(url, reqObj);
    }

    async getJQLAutocomplete(): Promise<any> {
        let result = await this.$jaCache.session.getPromise('jql_autocomplete');

        if (result) {
            return result;
        }

        result = await this.$ajax.get(ApiUrls.getJQLAutocomplete);

        this.$jaCache.session.set('jql_autocomplete', result);

        return result;
    }

    async getJQLSuggestions(fieldName: string, fieldValue: string): Promise<any> {
        return await this.$ajax.get(ApiUrls.getJQLSuggestions, { fieldName, fieldValue });
    }

    async getCustomFields(): Promise<any[]> {
        let result = await this.$jaCache.session.getPromise('customFields');

        if (result) {
            return result;
        }

        result = await this.$ajax.get(ApiUrls.getCustomFields);

        // Add custom "Issue Age" field
        const createdFieldIndex = result.findIndex((f: any) => f.id === 'created');
        if (createdFieldIndex > 0) {
            const createdField = result[createdFieldIndex];
            const ageField = {
                ...createdField,
                custom: true,
                id: 'issueAge',
                name: 'Issue Age',
                schema: { type: 'ageindays' },
            };

            result.splice(createdFieldIndex + 1, 0, ageField);
        }

        this.$jaCache.session.set('customFields', result);

        return result;
    }

    async getRapidViews(): Promise<any[]> {
        let result = await this.$jaCache.session.getPromise('rapidViews');

        if (result) {
            return result;
        }

        try {
            let startAt = 0;
            let maxLoop = 10;
            let data: any = null;
            let combinedResult: any = null;

            do {
                data = await this.$ajax.get(`${ApiUrls.scrumBoards}&startAt=${encodeURIComponent(startAt)}`);
                startAt = data.maxResults + data.startAt;

                if (!combinedResult) {
                    combinedResult = data;
                } else {
                    combinedResult.values.push(...data.values);
                }
            } while (data.total > startAt && --maxLoop > 0);

            result = combinedResult;
        } catch (err) {
            console.warn('Getting board list failed. Trying alternate option', err);
            result = await this.$ajax.get(ApiUrls.rapidViews);
        }

        result = result.views || result.values;

        this.$jaCache.session.set('rapidViews', result);

        return result;
    }

    async getBoardConfig(boardId: string | number): Promise<any> {
        let result = await this.$jaCache.session.getPromise(`boardConfig_${boardId}`);

        if (result) {
            return result;
        }

        result = await this.$ajax.get(ApiUrls.scrumBoardConfig, boardId);

        this.$jaCache.session.set(`boardConfig_${boardId}`, result);

        return result;
    }

    getProjects(): Promise<any[]> {
        const value = this.$jaCache.session.get('projects');
        if (value) {
            return Promise.resolve(value);
        }

        return this.$ajax.get(ApiUrls.getAllProjects).then((projects: any) => {
            this.$jaCache.session.set('projects', projects);
            return projects;
        });
    }

    getIssueTypes(): Promise<any[]> {
        const value = this.$jaCache.session.get('issuetypes');
        if (value) {
            return Promise.resolve(value);
        }

        return this.$ajax.get(ApiUrls.getAllIssueTypes).then((issuetypes: any) => {
            this.$jaCache.session.set('issuetypes', issuetypes);
            return issuetypes;
        });
    }

    getProjectImportMetadata(projects: string | string[]): Promise<any> {
        let onlyOne = false;
        let projectList: string[];

        if (typeof projects === 'string') {
            projectList = [projects];
            onlyOne = true;
        } else {
            projectList = projects;
        }

        projectList = projectList.map((p: any) => p.toUpperCase());

        return new Promise((resolve, reject) => {
            let result: any = {};
            const projectsToPull: string[] = [];

            projectList.forEach((p: any) => {
                const project = this.$jaCache.session.get(`projectMetadata_${p}`);
                if (project) {
                    result[p] = project;
                } else {
                    projectsToPull.push(p);
                }
            });

            if (projectsToPull.length === 0) {
                resolve(onlyOne ? result[projectList[0]] : result);
            } else {
                this.$ajax.get(ApiUrls.getProjectImportMetadata + encodeURIComponent(projectsToPull.join(','))).then((metadata: any) => {
                    result = metadata.projects.reduce((r: any, prj: any) => {
                        prj.issuetypesObj = prj.issuetypes.reduce((types: any, type: any) => {
                            types[type.name.toLowerCase().replace(/ /g, '-')] = type;
                            return types;
                        }, {});
                        r[prj.key] = prj;
                        return r;
                    }, {});

                    resolve(onlyOne ? result[projectList[0]] : result);
                }, reject);
            }
        });
    }

    async getProjectStatuses(projects: string | string[]): Promise<any> {
        let onlyOne = false;
        let projectList: string[];

        if (typeof projects === 'string') {
            projectList = [projects];
            onlyOne = true;
        } else {
            projectList = projects;
        }

        projectList = projectList.map((p: any) => p.toUpperCase());

        const result = await Promise.all(
            projectList.map(async (p: any) => {
                const cacheKey = `projectStatuses_${p}`;
                let project = this.$jaCache.session.get(cacheKey);

                if (!project) {
                    project = await this.$ajax.get(ApiUrls.getProjectStatuses, p);
                    this.$jaCache.session.set(cacheKey, project);
                }

                return project;
            }),
        );

        return onlyOne ? result[0] : result;
    }

    async getJiraStatuses(): Promise<any[]> {
        const cacheKey = 'jiraStatuses';
        let statuses = this.$jaCache.session.get(cacheKey);

        if (!statuses) {
            statuses = await this.$ajax.get(ApiUrls.getJiraStatuses);
            this.$jaCache.session.set(cacheKey, statuses);
        }

        return statuses;
    }

    async getIssueMetadata(issuekey: string): Promise<any> {
        let value = await this.$jaCache.session.getPromise(`issueMetadata_${issuekey}`);
        if (value) {
            return value;
        }

        value = await this.$ajax.get(ApiUrls.getIssueMetadata, issuekey);
        this.$jaCache.session.set(`issueMetadata_${issuekey}`, value);

        return value;
    }

    createIssue(issue: any): Promise<any> {
        return this.$ajax.post(ApiUrls.createIssue, { fields: issue });
    }

    async cloneIssue(key: string, summary: string, fields?: any): Promise<any> {
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

    deleteIssue(issuekey: string): Promise<any> {
        return this.$ajax.delete(ApiUrls.individualIssue, issuekey);
    }

    bulkImportIssues(issueUpdates: any[]): Promise<any> {
        return this.$ajax.post(ApiUrls.bulkImportIssue, { issueUpdates });
    }

    updateIssue(key: string, issue: any): Promise<any> {
        return this.$ajax.put(ApiUrls.individualIssue, issue, key);
    }

    getRapidSprintList = (
        rapidIds: (number | string)[],
        opts?: boolean | { state?: string; maxResults?: number },
    ): Promise<any[] | Record<number, any[]>> => {
        const asObj = typeof opts === 'boolean' ? opts : false;
        const defaultState = 'active,closed';
        const { state = defaultState, maxResults } = (typeof opts === 'object' ? opts : {}) || {};

        const reqArr = rapidIds.map((rapidId) =>
            this.$jaCache.session
                .getPromise(`rapidSprintList${rapidId}_${state || defaultState}_${maxResults || ''}`)
                .then(async (value) => {
                    if (value) {
                        return value;
                    }

                    let result: any;
                    try {
                        let startAt = 0;
                        let maxLoop = 15;
                        let data: any = null;

                        do {
                            data = await this.$ajax.get(
                                ApiUrls.sprintListByBoard,
                                rapidId,
                                startAt,
                                state || defaultState,
                                maxResults || 50,
                            );
                            startAt = data.maxResults + data.startAt;

                            // Avoid showing sprints of other boards
                            data.values = data.values.filter((s: any) => !s.originBoardId || s.originBoardId === parseInt(String(rapidId)));

                            if (!result) {
                                result = data;
                            } else {
                                result.values.push(...data.values);
                            }
                        } while (!data.isLast && (!maxResults || result.values.length < maxResults) && --maxLoop > 0);
                    } catch (err) {
                        console.warn('Getting rapid sprint list failed. Using alternate api.', err);
                        result = await this.$ajax.get(ApiUrls.rapidSprintList, rapidId);
                    }

                    let sprints = result.sprints || result.values;

                    sprints.forEach((sp: any) => {
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

                    // Sort sprints in descending order by start date
                    sprints = sortBy(sprints, (s: any) => s.startDate?.getTime(), true);

                    // Assign prev and next sprint start & end dates
                    let prevSprint: any = null;
                    sprints.forEach((cur: any) => {
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

                    this.$jaCache.session.set(`rapidSprintList${rapidId}`, sprints);

                    return sprints;
                }),
        );

        return Promise.all(reqArr).then((results) =>
            asObj
                ? rapidIds.reduce(
                      (obj, bid, i) => {
                          obj[Number(bid)] = results[i];
                          return obj;
                      },
                      {} as Record<number, any[]>,
                  )
                : results.flat(),
        );
    };

    getSprintList(projects: string | string[]): Promise<any[]> {
        let projectsStr: string;
        if (Array.isArray(projects)) {
            projectsStr = projects.join();
        } else {
            projectsStr = projects;
        }

        return this.$jaCache.session.getPromise(`sprintListAll${projectsStr}`).then((value) => {
            if (value) {
                return value;
            }

            return this.$ajax.get(ApiUrls.sprintListAll, projectsStr).then((result: any) => {
                this.$jaCache.session.set(`sprintListAll${projectsStr}`, result.sprints);
                return result.sprints;
            });
        });
    }

    getRapidSprintDetails(rapidViewId: number, sprintId: number): Promise<any> {
        return this.$ajax.get(ApiUrls.rapidSprintDetails, rapidViewId, sprintId);
    }

    async getSprintProperty(sprintId: number, propertyKey: string): Promise<any> {
        try {
            const url = ApiUrls.getSprintProperty.replace('{0}', String(sprintId)).replace('{1}', propertyKey);
            const result = await this.$ajax.get(url);
            return result?.value;
        } catch (err: any) {
            if (!err.error?.errorMessages?.[0]?.includes('does not exist')) {
                console.error(`Failed to fetch property ${propertyKey} for sprint ${sprintId}:`, err);
            }
            return null;
        }
    }

    getSprintIssues(
        sprintIds: number | number[],
        options?: {
            worklogStartDate?: Date;
            worklogEndDate?: Date;
            includeRemoved?: boolean;
            boardId?: number;
            fields?: string[];
            jql?: string;
            [key: string]: any;
        },
    ): Promise<any[] | Record<number, any[]>> | any {
        const { worklogStartDate, worklogEndDate, includeRemoved, boardId, ...opts } = options || {};

        const worker = async (sprintId: number, progress?: (percent: number) => void) => {
            const url = ApiUrls.getSprintIssues.replace('{0}', String(sprintId));
            const { issues } = await this.$ajax.get(url, opts);

            if (includeRemoved) {
                await this.addRemovedIssuesToList(boardId!, sprintId, issues, options?.fields, opts.jql);
            }

            if (options?.fields?.includes('worklog')) {
                await this.fillMissingWorklogs(issues, worklogStartDate, worklogEndDate);
            }

            return orderBy(issues, (t: any) => parseInt(t.id));
        };

        if (!Array.isArray(sprintIds)) {
            return worker(sprintIds);
        } else {
            const FeedbackPromise = (
                executor: (resolve: (value: any) => void, reject: (reason?: any) => void, progress: (percent: number) => void) => void,
            ) => {
                let progressCallback: ((percent: number) => void) | undefined;
                const promise = new Promise((resolve, reject) => {
                    executor(resolve, reject, (percent: number) => {
                        if (progressCallback) progressCallback(percent);
                    });
                });
                (promise as any).progress = (callback: (percent: number) => void) => {
                    progressCallback = callback;
                    return promise;
                };
                return promise;
            };

            return FeedbackPromise(async (resolve, _, progress) => {
                const sprints: Record<number, any[]> = {};
                const total = sprintIds.length;
                let completed = 0;
                await this.runOnQueue(sprintIds, 3, async (id: number) => {
                    sprints[id] = await worker(id, progress);
                    completed++;
                    progress((completed * 100) / total);
                });
                resolve(sprints);
            });
        }
    }

    /**
     * Get removed issues with story points for sprint (internal API)
     */
    async getRemovedIssuesWithStoryPointForSprint(boardId: number, sprintId: number): Promise<Record<string, { sp: number }>> {
        const details = await this.getRapidSprintDetails(boardId, sprintId);
        const addedLater = details?.contents?.issueKeysAddedDuringSprint || {};

        const getIssueObject = (issues: any[], issueMap?: Record<string, { sp: number }>) =>
            issues?.reduce((map, t) => {
                if (addedLater[t.key]) {
                    return map;
                }

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

    async addRemovedIssuesToList(boardId: number, sprintId: number, issues: any[], fieldsList?: string[], optsJql?: string): Promise<void> {
        try {
            const issuesMapAtTheBeginningOfSprint = isPluginBuild
                ? await this.getSprintProperty(sprintId, 'jaSprintStartInfo')
                : await this.getRemovedIssuesWithStoryPointForSprint(boardId, sprintId);

            if (issuesMapAtTheBeginningOfSprint) {
                const allIssueKeys = Object.keys(issuesMapAtTheBeginningOfSprint);

                if (!allIssueKeys.length) {
                    return;
                }

                const removedIssueKeys = allIssueKeys.filter((key) => !issues.some((t: any) => t.key === key));

                if (removedIssueKeys.length) {
                    let jql = `key in (${removedIssueKeys.join(',')})`;

                    if (optsJql) {
                        jql = `(${optsJql}) AND (${jql})`;
                    }

                    const closedTickets = await this.searchTickets(jql, fieldsList, undefined, {
                        ignoreErrors: true,
                    });
                    closedTickets.forEach((t: any) => (t.removedFromSprint = true));
                    if (closedTickets?.length) {
                        issues.push(...closedTickets);
                    }
                }

                issues.forEach((t: any) => {
                    const issueValue = issuesMapAtTheBeginningOfSprint[t.key];
                    if (issueValue && 'sp' in issueValue) {
                        t.initialStoryPoints = parseFloat(String(issueValue.sp)) || 0;
                    }
                });
            }
        } catch (e) {
            console.error('Error trying to retrieve removed issues for sprint', sprintId, e);
        }
    }

    getOpenTickets(refresh?: boolean): Promise<any[]> {
        if (!refresh) {
            const value = this.$jaCache.session.get('myOpenTickets');
            if (value) {
                return Promise.resolve(value);
            }
        }

        const jql = this.$session.CurrentUser.openTicketsJQL || defaultSettings.openTicketsJQL;

        return this.searchTickets(jql, defaultJiraFields).then((result) => {
            this.$jaCache.session.set('myOpenTickets', result);
            return result;
        });
    }

    lookupIssues = async (query: string, options?: Record<string, any>): Promise<any[]> => {
        const currentJQL = this.$session.CurrentUser.suggestionJQL || '';
        const url = prepareUrlWithQueryString(ApiUrls.searchIssueForPicker, {
            currentJQL,
            ...options,
            query,
            showSubTasks: true,
        });

        const { sections } = await this.$ajax.get(url);
        const root = this.$session.CurrentUser.jiraUrl?.replace(/\/+$/, '') || '';
        const labels: Record<string, string> = { hs: 'Recent issues', cs: 'Other issues' };
        const added: Record<string, boolean> = {};

        sections.forEach((s: any) => {
            s.label = labels[s.id] || s.label;

            s.issues = s.issues
                .map((issue: any) => {
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
                })
                .filter(Boolean);
        });

        return sections.filter((s: any) => s.issues?.length);
    };

    async searchIssueForPicker(query: string, options?: Record<string, any>): Promise<any[]> {
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

    async searchUsers(text: string, maxResult = 10, startAt = 0): Promise<any[]> {
        let result = null;

        try {
            result = await this.$ajax.get(ApiUrls.searchUser, text, maxResult, startAt);
        } catch (err) {
            console.warn('User search failed. Using alternate search mechanism.', err);
            result = await this.$ajax.get(ApiUrls.searchUser_Alt, text, maxResult, startAt);
        }

        return result;
    }

    async searchGroups(text: string, maxResult = 10): Promise<any[]> {
        const result = await this.$ajax.get(ApiUrls.searchGroup, text, maxResult);
        return result?.groups;
    }

    async getGroupMembers(groupId: string, maxResult = 50): Promise<any[]> {
        const users = this.$jaCache.session.get(`JiraGroup_${groupId}_Users`);
        if (users) {
            return Promise.resolve(users);
        }

        const result = await this.$ajax.get(ApiUrls.getGroupMembers, groupId, maxResult);
        return result?.values;
    }

    fillWorklogs(issues: any[], startDate?: Date, endDate?: Date, callback?: (remaining: number, issues: any[]) => void): void {
        const issuesToFill = issues.filter(
            (iss) => !iss.fields?.worklog || (iss.fields.worklog.worklogs || []).length < iss.fields.worklog.total,
        );

        let pendCount = Math.min(issuesToFill.length, 3);
        let successCount = 0;

        console.log(`FillStarted:- ${issuesToFill.length} tickets found`);

        const onSuccess = (res: boolean) => {
            if (res) {
                successCount++;
            }

            if (--pendCount === 0) {
                callback?.(issuesToFill.length - successCount, issues);
            }
        };

        for (let i = 0; i < pendCount; i++) {
            this.fillWL(issuesToFill[i], startDate, endDate).then(onSuccess);
        }

        if (issuesToFill.length === 0) {
            callback?.(issuesToFill.length, issues);
        }
    }

    async fillMissingWorklogs(issues: any[], startDate?: Date, endDate?: Date): Promise<void> {
        const issuesToFill = issues.filter(
            (iss) => !iss.fields?.worklog || iss.fields?.worklog?.worklogs?.length < iss.fields?.worklog?.total,
        );

        await this.runOnQueue(issuesToFill, 3, async (issue: any) => {
            const res = await this.getWorklogs(issue.key, startDate, endDate);
            console.log(`Success fetching worklog for ${issue.key}`);

            if (!issue.fields) {
                issue.fields = {};
            }

            issue.fields.worklog = res;
        });
    }

    async getBulkIssueChangelogs(issueIdsOrKeys: string[], fieldIds?: string[]): Promise<Record<string, any[]>> {
        try {
            const { issueChangeLogs } = await this.$ajax.post(ApiUrls.bulkIssueChangelogs, {
                maxResults: 10000,
                issueIdsOrKeys,
                fieldIds,
            });

            return issueChangeLogs.reduce((obj: any, item: any) => {
                obj[item.issueId] = orderBy(item.changeHistories, (ch: any) => ch.created).flatMap(({ items, ...ch }: any) =>
                    items.map((i: any) => ({ ...ch, ...i })),
                );
                return obj;
            }, {});
        } catch (err) {
            console.error('Unable to fetch changelogs for tickets: ', err);
            return {};
        }
    }

    fillWL(issue: any, startDate?: Date, endDate?: Date): Promise<boolean> {
        console.log(`Started fetching worklog for ${issue.key} between ${startDate} & ${endDate}`);
        return this.getWorklogs(issue.key, startDate, endDate).then(
            (res) => {
                console.log(`Success fetching worklog for ${issue.key}`);
                if (!issue.fields) {
                    issue.fields = {};
                }
                issue.fields.worklog = res;
                return true;
            },
            () => {
                console.log(`Failed fetching worklog for ${issue.key}`);
                return false;
            },
        );
    }

    getUserDetails(username: string): Promise<any> {
        const keyName = `userdetail_${username}`;

        return this.fetchCachedData(keyName, () =>
            this.$ajax.get(ApiUrls.getUserDetails, username).then((user: any) => {
                this.$jaCache.session.set(keyName, user);
                return user;
            }, this.jiraErrorHandler),
        );
    }

    async fetchCachedData(keyName: string, http: () => Promise<any>): Promise<any> {
        const value = this.getCachedData(keyName);
        if (value) {
            return value;
        }

        const runningRequest = this.runningRequests[keyName];

        if (runningRequest) {
            await runningRequest;
            return this.getCachedData(keyName);
        }

        const request = http();
        this.runningRequests[keyName] = request;
        return request;
    }

    getCachedData(keyName: string): Promise<any> | undefined {
        const value = this.$jaCache.session.get(keyName);

        if (value) {
            return Promise.resolve(value);
        }
    }

    jiraErrorHandler = (e: any): Promise<never> => {
        if (e.status === 401) {
            this.$message.warning(
                'You must be authenticated in Jira to access this tool. Please authenticate in Jira and then retry.',
                'Unauthorized',
            );
        } else if (e.error && e.error.errorMessages) {
            this.$message.warning(e.error.errorMessages, 'Server error');
        } else {
            e = e.ref || e;
            this.$message.warning(`${e.status}:- ${e.statusText}`, 'Unknown error');
        }
        return Promise.reject(e);
    };

    getCurrentUser(): Promise<JiraUser> {
        return this.$ajax.get(ApiUrls.mySelf).then(null, this.jiraErrorHandler);
    }

    getJAWorklog(worklogId: number, ticketNo: string): Promise<any> {
        return this.getWorklog(worklogId, ticketNo).then((w: any) => {
            const mins = w.timeSpentSeconds / 60;
            const wl = {
                id: DummyWLId,
                createdBy: this.$session.CurrentUser.userId,
                dateStarted: parseISOString(w.started),
                description: w.comment,
                isUploaded: true,
                ticketNo: ticketNo,
                worklogId: Number(w.id),
                timeSpent: `${Math.floor(mins / 60)
                    .toString()
                    .padStart(2, '0')}:${Math.floor(mins % 60)
                    .toString()
                    .padStart(2, '0')}`,
            };
            return wl;
        });
    }

    getWorklog(worklogId: number, ticketNo: string): Promise<any> {
        return this.$ajax.get(ApiUrls.individualWorklog, ticketNo, worklogId);
    }

    private runOnQueue<T>(items: T[], concurrent: number, execute: (item: T) => Promise<void>): Promise<void> {
        return new Promise((resolve, reject) => {
            let running = 0;
            let index = 0;

            const processNext = async () => {
                if (index >= items.length && running === 0) {
                    resolve();
                    return;
                }

                while (running < concurrent && index < items.length) {
                    const item = items[index++];
                    running++;

                    execute(item)
                        .then(() => {
                            running--;
                            processNext();
                        })
                        .catch((err) => {
                            reject(err);
                        });
                }
            };

            processNext();
        });
    }
}
