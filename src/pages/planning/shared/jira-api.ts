import { prepareUrlWithQueryString } from '@utils/helpers';

import { inject } from '@services';

import { getCached } from './cache';
import {
    bulkMoveLimit,
    cacheTtl,
    defaultStartDateFieldName,
    epicColorFieldType,
    epicLinkFieldType,
    flaggedFieldName,
    issueColorFieldType,
    parentLinkFieldType,
    searchPageSize,
    sprintFieldType,
    storyPointsFieldNames,
    teamFieldType,
} from './constants';
import { assertPropertySize } from './property-limits';
import { ensureStorageAllowed } from './storage-consent';
import type {
    BoardConfig,
    BoardType,
    IssueLinkType,
    JiraPermissions,
    PlannerBoard,
    PlannerFieldIds,
    PlannerSprint,
    SprintState,
} from './types';

export interface RawJiraUser {
    accountId?: string;
    name?: string;
    key?: string;
    displayName?: string;
    emailAddress?: string;
    avatarUrls?: Record<string, string>;
}

export interface RawSprint {
    id: number;
    name: string;
    state: string;
    startDate?: string;
    endDate?: string;
    completeDate?: string;
    goal?: string;
    originBoardId?: number;
    boardId?: number;
}

export interface RawIssue {
    id: string;
    key: string;
    fields: Record<string, unknown>;
    properties?: Record<string, unknown>;
}

interface RawBoard {
    id: number;
    name: string;
    type: string;
    location?: { projectKey?: string; projectId?: number | string };
}

interface RawBoardConfig {
    id: number;
    name: string;
    type?: string;
    filter?: { id: string | number };
    estimation?: { type?: string; field?: { fieldId: string; displayName?: string } };
    ranking?: { rankCustomFieldId?: number | string };
    columnConfig?: { columns?: { name: string; statuses?: { id: string }[] }[] };
    location?: { key?: string; id?: number | string; projectKeyOrId?: string; type?: string };
}

interface RawField {
    id: string;
    name: string;
    custom?: boolean;
    schema?: { type?: string; custom?: string };
}

interface PagedResponse<T> {
    values: T[];
    isLast?: boolean;
    startAt?: number;
    maxResults?: number;
    total?: number;
}

export interface SearchPageOptions {
    properties?: string[];
    maxPages?: number;
    pageSize?: number;
    nextPageToken?: string | null;
}

export interface SearchPageResult {
    issues: RawIssue[];
    nextPageToken: string | null;
}

export interface RankPosition {
    beforeKey?: string;
    afterKey?: string;
}

export interface SprintUpdate {
    name?: string;
    goal?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    state?: SprintState;
}

const agileBase = '~/rest/agile/1.0';
const permissionKeys = [
    'MANAGE_SPRINTS_PERMISSION',
    'EDIT_ISSUES',
    'SCHEDULE_ISSUES',
    'CREATE_ISSUES',
    'LINK_ISSUES',
    'ASSIGN_ISSUES',
] as const;

function isCloud(): boolean {
    const { $session } = inject('SessionService');
    return !!$session.CurrentUser?.isAtlasCloud;
}

function toBoardType(type?: string): BoardType {
    return type === 'kanban' ? 'kanban' : type === 'simple' ? 'simple' : 'scrum';
}

function toDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function toSprintState(state: string): SprintState {
    const value = state?.toLowerCase();
    return value === 'active' ? 'active' : value === 'closed' ? 'closed' : 'future';
}

export function mapSprint(sprint: RawSprint): PlannerSprint {
    return {
        id: sprint.id,
        name: sprint.name,
        state: toSprintState(sprint.state),
        startDate: toDate(sprint.startDate),
        endDate: toDate(sprint.endDate),
        completeDate: toDate(sprint.completeDate),
        goal: sprint.goal || '',
        boardId: sprint.originBoardId ?? sprint.boardId ?? null,
    };
}

function formatJiraDateTime(date: Date | null | undefined): string | undefined {
    return date ? date.toISOString() : undefined;
}

async function getAllPages<T>(url: string, maxPages = 20): Promise<T[]> {
    const { $ajax } = inject('AjaxService');
    const result: T[] = [];
    let startAt = 0;

    for (let page = 0; page < maxPages; page++) {
        const separator = url.includes('?') ? '&' : '?';
        const data = await $ajax.get<PagedResponse<T>>(`${url}${separator}startAt=${startAt}&maxResults=50`);
        result.push(...(data.values || []));
        if (data.isLast !== false || !data.values?.length) {
            break;
        }
        startAt += data.values.length;
    }

    return result;
}

