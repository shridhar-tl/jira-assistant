import { parseISO, startOfDay } from 'date-fns';

import { parseLegacySprint } from '@pages/bulk-import/issue/jira-values';

import { inject } from '@services';

import { featurePropertyKey, segmentsPropertyKey } from './constants';
import type { RawIssue, RawJiraUser } from './jira-api';
import { readSegments } from './segments';
import type { FeaturePlacement, IssueLinkRef, PlannerFieldIds, PlannerIssue, PlannerUser, StatusCategory } from './types';

export interface IssueMapContext {
    fieldIds: PlannerFieldIds;
    estimationFieldId: string | null;
    rollupSubtasks: boolean;
}

interface RawNamed {
    id?: string;
    name?: string;
    key?: string;
    value?: string;
    iconUrl?: string;
    subtask?: boolean;
    hierarchyLevel?: number;
    statusCategory?: { key?: string };
}

interface RawParent {
    key: string;
    fields?: {
        summary?: string;
        status?: RawNamed;
        issuetype?: RawNamed;
    };
}

interface RawLink {
    id: string;
    type?: { name: string; inward: string; outward: string };
    inwardIssue?: { key: string; fields?: { status?: RawNamed } };
    outwardIssue?: { key: string; fields?: { status?: RawNamed } };
}

export const baseIssueFields = [
    'summary',
    'issuetype',
    'status',
    'priority',
    'assignee',
    'parent',
    'labels',
    'components',
    'fixVersions',
    'duedate',
    'resolutiondate',
    'created',
    'issuelinks',
    'subtasks',
    'project',
    'timeoriginalestimate',
    'timeestimate',
    'timespent',
    'aggregatetimeoriginalestimate',
    'aggregatetimeestimate',
    'aggregatetimespent',
];

export const plannerIssueProperties = [segmentsPropertyKey, featurePropertyKey];

export function getIssueFields(ctx: IssueMapContext): string[] {
    const { fieldIds, estimationFieldId } = ctx;
    const extra = [
        fieldIds.sprint,
        fieldIds.epicLink,
        fieldIds.epicColor,
        fieldIds.storyPoints,
        fieldIds.startDate,
        fieldIds.dueDate,
        fieldIds.team,
        fieldIds.flagged,
        fieldIds.parentLink,
        estimationFieldId,
    ].filter((f): f is string => !!f);
    return [...new Set([...baseIssueFields, ...extra])];
}

export function toPlannerUser(user: RawJiraUser | null | undefined): PlannerUser | null {
    if (!user) {
        return null;
    }
    const id = user.accountId || user.name || user.key || '';
    if (!id) {
        return null;
    }
    return {
        id,
        displayName: user.displayName || id,
        avatarUrl: user.avatarUrls?.['24x24'] || user.avatarUrls?.['32x32'] || user.avatarUrls?.['48x48'],
        email: user.emailAddress || undefined,
    };
}

function toStatusCategory(value?: RawNamed): StatusCategory {
    const key = value?.statusCategory?.key;
    return key === 'done' ? 'done' : key === 'indeterminate' ? 'indeterminate' : 'new';
}

