import { addDays } from 'date-fns';

import { isPluginBuild } from '@/constants/build-info';

import { inject } from '@services';

import { buildScheduleIndex, toTeamMember, type LeaveIndex } from './availability';
import { clearPlannerCache, readCache } from './cache';
import { getEstimateUnit, getSprintRanges, type EstimateUnit, type SprintRange } from './capacity';
import { backlogPageSize, maxSprintIssuePages, searchPageSize, shownClosedSprintCount } from './constants';
import { getIssueFields, mapPlannerIssue, plannerIssueProperties, type IssueMapContext } from './issue-mapper';
import { getBoardConfig, getBoardSprints, getFieldIds, getMyPermissions, searchIssuePages } from './jira-api';
import { getTodayKey, overlapsRange } from './leave-records';
import { loadCalendarLeave, type CalendarLeaveResult } from './leave-sources';
import { loadStoredLeave } from './leave-store';
import { parseDateKey, toDateKey } from './segments';
import { loadTeamDefinition } from './team-store';
import type {
    BoardConfig,
    JiraPermissions,
    LeaveEntry,
    LeaveSourceConfig,
    PlannerBoard,
    PlannerFieldIds,
    PlannerIssue,
    PlannerSprint,
    PlannerUser,
    StatusCategory,
    SubtaskMode,
    TeamDefinition,
    TeamMember,
    UnmappedLeave,
} from './types';

export const backlogColumnId = 'backlog';

export interface ParentInfo {
    key: string;
    summary: string;
    statusCategory: StatusCategory;
    issueType: string;
    color: string | null;
    dueDate: Date | null;
    startDate: Date | null;
    parentKey: string | null;
    url: string;
}

export interface BoardLoadOptions {
    subtaskMode: SubtaskMode;
    showClosedSprints: boolean;
    startDateField: string;
    dueDateField: string;
    backlogLimit: number;
    force?: boolean;
}

export interface LeaveWindow {
    start: string;
    end: string;
}

export interface LeaveData {
    window: LeaveWindow;
    manual: LeaveEntry[];
    entries: LeaveEntry[];
    stored: LeaveEntry[];
    live: Record<string, LeaveEntry[]>;
    unmapped: UnmappedLeave[];
    errors: { sourceName: string; message: string }[];
}

export interface LeaveLoadOptions {
    force?: boolean;
    readCalendars?: boolean;
}

export interface BoardData {
    board: PlannerBoard;
    config: BoardConfig;
    fieldIds: PlannerFieldIds;
    estimateUnit: EstimateUnit;
    sprints: PlannerSprint[];
    sprintRanges: Map<number, SprintRange>;
    issues: Record<string, PlannerIssue>;
    columns: Record<string, string[]>;
    backlogNextToken: string | null;
    parents: Record<string, ParentInfo>;
    team: TeamDefinition;
    members: TeamMember[];
    leave: LeaveData;
    leaveIndex: LeaveIndex;
    permissions: JiraPermissions;
    mapContext: IssueMapContext;
    loadedAt: number;
}

const parentFields = ['summary', 'status', 'issuetype', 'parent', 'duedate'];
const leaveFallbackDays = 90;
const noCalendarLeave: CalendarLeaveResult = { live: {}, unmapped: [], errors: [] };

export function isLeaveSourceAvailable(source: LeaveSourceConfig): boolean {
    const { $session } = inject('SessionService');
    const isCloud = !!$session.CurrentUser?.isAtlasCloud;
    if (source.type === 'confluence') {
        return !isCloud && !isPluginBuild;
    }
    if (source.type === 'google') {
        return !isPluginBuild;
    }
    return true;
}

export async function resolveBoard(boardId: number, knownConfig?: BoardConfig): Promise<PlannerBoard> {
    const board = readCache<PlannerBoard[]>('boards')?.find((b) => b.id === boardId);
    if (board) {
        return board;
    }
    const config = knownConfig || (await getBoardConfig(boardId));
    return { id: boardId, name: config.name, type: config.type, projectKey: config.projectKey, projectId: config.projectId };
}

function quoteJqlList(values: string[]): string {
    return values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',');
}

export function getBoardFilterJql(config: BoardConfig): string {
    return config.filterId ? `filter = ${config.filterId}` : '';
}

function joinJql(...clauses: string[]): string {
    return clauses.filter(Boolean).map((c) => `(${c})`).join(' AND ');
}

function isParentLevel(issue: PlannerIssue): boolean {
    return issue.hierarchyLevel >= 1 || (issue.hierarchyLevel === 0 && issue.issueType.toLowerCase() === 'epic');
}

