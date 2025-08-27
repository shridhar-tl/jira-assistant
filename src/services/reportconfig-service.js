import React from 'react';
import { initReportBuilder } from '../components/ContextMenu';
import EventEmitter from 'events';
import { GadgetActionType } from '../gadgets/_constants';
import { getUserName } from '../common/utils';
import exec from '../common/jsExec';

export default class ReportConfigService {
    static dependencies = ["ReportService", "SessionService", "JiraService", "AjaxService", "UserGroup", "UserUtilsService", "BookmarkService"];

    constructor($report, $session, $jira, $http, $usergroup, $userutils, $bookmark) {
        this.$report = $report;
        this.$session = $session;
        this.$jira = $jira;
        this.$http = $http;
        this.$usergroup = $usergroup;
        this.$userutils = $userutils;
        this.$bookmark = $bookmark;

        this.parameters = new EventEmitter();
        this.eventPipe = new EventEmitter();
    }

    configureReport() {
        if (this.isConfigured) {
            return;
        }

        const selfHandleScriptExecution = true;

        const compiler = exec;

        const { dateFormat, timeFormat, jiraUrl } = this.$session.CurrentUser;
        const dateTimeFormat = `${dateFormat} ${timeFormat}`;

        const defaultConfig = {
            selfHandleScriptExecution, compiler,
            useExternalDnDProvider: false,
            customFunctions: !selfHandleScriptExecution,
            subReports: (defn) => this.$report.getReportsList().then((result) => {
                result = result.filter(q => q.advanced).map(q => ({ id: q.id, name: q.queryName }));
                if (defn && defn.id) {
                    result = result.filter(r => r.id !== defn.id);
                }
                return result;
            }),
            resolveReportDefinition: (reportId) => this.$report.getReportDefinition(reportId),
            resolveHttpRequest: (method, url, data, headers) => this.$http.request(method, url, data, headers),
            builtInFields: {
                UserDateFormat: { value: dateFormat, helpText: `Provides the date format of the current user (${dateFormat})` },
                UserTimeFormat: { value: timeFormat, helpText: `Provides the time format of the current user (${timeFormat})` },
                UserDateTimeFormat: { value: dateTimeFormat, helpText: `Provides the date time format of the current user (${dateTimeFormat})` },
                CurrentJiraRoot: { value: jiraUrl, helpText: `Returns Jira root url (${jiraUrl})` }
            },
            commonFunctions: {
                getUsersFromGroup: { value: (group) => { /*ToDo: Yet to implement */ } },
                getJiraIssueUrl: { value: this.$userutils.getTicketUrl },
                getUserProfileUrl: { value: this.$userutils.getProfileUrl },
                getUserProfileImageUrl: { value: this.$userutils.getProfileImgUrl },
                getTicketDetails: { value: (ticketsList, fields) => this.$report.fetchTicketDetails(ticketsList, fields) },
                executeJQL: { value: (jql, fields) => this.$jira.searchTickets(jql, fields) },
                getRapidSprintList: { value: (rapidIds) => this.$jira.getRapidSprintList(rapidIds) },
                getProjectSprintList: { value: (projects) => this.$jira.getSprintList(projects) },
                getRapidSprintDetails: { value: (rapidViewId, sprintId) => this.$jira.getRapidSprintDetails(rapidViewId, sprintId) },
                searchUsers: { value: (text, maxResult = 10, startAt = 0) => this.$jira.searchUsers(text, maxResult, startAt) },
                addWorklog: { value: (obj) => this.eventPipe.emit("addWorklog", typeof obj === "string" ? { ticketNo: obj } : obj) },
                getWorklogs: { value: (jiraKey, startDate, endDate) => this.$jira.getWorklogs(jiraKey, startDate, endDate) },
                getDays: { value: this.$userutils.getDays },
                isHoliday: { value: this.$userutils.isHoliday },
                bookmarkTicket: {
                    value: (jiraKey) => this.$bookmark.addBookmark([jiraKey]).then(() => {
                        this.eventPipe.emit("gadgetAction", GadgetActionType.TicketBookmarked);
                    })
                },
                formatDate: { value: this.$userutils.formatDate },
                formatTime: { value: this.$userutils.formatTime },
                formatDateTime: { value: this.$userutils.formatDateTime }
            }
        };
        initReportBuilder(defaultConfig);
        this.isConfigured = true;
    }