function toDay(value: unknown): Date | null {
    if (typeof value !== 'string' || !value) {
        return null;
    }
    const date = parseISO(value);
    return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function toDateTime(value: unknown): Date | null {
    if (typeof value !== 'string' || !value) {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
        return Number(value);
    }
    return null;
}

function getSprintIds(value: unknown): { ids: number[]; current: number | null } {
    if (!Array.isArray(value)) {
        return { ids: [], current: null };
    }

    const sprints = value
        .map((s) => {
            if (typeof s === 'string') {
                const parsed = parseLegacySprint(s);
                return parsed ? { id: parsed.id, state: parsed.state.toLowerCase() } : null;
            }
            const sprint = s as { id?: number; state?: string };
            return sprint?.id ? { id: sprint.id, state: (sprint.state || '').toLowerCase() } : null;
        })
        .filter((s): s is { id: number; state: string } => !!s);

    // An issue carried over keeps the closed sprints in the list. The open (active or future) sprint is where it currently is.
    const open = sprints.find((s) => s.state === 'active') || sprints.find((s) => s.state === 'future');
    return { ids: sprints.map((s) => s.id), current: open?.id ?? null };
}

function getParentLinkKey(value: unknown): string | null {
    if (typeof value === 'string') {
        return value || null;
    }
    const obj = value as { key?: string; data?: { key?: string } } | null;
    return obj?.key || obj?.data?.key || null;
}

function getLinks(value: unknown): IssueLinkRef[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return (value as RawLink[])
        .map((link): IssueLinkRef | null => {
            if (!link.type) {
                return null;
            }
            if (link.outwardIssue) {
                return {
                    id: link.id,
                    typeName: link.type.name,
                    direction: 'outward',
                    label: link.type.outward,
                    issueKey: link.outwardIssue.key,
                    issueStatusCategory: toStatusCategory(link.outwardIssue.fields?.status),
                };
            }
            if (link.inwardIssue) {
                return {
                    id: link.id,
                    typeName: link.type.name,
                    direction: 'inward',
                    label: link.type.inward,
                    issueKey: link.inwardIssue.key,
                    issueStatusCategory: toStatusCategory(link.inwardIssue.fields?.status),
                };
            }
            return null;
        })
        .filter((l): l is IssueLinkRef => !!l);
}

function getFeaturePlacement(value: unknown): FeaturePlacement | null {
    const placement = value as FeaturePlacement | null | undefined;
    if (!placement || placement.v !== 1 || typeof placement.boardId !== 'number') {
        return null;
    }
    return {
        v: 1,
        boardId: placement.boardId,
        sprintId: typeof placement.sprintId === 'number' ? placement.sprintId : null,
        piId: placement.piId,
        estimate: toNumber(placement.estimate),
    };
}

function getTeam(value: unknown): { id: string | null; name: string | null } {
    const team = value as { id?: string; name?: string; title?: string } | null;
    if (!team || typeof team !== 'object') {
        return { id: null, name: null };
    }
    return { id: team.id || null, name: team.name || team.title || null };
}

function getColor(value: unknown): string | null {
    if (typeof value === 'string') {
        return value || null;
    }
    const obj = value as { key?: string; value?: string } | null;
    return obj?.key || obj?.value || null;
}

export function mapPlannerIssue(raw: RawIssue, ctx: IssueMapContext): PlannerIssue {
    const { $userutils } = inject('UserUtilsService');
    const { fields } = raw;
    const { fieldIds, estimationFieldId, rollupSubtasks } = ctx;

    const issueType = fields.issuetype as RawNamed | undefined;
    const status = fields.status as RawNamed | undefined;
    const priority = fields.priority as RawNamed | undefined;
    const project = fields.project as RawNamed | undefined;
    const parent = fields.parent as RawParent | undefined;
    const isSubtask = !!issueType?.subtask;
    const sprint = getSprintIds(fieldIds.sprint ? fields[fieldIds.sprint] : null);

    const epicLinkValue = fieldIds.epicLink ? fields[fieldIds.epicLink] : null;
    const parentLinkKey = fieldIds.parentLink ? getParentLinkKey(fields[fieldIds.parentLink]) : null;
    const parentKey = parent?.key || (typeof epicLinkValue === 'string' && epicLinkValue) || parentLinkKey || null;
    const parentHierarchy = parent?.fields?.issuetype?.hierarchyLevel;
    const epicKey =
        typeof epicLinkValue === 'string' && epicLinkValue
            ? epicLinkValue
            : parent && !isSubtask && (parentHierarchy === undefined || parentHierarchy === 1)
              ? parent.key
              : null;

    const useAggregate = rollupSubtasks && !isSubtask;
    const originalEstimate = toNumber(useAggregate ? fields.aggregatetimeoriginalestimate : fields.timeoriginalestimate);
    const remainingEstimate = toNumber(useAggregate ? fields.aggregatetimeestimate : fields.timeestimate);
    const timeSpent = toNumber(useAggregate ? fields.aggregatetimespent : fields.timespent);

    const pointsField = estimationFieldId && estimationFieldId !== 'timeoriginalestimate' ? estimationFieldId : fieldIds.storyPoints;
    const team = getTeam(fieldIds.team ? fields[fieldIds.team] : null);
    const segmentsInfo = readSegments(raw.properties?.[segmentsPropertyKey]);
    const flaggedValue = fieldIds.flagged ? fields[fieldIds.flagged] : null;

    return {
        id: raw.id,
        key: raw.key,
        summary: (fields.summary as string) || '',
        url: $userutils.getTicketUrl(raw.key) || '',
        projectKey: project?.key || raw.key.split('-')[0],
        projectId: project?.id || '',
        issueTypeId: issueType?.id || '',
        issueType: issueType?.name || '',
        issueTypeIconUrl: issueType?.iconUrl,
        isSubtask,
        hierarchyLevel: typeof issueType?.hierarchyLevel === 'number' ? issueType.hierarchyLevel : isSubtask ? -1 : 0,
        status: status?.name || '',
        statusId: status?.id || '',
        statusCategory: toStatusCategory(status),
        priority: priority?.name,
        priorityIconUrl: priority?.iconUrl,
        assignee: toPlannerUser(fields.assignee as RawJiraUser | null),
        parentKey,
        parent: parent
            ? {
                  key: parent.key,
                  summary: parent.fields?.summary || parent.key,
                  statusCategory: toStatusCategory(parent.fields?.status),
                  issueType: parent.fields?.issuetype?.name || '',
              }
            : null,
        epicKey,
        sprintIds: sprint.ids,
        currentSprintId: sprint.current,
        points: pointsField ? toNumber(fields[pointsField]) : null,
        originalEstimate,
        remainingEstimate,
        timeSpent,
        labels: Array.isArray(fields.labels) ? (fields.labels as string[]) : [],
        components: Array.isArray(fields.components) ? (fields.components as RawNamed[]).map((c) => c.name || '') : [],
        fixVersions: Array.isArray(fields.fixVersions) ? (fields.fixVersions as RawNamed[]).map((c) => c.name || '') : [],
        teamId: team.id,
        teamName: team.name,
        startDate: fieldIds.startDate ? toDay(fields[fieldIds.startDate]) : null,
        dueDate: toDay(fields[fieldIds.dueDate || 'duedate']),
        resolutionDate: toDateTime(fields.resolutiondate),
        created: toDateTime(fields.created),
        flagged: Array.isArray(flaggedValue) ? flaggedValue.length > 0 : !!flaggedValue,
        color: fieldIds.epicColor ? getColor(fields[fieldIds.epicColor]) : null,
        links: getLinks(fields.issuelinks),
        subtaskKeys: Array.isArray(fields.subtasks) ? (fields.subtasks as { key: string }[]).map((s) => s.key) : [],
        segments: segmentsInfo.segments,
        legacySegments: segmentsInfo.isLegacy,
        featurePlacement: getFeaturePlacement(raw.properties?.[featurePropertyKey]),
    };
}
