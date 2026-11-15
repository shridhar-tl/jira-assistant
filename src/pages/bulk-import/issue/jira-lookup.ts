import type JiraService from '@services/jira-service';
import type { JiraUser } from '@services/jira-service';

import type { JiraCreateIssueType, JiraFieldMetaMap, JiraSprintRef, JiraTransition } from '@types';

import { getUnsupportedReason, pseudoFields } from './field-kinds';
import type { ExistingIssue } from './types';

export interface JiraGroupRef {
    name: string;
    groupId?: string;
}

export interface IssueResponse {
    key: string;
    fields: Record<string, unknown> & {
        project?: { key: string };
        issuetype?: { id: string; name: string; subtask: boolean };
        status?: { name: string };
        summary?: string;
        parent?: { key: string };
        subtasks?: unknown[];
    };
}

interface ProjectStatusesResponse {
    id: string;
    name: string;
    statuses: { id: string; name: string }[];
}

export interface JiraLookup {
    isCloud: boolean;
    prefetchIssues: (keys: string[], fields: string[]) => Promise<void>;
    getIssue: (key: string) => Promise<ExistingIssue | null>;
    getFullIssue: (key: string) => Promise<IssueResponse>;
    getIssueTypes: (project: string) => Promise<JiraCreateIssueType[] | null>;
    getCreateFields: (project: string, issueTypeId: string) => Promise<JiraFieldMetaMap>;
    getEditFields: (key: string) => Promise<JiraFieldMetaMap | null>;
    getTransitions: (key: string) => Promise<JiraTransition[]>;
    getProjectStatuses: (project: string, issueTypeId: string) => Promise<string[]>;
    findUsers: (query: string) => Promise<JiraUser[]>;
    findGroups: (query: string) => Promise<JiraGroupRef[]>;
    getSprints: (project: string) => Promise<JiraSprintRef[]>;
    invalidateIssue: (key: string) => void;
}

const baseIssueFields = ['project', 'issuetype', 'status', 'summary', 'parent', 'subtasks'];
const issueBatchSize = 50;
const userSearchLimit = 20;

function toExistingIssue(issue: IssueResponse): ExistingIssue {
    const { fields } = issue;
    return {
        key: issue.key.toUpperCase(),
        projectKey: fields.project?.key?.toUpperCase() || issue.key.split('-')[0],
        issueTypeId: fields.issuetype?.id || '',
        issueTypeName: fields.issuetype?.name || '',
        isSubtask: !!fields.issuetype?.subtask,
        statusName: fields.status?.name || '',
        summary: fields.summary || '',
        parentKey: fields.parent?.key?.toUpperCase(),
        subtaskCount: fields.subtasks?.length || 0,
        fields,
    };
}

function cached<T>(cache: Map<string, Promise<T>>, key: string, loader: () => Promise<T>): Promise<T> {
    let result = cache.get(key);
    if (!result) {
        result = loader();
        cache.set(key, result);
        // Failed lookups are not cached so that they could be retried during revalidation
        result.catch(() => cache.delete(key));
    }
    return result;
}

