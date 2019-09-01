import React from 'react';
import { initReportBuilder } from 'jsd-report';
import EventEmitter from 'events';

export default class ReportConfigService {
    static dependencies = ["ReportService", "SessionService", "JiraService", "AjaxService", "UserGroup", "UserUtilsService"];

    constructor($report, $session, $jira, $http, $) {
        this.$report = $report;
        this.$session = $session;
        this.$jira = $jira;
        this.$http = $http;
        this.parameters = new EventEmitter();
        this.datasets = new EventEmitter();
    }

    configureReport() {
        if (this.isConfigured) {
            return;
        }
        const defaultConfig = {
            // eslint-disable-next-line no-new-func
            compiler: function (code, sandbox) { return Function(...sandbox, code)(); },
            subReports: (defn) => {
                return this.$report.getSavedFilters().then((result) => {
                    result = result.filter(q => q.advanced).map(q => { return { id: q.id, name: q.queryName }; });
                    if (defn && defn.id) {
                        result = result.filter(r => r.id !== defn.id);
                    }
                    return result;
                });
            },
            resolveReportDefinition: (reportId) => {
                return this.$report.getSavedQuery(reportId);
            },
            resolveHttpRequest: (method, url, data, headers) => {
                return this.$http.request(method, url, data, headers);
            },
            builtInFields: {
                UserDateFormat: { value: this.$session.CurrentUser.dateFormat, helpText: "Provides the date format of the current user" },
                UserTimeFormat: { value: this.$session.CurrentUser.timeFormat },
                UserDateTimeFormat: { value: `${this.$session.CurrentUser.dateFormat} ${this.$session.CurrentUser.timeFormat}` }
            },
            commonFunctions: {
                getUsersFromGroup: { value: (group) => { /*ToDo: Yet to implement */ } },
                getJiraIssueUrl: { value: (jiraIssueKey) => this.$userutils.getTicketUrl(jiraIssueKey) },
                getUserProfileUrl: { value: (userName) => { /*ToDo: Yet to implement */ } },
                getTicketDetails: { value: (ticketsList, fields) => this.$report.fetchTicketDetails(ticketsList, fields) },
                executeJQL: { value: (jql, fields) => this.$jira.searchTickets(jql, fields) },
                getRapidSprintList: { value: (rapidIds) => this.$jira.getRapidSprintList(rapidIds) },
                getProjectSprintList: { value: (projects) => this.$jira.getSprintList(projects) },
                getRapidSprintDetails: { value: (rapidViewId, sprintId) => this.$jira.getRapidSprintDetails(rapidViewId, sprintId) },
                searchUsers: { value: (text, maxResult = 10, startAt = 0) => this.$jira.searchUsers(text, maxResult, startAt) },
                getWorklogs: { value: (jiraKey) => this.$jira.getWorklogs(jiraKey) },
            }
        };
        initReportBuilder(defaultConfig);
        this.isConfigured = true;
    }

    getDatasetConfig(datasetTypes = {}) {
        return {
            JQL: {
                label: "JQL search result",
                resolveSchema: (datasetTypes.JQL || ((name, props, data) => {
                    return new Promise((resolve, reject) => {
                        this.datasets.emit("resolveSchema_JQL", { name, props, data, schema: { resolve, reject } });
                    });
                })),
                resolveData: (qry, parametersValues, { parameterTemplate }) => {
                    return this.$jira.searchTickets(this.prepareJQL(qry.jql, parametersValues, parameterTemplate), qry.outputFields.map(f => f.id))
                        .then(this.processSearchData);
                }
            },
            FLT: true,
            PLS: {
                label: "Project list", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    return this.$jira.getProjects().then(p => { promise.resolve(p); return props; });
                },
                resolveData: props => { return this.$jira.getProjects(); }
            },
            ITL: {
                label: "Issue type list", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getIssueTypes().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => { return this.$jira.getIssueTypes(); }
            },
            OTL: {
                label: "My open tickets list", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getOpenTickets().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => { return this.$jira.getOpenTickets(); }
            },
            RPV: {
                label: "Rapid view list (sprint board list)", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getRapidViews().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => { return this.$jira.getRapidViews(); }
            },
            CUF: {
                label: "Custom fields list", allowEdit: false,
                resolveSchema: (name, props, promise) => {
                    this.$jira.getCustomFields().then(p => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: props => { return this.$jira.getCustomFields(); }
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
                            this.$report.getUserGroups().then(grps => {
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

    processSearchData = (data) => {
        return data.map(d => {
            const fields = d.fields;
            fields.key = d.key;
            if (fields.worklog && fields.worklog.worklogs) {
                fields.worklogs = fields.worklog.worklogs;
                delete fields.worklog;
            }
            return fields;
        });
    }

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
        let curPath = parameters[parts[0]];
        for (let i = 1; curPath && i < parts.length; i++) {
            curPath = curPath[parts[i]];
        }
        if (curPath) {
            if (curPath instanceof Date) {
                curPath = curPath.format('yyyy-MM-dd');
            }
            else if (typeof curPath === "object") {
                const paramName = parts[0];
                const template = parameterTemplate[paramName];
                switch (template.type) {
                    case "UG":
                        curPath = curPath.union(grp => grp.users.map(u => u.name)).join('","');
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