export function getAllBoards(force?: boolean): Promise<PlannerBoard[]> {
    return getCached(
        'boards',
        cacheTtl.boards,
        async () => {
            const boards = await getAllPages<RawBoard>(`${agileBase}/board?orderBy=name`, 40);
            return boards
                .map((b) => ({
                    id: b.id,
                    name: b.name,
                    type: toBoardType(b.type),
                    projectKey: b.location?.projectKey,
                    projectId: b.location?.projectId !== undefined ? String(b.location.projectId) : undefined,
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        },
        force,
    );
}

export function getBoardConfig(boardId: number, force?: boolean): Promise<BoardConfig> {
    return getCached(
        `boardConfig_${boardId}`,
        cacheTtl.metadata,
        async () => {
            const { $ajax } = inject('AjaxService');
            const config = await $ajax.get<RawBoardConfig>(`${agileBase}/board/${boardId}/configuration`);
            const columns = (config.columnConfig?.columns || []).map((c) => ({
                name: c.name,
                statusIds: (c.statuses || []).map((s) => String(s.id)),
            }));
            const lastColumn = columns[columns.length - 1];
            const estimationField = config.estimation?.type === 'field' ? config.estimation.field : undefined;

            return {
                boardId,
                name: config.name,
                type: toBoardType(config.type),
                filterId: config.filter?.id !== undefined ? String(config.filter.id) : null,
                estimationFieldId: estimationField?.fieldId || null,
                estimationFieldName: estimationField?.displayName || null,
                rankFieldId: config.ranking?.rankCustomFieldId !== undefined ? String(config.ranking.rankCustomFieldId) : null,
                columns,
                doneStatusIds: columns.length > 1 && lastColumn ? lastColumn.statusIds : [],
                projectKey: config.location?.key,
                projectId: config.location?.id !== undefined ? String(config.location.id) : undefined,
            };
        },
        force,
    );
}

function getFields(force?: boolean): Promise<RawField[]> {
    return getCached(
        'fields',
        cacheTtl.metadata,
        async () => {
            const { $jira } = inject('JiraService');
            return ((await $jira.getCustomFields()) as RawField[]).map(({ id, name, custom, schema }) => ({ id, name, custom, schema }));
        },
        force,
    );
}

export async function getFieldIds(startDateFieldSetting: string, dueDateFieldSetting = 'duedate', force?: boolean): Promise<PlannerFieldIds> {
    const { $session } = inject('SessionService');
    const fields = await getFields(force);
    const byCustomType = (type: string) => fields.find((f) => f.schema?.custom === type)?.id || null;
    const byName = (names: string[]) => fields.find((f) => names.includes(f.name.toLowerCase()))?.id || null;

    const configuredStoryPoints = $session.CurrentUser?.storyPointField?.id;
    const startDate =
        startDateFieldSetting ||
        fields.find((f) => f.name.toLowerCase() === defaultStartDateFieldName && (f.schema?.type === 'date' || f.schema?.type === 'datetime'))
            ?.id ||
        null;

    return {
        sprint: byCustomType(sprintFieldType),
        epicLink: byCustomType(epicLinkFieldType),
        epicColor: byCustomType(issueColorFieldType) || byCustomType(epicColorFieldType),
        storyPoints: configuredStoryPoints || byName(storyPointsFieldNames),
        startDate,
        dueDate: dueDateFieldSetting || 'duedate',
        team: byCustomType(teamFieldType),
        flagged: byName([flaggedFieldName]),
        parentLink: byCustomType(parentLinkFieldType),
    };
}

export async function getDateFieldOptions(): Promise<{ value: string; label: string }[]> {
    const fields = await getFields();
    return fields
        .filter((f) => f.id === 'duedate' || f.schema?.type === 'date' || f.schema?.type === 'datetime')
        .filter((f) => f.id !== 'created' && f.id !== 'updated' && f.id !== 'resolutiondate' && f.id !== 'lastViewed')
        .map((f) => ({ value: f.id, label: f.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getNumberFieldOptions(): Promise<{ value: string; label: string }[]> {
    const fields = await getFields();
    return fields
        .filter((f) => f.custom && f.schema?.type === 'number')
        .map((f) => ({ value: f.id, label: f.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getSelectFieldOptions(): Promise<{ value: string; label: string }[]> {
    const fields = await getFields();
    return fields
        .filter((f) => f.custom && f.schema?.type === 'option')
        .map((f) => ({ value: f.id, label: f.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

export function getBoardSprints(boardId: number, states: SprintState[], force?: boolean, ownOnly = false): Promise<PlannerSprint[]> {
    const stateParam = [...states].sort().join(',');
    const ttl = states.length === 1 && states[0] === 'closed' ? cacheTtl.metadata : cacheTtl.sprints;

    return getCached(
        `sprints_${boardId}_${stateParam}`,
        ttl,
        () => getAllPages<RawSprint>(`${agileBase}/board/${boardId}/sprint?state=${stateParam}`, 30),
        force,
    ).then((sprints) => sprints.filter((s) => !ownOnly || !s.originBoardId || s.originBoardId === boardId).map(mapSprint));
}

export async function searchIssuePages(jql: string, fields: string[], opts: SearchPageOptions = {}): Promise<SearchPageResult> {
    const { $ajax } = inject('AjaxService');
    const pageSize = opts.pageSize || searchPageSize;
    const maxPages = opts.maxPages || 1;
    const issues: RawIssue[] = [];
    const baseParams: Record<string, string | number> = { jql, fields: fields.join(','), maxResults: pageSize };
    if (opts.properties?.length) {
        baseParams.properties = opts.properties.join(',');
    }

    if (isCloud()) {
        let token = opts.nextPageToken || null;
        for (let page = 0; page < maxPages; page++) {
            const params = token ? { ...baseParams, nextPageToken: token } : baseParams;
            const result = await $ajax.get<{ issues?: RawIssue[]; nextPageToken?: string; isLast?: boolean }>(
                prepareUrlWithQueryString('~/rest/api/3/search/jql', params),
            );
            issues.push(...(result.issues || []));
            token = !result.isLast && result.nextPageToken ? result.nextPageToken : null;
            if (!token) {
                break;
            }
        }
        return { issues, nextPageToken: token };
    }

    let startAt = opts.nextPageToken ? parseInt(opts.nextPageToken, 10) || 0 : 0;
    let next: string | null = null;
    for (let page = 0; page < maxPages; page++) {
        const result = await $ajax.get<{ issues?: RawIssue[]; total?: number }>(
            prepareUrlWithQueryString('~/rest/api/2/search', { ...baseParams, startAt }),
        );
        const pageIssues = result.issues || [];
        issues.push(...pageIssues);
        startAt += pageIssues.length;
        next = pageIssues.length && typeof result.total === 'number' && startAt < result.total ? String(startAt) : null;
        if (!next) {
            break;
        }
    }
    return { issues, nextPageToken: next };
}

function chunkArray<T>(items: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        result.push(items.slice(i, i + size));
    }
    return result;
}

function rankPayload(rank?: RankPosition): Record<string, string> {
    if (rank?.beforeKey) {
        return { rankBeforeIssue: rank.beforeKey };
    }
    if (rank?.afterKey) {
        return { rankAfterIssue: rank.afterKey };
    }
    return {};
}

export async function moveIssuesToSprint(sprintId: number, keys: string[], rank?: RankPosition): Promise<void> {
    const { $ajax } = inject('AjaxService');
    const chunks = chunkArray(keys, bulkMoveLimit);
    let previousLastKey: string | undefined;

    for (const [index, issues] of chunks.entries()) {
        const position = index === 0 ? rank : { afterKey: previousLastKey };
        await $ajax.post(`${agileBase}/sprint/${sprintId}/issue`, { issues, ...rankPayload(position) });
        previousLastKey = issues[issues.length - 1];
    }
}

export async function moveIssuesToBacklog(keys: string[]): Promise<void> {
    const { $ajax } = inject('AjaxService');
    for (const issues of chunkArray(keys, bulkMoveLimit)) {
        await $ajax.post(`${agileBase}/backlog/issue`, { issues });
    }
}

export async function rankIssues(keys: string[], rank: RankPosition, rankFieldId?: string | null): Promise<void> {
    if (!rank.beforeKey && !rank.afterKey) {
        return;
    }

    const { $ajax } = inject('AjaxService');
    const chunks = chunkArray(keys, bulkMoveLimit);
    let previousLastKey: string | undefined;

    for (const [index, issues] of chunks.entries()) {
        const position = index === 0 ? rank : { afterKey: previousLastKey };
        const payload: Record<string, unknown> = { issues, ...rankPayload(position) };
        if (rankFieldId) {
            payload.rankCustomFieldId = Number(rankFieldId);
        }
        await $ajax.put(`${agileBase}/issue/rank`, payload);
        previousLastKey = issues[issues.length - 1];
    }
}

export async function createSprint(boardId: number, sprint: SprintUpdate): Promise<PlannerSprint> {
    const { $ajax } = inject('AjaxService');
    const created = await $ajax.post<RawSprint>(`${agileBase}/sprint`, {
        name: sprint.name,
        goal: sprint.goal || undefined,
        startDate: formatJiraDateTime(sprint.startDate),
        endDate: formatJiraDateTime(sprint.endDate),
        originBoardId: boardId,
    });
    return mapSprint(created);
}

export async function updateSprint(sprintId: number, changes: SprintUpdate): Promise<PlannerSprint> {
    const { $ajax } = inject('AjaxService');
    const payload: Record<string, unknown> = {};
    if (changes.name !== undefined) payload.name = changes.name;
    if (changes.goal !== undefined) payload.goal = changes.goal;
    if (changes.startDate !== undefined) payload.startDate = formatJiraDateTime(changes.startDate);
    if (changes.endDate !== undefined) payload.endDate = formatJiraDateTime(changes.endDate);
    if (changes.state !== undefined) payload.state = changes.state;

    const updated = await $ajax.post<RawSprint>(`${agileBase}/sprint/${sprintId}`, payload);
    return mapSprint(updated);
}

export function updateIssueFields(key: string, fields: Record<string, unknown>): Promise<unknown> {
    const { $ajax } = inject('AjaxService');
    return $ajax.put(`~/rest/api/2/issue/${encodeURIComponent(key)}`, { fields });
}

export async function setIssueProperty(key: string, propertyKey: string, value: unknown): Promise<unknown> {
    ensureStorageAllowed();
    assertPropertySize(value, `The plan of ${key}`);
    const { $ajax } = inject('AjaxService');
    return $ajax.put(`~/rest/api/2/issue/${encodeURIComponent(key)}/properties/${propertyKey}`, value);
}

export async function deleteIssueProperty(key: string, propertyKey: string): Promise<unknown> {
    ensureStorageAllowed();
    const { $ajax } = inject('AjaxService');
    return $ajax.delete(`~/rest/api/2/issue/${encodeURIComponent(key)}/properties/${propertyKey}`);
}

export async function getBoardPropertyDirect<T>(boardId: number, propertyKey: string): Promise<T | null> {
    const { $ajax } = inject('AjaxService');
    try {
        const result = await $ajax.get<{ value: T }>(`${agileBase}/board/${boardId}/properties/${propertyKey}`);
        return result?.value ?? null;
    } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
            return null;
        }
        throw err;
    }
}

export async function setBoardPropertyDirect<T>(boardId: number, propertyKey: string, value: T, label: string): Promise<unknown> {
    ensureStorageAllowed();
    assertPropertySize(value, label);
    const { $ajax } = inject('AjaxService');
    return $ajax.put(`${agileBase}/board/${boardId}/properties/${propertyKey}`, value);
}

export async function deleteBoardProperty(boardId: number, propertyKey: string): Promise<void> {
    ensureStorageAllowed();
    const { $ajax } = inject('AjaxService');
    try {
        await $ajax.delete(`${agileBase}/board/${boardId}/properties/${propertyKey}`);
    } catch (err) {
        if ((err as { status?: number })?.status !== 404) {
            throw err;
        }
    }
}

export async function getBoardPropertyKeys(boardId: number): Promise<string[]> {
    const { $ajax } = inject('AjaxService');
    const result = await $ajax.get<{ keys?: { key: string }[] }>(`${agileBase}/board/${boardId}/properties`);
    return (result?.keys || []).map((k) => k.key);
}

export function createIssueLink(typeName: string, inwardKey: string, outwardKey: string): Promise<unknown> {
    const { $ajax } = inject('AjaxService');
    return $ajax.post('~/rest/api/2/issueLink', {
        type: { name: typeName },
        inwardIssue: { key: inwardKey },
        outwardIssue: { key: outwardKey },
    });
}

export function deleteIssueLink(linkId: string): Promise<unknown> {
    const { $ajax } = inject('AjaxService');
    return $ajax.delete(`~/rest/api/2/issueLink/${linkId}`);
}

export function getIssueLinkTypes(force?: boolean): Promise<IssueLinkType[]> {
    return getCached(
        'linkTypes',
        cacheTtl.metadata,
        async () => {
            const { $ajax } = inject('AjaxService');
            const result = await $ajax.get<{ issueLinkTypes?: IssueLinkType[] }>('~/rest/api/2/issueLinkType');
            return (result.issueLinkTypes || []).map(({ id, name, inward, outward }) => ({ id, name, inward, outward }));
        },
        force,
    );
}

export function getMyPermissions(projectKey: string | undefined, force?: boolean): Promise<JiraPermissions> {
    return getCached(
        `permissions_${projectKey || 'global'}`,
        cacheTtl.permissions,
        async () => {
            const { $ajax } = inject('AjaxService');
            const params: Record<string, string> = { permissions: permissionKeys.join(',') };
            if (projectKey) {
                params.projectKey = projectKey;
            }
            const result = await $ajax.get<{ permissions: Record<string, { havePermission: boolean }> }>(
                prepareUrlWithQueryString('~/rest/api/2/mypermissions', params),
            );
            const has = (key: (typeof permissionKeys)[number]) => !!result.permissions?.[key]?.havePermission;
            return {
                manageSprints: has('MANAGE_SPRINTS_PERMISSION'),
                editIssues: has('EDIT_ISSUES'),
                scheduleIssues: has('SCHEDULE_ISSUES'),
                createIssues: has('CREATE_ISSUES'),
                linkIssues: has('LINK_ISSUES'),
                assignIssues: has('ASSIGN_ISSUES'),
            };
        },
        force,
    );
}

export interface VelocityChartEntry {
    sprintId: number;
    estimated: number;
    completed: number;
}

export async function getVelocityChart(boardId: number): Promise<VelocityChartEntry[]> {
    const { $ajax } = inject('AjaxService');
    const result = await $ajax.get<{
        velocityStatEntries?: Record<string, { estimated?: { value?: number }; completed?: { value?: number } }>;
    }>(`~/rest/greenhopper/1.0/rapid/charts/velocity.json?rapidViewId=${boardId}`);

    return Object.entries(result.velocityStatEntries || {}).map(([sprintId, entry]) => ({
        sprintId: Number(sprintId),
        estimated: entry.estimated?.value || 0,
        completed: entry.completed?.value || 0,
    }));
}

export function getAssigneeFieldValue(userId: string | null): Record<string, string> | null {
    if (!userId) {
        return null;
    }
    return isCloud() ? { accountId: userId } : { name: userId };
}

export function getJiraErrorMessage(err: unknown): string {
    const error = (err as { error?: { errorMessages?: string[]; errors?: Record<string, string> }; response?: string })?.error;
    const messages = [...(error?.errorMessages || []), ...Object.values(error?.errors || {})];
    if (messages.length) {
        return messages.join(' ');
    }
    return (err as { response?: string })?.response || (err as Error)?.message || 'Request failed';
}

export function getRequiredFieldErrors(err: unknown): string[] {
    const errors = (err as { error?: { errors?: Record<string, string> } })?.error?.errors || {};
    return Object.keys(errors);
}

export interface ProjectVersion {
    id: string;
    name: string;
    releaseDate: string | null;
    released: boolean;
    projectKey: string;
}

export async function getProjectVersions(projectKeys: string[], force?: boolean): Promise<ProjectVersion[]> {
    const lists = await Promise.all(
        [...new Set(projectKeys.filter(Boolean))].map((projectKey) =>
            getCached(
                `versions_${projectKey}`,
                60,
                async () => {
                    const { $ajax } = inject('AjaxService');
                    const versions = await $ajax.get<{ id: string; name: string; releaseDate?: string; released?: boolean; archived?: boolean }[]>(
                        `~/rest/api/2/project/${encodeURIComponent(projectKey)}/versions`,
                    );
                    return (versions || [])
                        .filter((v) => !v.archived && v.releaseDate)
                        .map((v) => ({ id: v.id, name: v.name, releaseDate: v.releaseDate || null, released: !!v.released, projectKey }));
                },
                force,
            ).catch((err) => {
                console.warn('Unable to read the versions of', projectKey, err);
                return [] as ProjectVersion[];
            }),
        ),
    );
    return lists.flat();
}