export async function resolveTeamMembers(team: TeamDefinition, issues: PlannerIssue[]): Promise<TeamMember[]> {
    const users = new Map<string, PlannerUser>();
    const add = (user: PlannerUser | null | undefined) => {
        if (user?.id && !users.has(user.id)) {
            users.set(user.id, user);
        }
    };

    if (team.memberSource === 'group' && team.groupName) {
        const { $usergroup } = inject('UserGroupService');
        const groups = ((await $usergroup.getUserGroups()) || []) as { name: string; users?: { accountId?: string; name?: string; displayName?: string; emailAddress?: string; avatarUrls?: Record<string, string> }[] }[];
        const group = groups.find((g) => g.name === team.groupName);
        (group?.users || []).forEach((u) =>
            add({
                id: u.accountId || u.name || '',
                displayName: u.displayName || u.name || '',
                email: u.emailAddress,
                avatarUrl: u.avatarUrls?.['24x24'] || u.avatarUrls?.['32x32'],
            }),
        );
    } else if (team.memberSource === 'atlassianTeam' && team.atlassianTeamId) {
        issues.filter((i) => i.teamId === team.atlassianTeamId).forEach((i) => add(i.assignee));
    } else {
        issues.forEach((i) => add(i.assignee));
    }

    team.members.forEach((m) => add(m));
    const excluded = new Set(team.excludedMemberIds);

    return [...users.values()]
        .filter((u) => !excluded.has(u.id))
        .map((u) => toTeamMember(u, team))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function loadParents(keys: string[], mapContext: IssueMapContext, existing: Record<string, ParentInfo>): Promise<Record<string, ParentInfo>> {
    const missing = [...new Set(keys)].filter((k) => k && !existing[k]).slice(0, searchPageSize);
    if (!missing.length) {
        return existing;
    }

    const { fieldIds } = mapContext;
    const fields = [...parentFields, fieldIds.epicColor, fieldIds.startDate, fieldIds.parentLink, fieldIds.dueDate].filter((f): f is string => !!f);
    const { issues } = await searchIssuePages(`key in (${missing.join(',')})`, fields, { pageSize: missing.length });
    const result = { ...existing };

    for (const raw of issues) {
        const issue = mapPlannerIssue(raw, mapContext);
        result[issue.key] = {
            key: issue.key,
            summary: issue.summary,
            statusCategory: issue.statusCategory,
            issueType: issue.issueType,
            color: issue.color,
            dueDate: issue.dueDate,
            startDate: issue.startDate,
            parentKey: issue.parentKey,
            url: issue.url,
        };
    }
    return result;
}

export function getLeaveWindow(ranges: { start: Date; end: Date }[]): LeaveWindow {
    if (!ranges.length) {
        const today = getTodayKey();
        return { start: today, end: toDateKey(addDays(parseDateKey(today), leaveFallbackDays)) };
    }
    const start = ranges.reduce((min, r) => (r.start < min ? r.start : min), ranges[0].start);
    const end = ranges.reduce((max, r) => (r.end > max ? r.end : max), ranges[0].end);
    return { start: toDateKey(start), end: toDateKey(end) };
}

function toErrorMessage(err: unknown, fallback: string): string {
    return (err as Error)?.message || fallback;
}

export function combineLeave(
    stored: LeaveEntry[],
    live: Record<string, LeaveEntry[]>,
    liveWindow: LeaveWindow,
    team: TeamDefinition,
    range: LeaveWindow,
): { manual: LeaveEntry[]; entries: LeaveEntry[] } {
    const sourceIds = new Set(team.leaveSources.map((s) => s.id));
    const copies = stored.filter(
        (e) => e.source !== 'manual' && !!e.sourceId && sourceIds.has(e.sourceId) && !(live[e.sourceId] && overlapsRange(e, liveWindow.start, liveWindow.end)),
    );
    const liveEntries = Object.values(live)
        .flat()
        .filter((e) => overlapsRange(e, range.start, range.end));
    return { manual: stored.filter((e) => e.source === 'manual'), entries: [...liveEntries, ...copies] };
}

export async function loadLeave(
    boardId: number,
    team: TeamDefinition,
    members: TeamMember[],
    ranges: { start: Date; end: Date }[],
    options: LeaveLoadOptions = {},
): Promise<LeaveData> {
    const window = getLeaveWindow(ranges);
    const errors: LeaveData['errors'] = [];
    const readCalendars = options.readCalendars !== false && team.leaveSources.length > 0;

    const [stored, calendar] = await Promise.all([
        loadStoredLeave(boardId, window.start, window.end, options.force).catch((err) => {
            errors.push({ sourceName: 'Leave stored for the board', message: toErrorMessage(err, 'Unable to read the leave') });
            return [] as LeaveEntry[];
        }),
        readCalendars
            ? loadCalendarLeave(team, members, parseDateKey(window.start), addDays(parseDateKey(window.end), 1), isLeaveSourceAvailable, options.force).catch(
                  (err): CalendarLeaveResult => ({ ...noCalendarLeave, errors: [{ sourceName: 'Calendars', message: toErrorMessage(err, 'Unable to read calendars') }] }),
              )
            : Promise.resolve(noCalendarLeave),
    ]);

    const combined = combineLeave(stored, calendar.live, window, team, window);

    return {
        window,
        manual: combined.manual,
        entries: combined.entries,
        stored,
        live: calendar.live,
        unmapped: calendar.unmapped,
        errors: [...errors, ...calendar.errors],
    };
}

export function buildBoardLeaveIndex(leave: LeaveData): LeaveIndex {
    return buildScheduleIndex(leave.manual, leave.entries);
}

export async function loadBoardData(boardId: number, opts: BoardLoadOptions): Promise<BoardData> {
    if (opts.force) {
        clearPlannerCache([`sprints_${boardId}_`, `team_${boardId}`]);
    }

    const [config, fieldIds] = await Promise.all([getBoardConfig(boardId, opts.force), getFieldIds(opts.startDateField, opts.dueDateField)]);
    const board = await resolveBoard(boardId, config);

    const isScrum = config.type !== 'kanban';
    const [openSprints, closedSprints, team, permissions] = await Promise.all([
        isScrum ? getBoardSprints(boardId, ['active', 'future'], opts.force) : Promise.resolve([] as PlannerSprint[]),
        isScrum && opts.showClosedSprints ? getBoardSprints(boardId, ['closed'], false, true) : Promise.resolve([] as PlannerSprint[]),
        loadTeamDefinition(boardId, opts.force),
        getMyPermissions(config.projectKey || board.projectKey, opts.force),
    ]);

    const recentClosed = closedSprints
        .filter((s) => s.completeDate)
        .sort((a, b) => a.completeDate!.getTime() - b.completeDate!.getTime())
        .slice(-shownClosedSprintCount);
    const sprints = orderSprints([...recentClosed, ...openSprints]);
    const mapContext: IssueMapContext = {
        fieldIds,
        estimationFieldId: config.estimationFieldId,
        rollupSubtasks: opts.subtaskMode === 'rollup',
    };
    const fields = getIssueFields(mapContext);
    const filterJql = getBoardFilterJql(config);
    const subtaskJql = opts.subtaskMode === 'rollup' ? 'issuetype not in subTaskIssueTypes()' : '';
    const doneJql = config.doneStatusIds.length ? `status not in (${quoteJqlList(config.doneStatusIds)})` : 'statusCategory != Done';

    const sprintIds = sprints.map((s) => s.id);
    const [sprintResult, backlogResult] = await Promise.all([
        sprintIds.length
            ? searchIssuePages(`${joinJql(`sprint in (${sprintIds.join(',')})`, filterJql, subtaskJql)} ORDER BY Rank ASC`, fields, {
                  properties: plannerIssueProperties,
                  maxPages: maxSprintIssuePages,
              })
            : Promise.resolve({ issues: [], nextPageToken: null }),
        config.type === 'kanban'
            ? searchIssuePages(`${joinJql(filterJql, doneJql, subtaskJql)} ORDER BY Rank ASC`, fields, {
                  properties: plannerIssueProperties,
                  maxPages: maxSprintIssuePages,
              })
            : searchIssuePages(
                  `${joinJql(filterJql, 'sprint is EMPTY OR (sprint not in openSprints() AND sprint not in futureSprints())', doneJql, 'issuetype not in subTaskIssueTypes()')} ORDER BY Rank ASC`,
                  fields,
                  { properties: plannerIssueProperties, pageSize: Math.min(opts.backlogLimit, backlogPageSize) },
              ),
    ]);

    const issues: Record<string, PlannerIssue> = {};
    const columns: Record<string, string[]> = { [backlogColumnId]: [] };
    sprintIds.forEach((id) => (columns[String(id)] = []));
    const parentsFromIssues: Record<string, ParentInfo> = {};

    const place = (issue: PlannerIssue, fromBacklog: boolean) => {
        if (isParentLevel(issue)) {
            parentsFromIssues[issue.key] = {
                key: issue.key,
                summary: issue.summary,
                statusCategory: issue.statusCategory,
                issueType: issue.issueType,
                color: issue.color,
                dueDate: issue.dueDate,
                startDate: issue.startDate,
                parentKey: issue.parentKey,
                url: issue.url,
            };
            return;
        }
        issues[issue.key] = issue;
        const columnId = fromBacklog ? backlogColumnId : getIssueColumn(issue, sprintIds);
        if (columnId && !columns[columnId].includes(issue.key)) {
            columns[columnId].push(issue.key);
        }
    };

    sprintResult.issues.forEach((raw) => place(mapPlannerIssue(raw, mapContext), false));
    backlogResult.issues.forEach((raw) => {
        const issue = mapPlannerIssue(raw, mapContext);
        if (!issues[issue.key]) {
            place(issue, true);
        }
    });

    const issueList = Object.values(issues);
    const parentKeys = issueList.map((i) => i.epicKey || (i.isSubtask ? null : i.parentKey)).filter((k): k is string => !!k);
    const [parents, members] = await Promise.all([
        loadParents(parentKeys, mapContext, parentsFromIssues).catch((err) => {
            console.warn('Unable to load the parents of the board issues', err);
            return parentsFromIssues;
        }),
        resolveTeamMembers(team, issueList),
    ]);

    const sprintRanges = getSprintRanges(sprints.filter((s) => s.state !== 'closed'));
    const leave = await loadLeave(boardId, team, members, [...sprintRanges.values()], { force: opts.force });

    return {
        board,
        config,
        fieldIds,
        estimateUnit: getEstimateUnit(config.estimationFieldId),
        sprints,
        sprintRanges,
        issues,
        columns,
        backlogNextToken: backlogResult.nextPageToken,
        parents,
        team,
        members,
        leave,
        leaveIndex: buildBoardLeaveIndex(leave),
        permissions,
        mapContext,
        loadedAt: Date.now(),
    };
}

export async function loadMoreBacklog(data: BoardData, backlogLimit: number): Promise<Pick<BoardData, 'issues' | 'columns' | 'backlogNextToken'>> {
    if (!data.backlogNextToken) {
        return { issues: data.issues, columns: data.columns, backlogNextToken: null };
    }
    const { config, mapContext } = data;
    const doneJql = config.doneStatusIds.length ? `status not in (${quoteJqlList(config.doneStatusIds)})` : 'statusCategory != Done';
    const result = await searchIssuePages(
        `${joinJql(getBoardFilterJql(config), 'sprint is EMPTY OR (sprint not in openSprints() AND sprint not in futureSprints())', doneJql, 'issuetype not in subTaskIssueTypes()')} ORDER BY Rank ASC`,
        getIssueFields(mapContext),
        { properties: plannerIssueProperties, pageSize: Math.min(backlogLimit, backlogPageSize), nextPageToken: data.backlogNextToken },
    );

    const issues = { ...data.issues };
    const backlog = [...data.columns[backlogColumnId]];
    for (const raw of result.issues) {
        const issue = mapPlannerIssue(raw, mapContext);
        if (!issues[issue.key] && !isParentLevel(issue)) {
            issues[issue.key] = issue;
            backlog.push(issue.key);
        }
    }
    return { issues, columns: { ...data.columns, [backlogColumnId]: backlog }, backlogNextToken: result.nextPageToken };
}

export function getIssueColumn(issue: PlannerIssue, sprintIds: number[]): string | null {
    if (issue.currentSprintId && sprintIds.includes(issue.currentSprintId)) {
        return String(issue.currentSprintId);
    }
    const inBoardSprint = [...issue.sprintIds].reverse().find((id) => sprintIds.includes(id));
    return inBoardSprint ? String(inBoardSprint) : null;
}

const stateOrder: Record<PlannerSprint['state'], number> = { closed: 0, active: 1, future: 2 };

export function orderSprints(sprints: PlannerSprint[]): PlannerSprint[] {
    const position = new Map(sprints.map((s, index) => [s.id, index]));
    return [...sprints].sort((a, b) => {
        const byState = stateOrder[a.state] - stateOrder[b.state];
        if (byState) {
            return byState;
        }
        if (a.state === 'closed') {
            return (a.completeDate?.getTime() || 0) - (b.completeDate?.getTime() || 0);
        }
        if (a.state === 'active') {
            return (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0);
        }
        return (position.get(a.id) || 0) - (position.get(b.id) || 0);
    });
}