    getDatasetConfig(datasetTypes = {}) {
        return {
            JQL: {
                label: "JQL search result",
                resolveSchema: (datasetTypes.JQL || ((name, props, data) => new Promise((resolve, reject) => {
                    this.eventPipe.emit("resolveSchema_JQL", { name, props, data, schema: { resolve, reject } });
                }))),
                resolveData: (qry, parametersValues, { parameterTemplate }) => this.$jira.searchTickets(this.prepareJQL(qry.jql, parametersValues, parameterTemplate), qry.outputFields.map(f => f.id))
                    .then(this.processSearchData)
            },
            FLT: true,
            PLS: {
                label: "Project list", allowEdit: false,
                resolveSchema: (name, props, promise) => this.$jira.getProjects().then(p => { promise.resolve(p); return props; }),
                resolveData: props => this.$jira.getProjects()
            },
            ITL: {
                label: "Issue type list", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getIssueTypes().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => this.$jira.getIssueTypes()
            },
            OTL: {
                label: "My open tickets list", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getOpenTickets().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => this.$jira.getOpenTickets()
            },
            RPV: {
                label: "Rapid view list (sprint board list)", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getRapidViews().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => this.$jira.getRapidViews()
            },
            CUF: {
                label: "Custom fields list", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getCustomFields().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => this.$jira.getCustomFields()
            },
            EXP: true,
            HTP: true,
            FIL: true,
            STC: true
        };
    }

    getParameterTypesConfig() {
        let userGroups = null;
        return {
            UG: {
                label: "User group",
                control: (props) => {
                    if (!props.value) {
                        if (userGroups) {
                            props.onChange(props.definition, userGroups);
                        }
                        else {
                            this.$usergroup.getUserGroups().then(grps => {
                                userGroups = grps;
                                if (userGroups) {
                                    props.onChange(props.definition, userGroups);
                                }
                            });
                        }
                    }
                    return React.createElement("span", {
                        onClick: (e) => {
                            this.parameters.emit("click", props);
                        },
                        className: "link"
                    }, "Select users");
                }
            }
        };
    }

    configureViewer() {
        if (this.isViewerConfigured) {
            return;
        }
        const defaultConfig = {
            parameterTypes: this.getParameterTypesConfig(),
            datasetTypes: this.getDatasetConfig()
        };
        initReportBuilder(defaultConfig);
        this.configureReport();
        this.isViewerConfigured = true;
    }

    configureBuilder() {
        if (this.isBuilderConfigured) {
            return;
        }
        const defaultConfig = {
            parameterTypes: this.getParameterTypesConfig(),
            datasetTypes: this.getDatasetConfig()
        };
        initReportBuilder(defaultConfig);
        this.configureViewer();
        this.isBuilderConfigured = true;
    }

    processSearchData = (data) => data.map(d => {
        const fields = d.fields;
        fields.key = d.key;
        if (fields.worklog && fields.worklog.worklogs) {
            fields.worklogs = fields.worklog.worklogs;
            delete fields.worklog;
        }
        return fields;
    });

    prepareJQL(jql, parameters, parameterTemplate) {
        const usedParams = jql.match(/@Parameters.([a-zA-Z_\d.]+[|a-zA-Z_\d.()"',-//]+)\$/g); // Revisit: Escape charactors removed due to warning
        if (usedParams && usedParams.length) {
            usedParams.forEach(param => {
                let paramName = param.substring(12, param.length - 1);
                const paramsPart = paramName.split('|');
                if (paramsPart.length > 2) {
                    return;
                }
                paramName = paramsPart[0];
                const value = parameters ? this.getParamValue(parameters, parameterTemplate, paramName) : paramsPart[1];
                jql = jql.replace(param, value);
            });
        }
        return jql;
    }

    getParamValue(parameters, parameterTemplate, name) {
        const parts = name.split('.');
        const paramName = parts[0];
        let curPath = parameters[paramName];
        if (curPath === undefined) {
            console.error(`Value for parameter "${paramName}" does not exists`);
            return curPath;
        }

        for (let i = 1; curPath && i < parts.length; i++) {
            curPath = curPath[parts[i]];
        }
        if (curPath) {
            if (curPath instanceof Date) {
                curPath = curPath.format('yyyy-MM-dd');
            }
            else if (Array.isArray(curPath)) {
                curPath = curPath.join('","');
            }
            else if (typeof curPath === "object") {
                const template = parameterTemplate[paramName];
                switch (template.type) {
                    case "UG":
                        curPath = curPath.union(grp => grp.users.map(u => getUserName(u))).join('","');
                        break;
                    default:
                        // Nothing to do
                        break;
                }
            }
        }
        return Number(curPath) ? curPath : `"${curPath || ''}"`;
    }
}