// Epic Link field has to be fetched always to identify the current parent in Jira versions using Epic Link instead of parent
export function createJiraLookup($jira: JiraService, isCloud: boolean, alwaysFetchedFields: string[]): JiraLookup {
    const issues = new Map<string, Promise<IssueResponse | null>>();
    const editFields = new Map<string, Promise<JiraFieldMetaMap | null>>();
    const transitions = new Map<string, Promise<JiraTransition[]>>();
    const statuses = new Map<string, Promise<ProjectStatusesResponse[]>>();
    const users = new Map<string, Promise<JiraUser[]>>();
    const groups = new Map<string, Promise<JiraGroupRef[]>>();
    const sprints = new Map<string, Promise<JiraSprintRef[]>>();
    const issueTypes = new Map<string, Promise<JiraCreateIssueType[] | null>>();
    const createFields = new Map<string, Promise<JiraFieldMetaMap>>();
    const defaultFields = [...baseIssueFields, ...alwaysFetchedFields];
    const fetchedFields = new Map<string, string>();
    let issueFields = defaultFields;

    const fetchIssue = async (key: string): Promise<IssueResponse | null> => {
        fetchedFields.set(key, issueFields.join());
        try {
            return await $jira.getIssue<IssueResponse>(key, issueFields);
        } catch {
            return null;
        }
    };

    const prefetchIssues = async (keys: string[], fields: string[]) => {
        issueFields = [
            ...new Set([...defaultFields, ...fields.filter((f) => !getUnsupportedReason(f) && !f.startsWith('@') && !f.includes('.'))]),
        ];
        if (fields.includes(pseudoFields.originalEstimate) || fields.includes(pseudoFields.remainingEstimate)) {
            issueFields.push('timetracking');
        }

        const fieldsSignature = issueFields.join();
        const pending = [...new Set(keys.map((k) => k.toUpperCase()))].filter(
            (k) => !issues.has(k) || fetchedFields.get(k) !== fieldsSignature,
        );
        for (let i = 0; i < pending.length; i += issueBatchSize) {
            const batch = pending.slice(i, i + issueBatchSize);
            let found: IssueResponse[] = [];
            try {
                found = await $jira.searchTickets(`key in (${batch.map((k) => `"${k}"`).join(',')})`, issueFields, undefined, {
                    ignoreErrors: true,
                    ignoreWarnings: true,
                });
            } catch {
                // JQL fails when any of the key does not exist. Such keys are fetched individually below
            }

            const foundMap = new Map(found.map((issue) => [issue.key.toUpperCase(), issue]));
            batch.forEach((key) => {
                const issue = foundMap.get(key);
                fetchedFields.set(key, fieldsSignature);
                issues.set(key, issue ? Promise.resolve(issue) : fetchIssue(key));
            });
        }
    };

    const getRawIssue = (key: string) => cached(issues, key.toUpperCase(), () => fetchIssue(key.toUpperCase()));

    const getIssue = async (key: string) => {
        const issue = await getRawIssue(key);
        return issue ? toExistingIssue(issue) : null;
    };

    const getEditFields = (key: string) =>
        cached(editFields, key.toUpperCase(), async () => {
            try {
                return await $jira.getIssueEditMeta(key);
            } catch {
                return null;
            }
        });

    const getTransitions = (key: string) => cached(transitions, key.toUpperCase(), () => $jira.getIssueTransitions(key));

    const getProjectStatuses = async (project: string, issueTypeId: string) => {
        const list = await cached<ProjectStatusesResponse[]>(statuses, project.toUpperCase(), () => $jira.getProjectStatuses(project));
        const issueType = list.find((t) => t.id === issueTypeId);
        const statusList = issueType ? issueType.statuses : list.flatMap((t) => t.statuses);
        return [...new Set(statusList.map((s) => s.name))];
    };

    const findUsers = (query: string) =>
        cached(users, query.toLowerCase(), async () => ((await $jira.searchUsers(query, userSearchLimit)) as JiraUser[]) || []);

    const findGroups = (query: string) =>
        cached(groups, query.toLowerCase(), async () => ((await $jira.searchGroups(query, userSearchLimit)) as JiraGroupRef[]) || []);

    const getSprints = (project: string) =>
        cached(sprints, project.toUpperCase(), async () => ((await $jira.getSprintList(project)) as JiraSprintRef[]) || []);

    const invalidateIssue = (key: string) => {
        const upperKey = key.toUpperCase();
        issues.delete(upperKey);
        fetchedFields.delete(upperKey);
        editFields.delete(upperKey);
        transitions.delete(upperKey);
    };

    return {
        isCloud,
        prefetchIssues,
        getIssue,
        getFullIssue: (key) => $jira.getIssue<IssueResponse>(key, ['*all']),
        getIssueTypes: (project) => cached(issueTypes, project.toUpperCase(), () => $jira.getCreateMetaIssueTypes(project)),
        getCreateFields: (project, issueTypeId) =>
            cached(createFields, `${project.toUpperCase()}_${issueTypeId}`, () => $jira.getCreateMetaFields(project, issueTypeId)),
        getEditFields,
        getTransitions,
        getProjectStatuses,
        findUsers,
        findGroups,
        getSprints,
        invalidateIssue,
    };
}
