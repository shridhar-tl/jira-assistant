import EventEmitter from 'events';

import { getUserName } from '@/utils';

import type JiraService from './jira-service';
import type UserGroupService from './usergroups-service';

// ToDo: This service is not at all required and can be removed permanently

export default class ReportConfigService {
    static dependencies = ['JiraService', 'UserGroupService'];

    private $jira: JiraService;
    private $usergroup: UserGroupService;
    private isViewerConfigured: boolean = false;
    private isBuilderConfigured: boolean = false;

    parameters: EventEmitter;
    eventPipe: EventEmitter;

    constructor($jira: JiraService, $usergroup: UserGroupService) {
        this.$jira = $jira;
        this.$usergroup = $usergroup;

        this.parameters = new EventEmitter();
        this.eventPipe = new EventEmitter();
    }

    configureReport(): void {
        // This is not required in new implementation.
    }

    getDatasetConfig(datasetTypes: any = {}): any {
        return {
            JQL: {
                label: 'JQL search result',
                resolveSchema:
                    datasetTypes.JQL ||
                    ((name: string, props: any, data: any) =>
                        new Promise((resolve, reject) => {
                            this.eventPipe.emit('resolveSchema_JQL', { name, props, data, schema: { resolve, reject } });
                        })),
                resolveData: (qry: any, parametersValues: any, { parameterTemplate }: any) =>
                    this.$jira
                        .searchTickets(
                            this.prepareJQL(qry.jql, parametersValues, parameterTemplate),
                            qry.outputFields.map((f: any) => f.id),
                        )
                        .then(this.processSearchData),
            },
            FLT: true,
            PLS: {
                label: 'Project list',
                allowEdit: false,
                resolveSchema: (name: string, props: any, promise: any) =>
                    this.$jira.getProjects().then((p: any) => {
                        promise.resolve(p);
                        return props;
                    }),
                resolveData: (props: any) => this.$jira.getProjects(),
            },
            ITL: {
                label: 'Issue type list',
                allowEdit: false,
                resolveSchema: (name: string, props: any, promise: any) => {
                    this.$jira.getIssueTypes().then((p: any) => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: (props: any) => this.$jira.getIssueTypes(),
            },
            OTL: {
                label: 'My open tickets list',
                allowEdit: false,
                resolveSchema: (name: string, props: any, promise: any) => {
                    this.$jira.getOpenTickets().then((p: any) => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: (props: any) => this.$jira.getOpenTickets(),
            },
            RPV: {
                label: 'Rapid view list (sprint board list)',
                allowEdit: false,
                resolveSchema: (name: string, props: any, promise: any) => {
                    this.$jira.getRapidViews().then((p: any) => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: (props: any) => this.$jira.getRapidViews(),
            },
            CUF: {
                label: 'Custom fields list',
                allowEdit: false,
                resolveSchema: (name: string, props: any, promise: any) => {
                    this.$jira.getCustomFields().then((p: any) => promise.resolve(p));
                    return Promise.resolve(props);
                },
                resolveData: (props: any) => this.$jira.getCustomFields(),
            },
            EXP: true,
            HTP: true,
            FIL: true,
            STC: true,
        };
    }

    getParameterTypesConfig(): any {
        let userGroups: any = null;
        return {
            UG: {
                label: 'User group',
                control: (props: any) => {
                    if (!props.value) {
                        if (userGroups) {
                            props.onChange(props.definition, userGroups);
                        } else {
                            this.$usergroup.getUserGroups().then((grps: any) => {
                                userGroups = grps;
                                if (userGroups) {
                                    props.onChange(props.definition, userGroups);
                                }
                            });
                        }
                    }
                    return null;
                },
            },
        };
    }

    configureViewer(): void {
        if (this.isViewerConfigured) {
            return;
        }
        const defaultConfig = {
            parameterTypes: this.getParameterTypesConfig(),
            datasetTypes: this.getDatasetConfig(),
        };
        this.configureReport();
        this.isViewerConfigured = true;
    }

    configureBuilder(): void {}

    processSearchData = (data: any[]): any[] =>
        data.map((d: any) => {
            const fields = d.fields;
            fields.key = d.key;
            if (fields.worklog && fields.worklog.worklogs) {
                fields.worklogs = fields.worklog.worklogs;
                delete fields.worklog;
            }
            return fields;
        });

    prepareJQL(jql: string, parameters: any, parameterTemplate: any): string {
        const usedParams = jql.match(/@Parameters.([a-zA-Z_\d.]+[|a-zA-Z_\d.()"',-//]+)\$/g);
        if (usedParams && usedParams.length) {
            usedParams.forEach((param: string) => {
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

    getParamValue(parameters: any, parameterTemplate: any, name: string): string {
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
                const year = curPath.getFullYear();
                const month = String(curPath.getMonth() + 1).padStart(2, '0');
                const day = String(curPath.getDate()).padStart(2, '0');
                curPath = `${year}-${month}-${day}`;
            } else if (Array.isArray(curPath)) {
                curPath = curPath.join('","');
            } else if (typeof curPath === 'object') {
                const template = parameterTemplate[paramName];
                switch (template.type) {
                    case 'UG':
                        curPath = curPath.flatMap((grp: any) => grp.users.map((u: any) => getUserName(u))).join('","');
                        break;
                    default:
                        break;
                }
            }
        }
        return Number(curPath) ? curPath : `"${curPath || ''}"`;
    }
}
