import { addDays, format, subDays } from 'date-fns';

import { inject } from '@services';

import {
    backlogColumnId,
    buildBoardLeaveIndex,
    combineLeave,
    loadBoardData,
    loadLeave,
    loadMoreBacklog,
    orderSprints,
    resolveTeamMembers,
    type BoardData,
} from '../shared/board-loader';
import { getSprintRanges } from '../shared/capacity';
import { readCache, writeCache } from '../shared/cache';
import { cacheTtl, icsImportFutureDays, icsImportPastDays, leaveListFutureDays, leaveListPastDays, segmentsPropertyKey } from '../shared/constants';
import { getIssueFields, mapPlannerIssue, plannerIssueProperties } from '../shared/issue-mapper';
import {
    createIssueLink,
    createSprint as createSprintApi,
    deleteIssueLink,
    getAssigneeFieldValue,
    getIssuesByKey,
    getJiraErrorMessage,
    moveIssuesToBacklog,
    moveIssuesToSprint,
    rankIssues,
    setIssueProperty,
    updateIssueFields,
    updateSprint,
    type RankPosition,
    type SprintUpdate,
} from '../shared/jira-api';
import { isSameLeaveSet } from '../shared/leave-records';
import { readIcsLeave } from '../shared/leave-sources';
import { deleteSourceLeave, loadStoredLeave, replaceSourceLeave, saveLeaveEntries } from '../shared/leave-store';
import { getSegmentsSpan, serializeSegments, toDateKey } from '../shared/segments';
import { isStorageAllowed, setStorageConsent } from '../shared/storage-consent';
import { isPermissionError, saveTeamDefinition, TeamConflictError } from '../shared/team-store';
import type { LeaveEntry, PlannedSegment, PlannerIssue, PlannerSprint, PlannerUser, StoredCalendarEvent, TeamDefinition, UnmappedLeave } from '../shared/types';
import { loadVelocity } from '../shared/velocity';
import { normalizePlannerSettings, savePlannerSettings, type PlannerSettings } from './planner-settings';
import { usePlannerStore, type DraftChange, type DraftResult, type IssueEdit } from './store';

export type { IssueEdit };

export type CompleteSprintTarget = { kind: 'backlog' } | { kind: 'sprint'; sprintId: number } | { kind: 'new'; name: string };

const reloadSettingKeys: (keyof PlannerSettings)[] = ['subtaskMode', 'showClosedSprints', 'startDateField', 'dueDateField', 'backlogLimit'];
const teamReadOnlyMessage = 'Your Jira permissions do not allow changing the settings stored on this board. Ask a board administrator to make the change.';

let loadSequence = 0;

function getState() {
    return usePlannerStore.getState();
}

function setData(updater: (data: BoardData) => BoardData) {
    const { data } = getState();
    if (data) {
        usePlannerStore.setState({ data: updater(data) });
    }
}

function showError(message: string, title = 'Planner') {
    const { $message } = inject('MessageService');
    $message.error(message, title);
}

function showSuccess(message: string) {
    const { $message } = inject('MessageService');
    $message.success(message);
}

function createChangeId(): string {
    return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function isDraft(): boolean {
    return getState().draft.enabled;
}

function addDraftChange(change: DraftChange, before: BoardData) {
    const { draft } = getState();
    usePlannerStore.setState({
        draft: { ...draft, changes: [...draft.changes, change], snapshot: draft.snapshot || before, results: [] },
    });
}

function setSaving(keys: string[], saving: boolean) {
    const current = { ...getState().saving };
    keys.forEach((k) => {
        if (saving) {
            current[k] = true;
        } else {
            delete current[k];
        }
    });
    usePlannerStore.setState({ saving: current });
}

function buildLoadOptions(settings: PlannerSettings, force?: boolean) {
    return {
        subtaskMode: settings.subtaskMode,
        showClosedSprints: settings.showClosedSprints,
        startDateField: settings.startDateField,
        dueDateField: settings.dueDateField,
        backlogLimit: settings.backlogLimit,
        force,
    };
}

export async function loadBoard(boardId: number | null, force?: boolean): Promise<void> {
    const sequence = ++loadSequence;
    if (!boardId) {
        usePlannerStore.setState({ activeBoardId: null, data: null, error: null, isLoading: false, velocity: null });
        return;
    }

    const { activeBoardId } = getState();
    usePlannerStore.setState({
        activeBoardId: boardId,
        isLoading: true,
        error: null,
        ...(activeBoardId !== boardId ? { data: null, velocity: null, selection: [], highlightParent: null } : {}),
    });

    try {
        const data = await loadBoardData(boardId, buildLoadOptions(getState().settings, force));
        if (sequence !== loadSequence) {
            return;
        }
        usePlannerStore.setState({ data, isLoading: false, teamReadOnlyReason: null });
        if (force || getState().velocity === null) {
            loadVelocityData(force);
        }
        shareCalendarCopies(data);
    } catch (err) {
        if (sequence !== loadSequence) {
            return;
        }
        usePlannerStore.setState({ isLoading: false, error: getJiraErrorMessage(err) });
    }
}

function addLeaveError(boardId: number, sourceName: string, message: string) {
    setData((current) =>
        current.board.id === boardId ? { ...current, leave: { ...current.leave, errors: [...current.leave.errors, { sourceName, message }] } } : current,
    );
}

async function shareCalendarCopies(data: BoardData) {
    const { board, leave, team } = data;
    if (!isStorageAllowed()) {
        return;
    }
    for (const [sourceId, live] of Object.entries(leave.live)) {
        const throttleKey = `leave_sync_${board.id}_${sourceId}`;
        if (readCache<boolean>(throttleKey) || isSameLeaveSet(leave.stored.filter((e) => e.sourceId === sourceId), live)) {
            continue;
        }
        writeCache(throttleKey, true, cacheTtl.leaveSyncThrottle);
        try {
            await replaceSourceLeave(board.id, sourceId, leave.window.start, leave.window.end, live);
        } catch (err) {
            if (isPermissionError(err)) {
                writeCache(throttleKey, true, cacheTtl.leaveSyncDenied);
                continue;
            }
            const name = team.leaveSources.find((s) => s.id === sourceId)?.name || 'Calendar';
            addLeaveError(board.id, name, `not shared with the team: ${getJiraErrorMessage(err)}`);
        }
    }
}

export async function loadVelocityData(force?: boolean): Promise<void> {
    const { data } = getState();
    if (!data) {
        return;
    }
    usePlannerStore.setState({ isVelocityLoading: true, velocityError: null });
    try {
        const velocity = await loadVelocity(data.config, data.fieldIds, force);
        if (getState().data?.board.id === data.board.id) {
            usePlannerStore.setState({ velocity, isVelocityLoading: false });
        }
    } catch (err) {
        usePlannerStore.setState({ velocity: [], isVelocityLoading: false, velocityError: getJiraErrorMessage(err) });
    }
}

export function refreshBoard(): Promise<void> {
    return loadBoard(getState().activeBoardId, true);
}

export async function changeSettings(changes: Partial<PlannerSettings>): Promise<void> {
    const previous = getState().settings;
    const settings = normalizePlannerSettings({ ...previous, ...changes });
    usePlannerStore.setState({ settings });
    savePlannerSettings(settings).catch((err) => console.error('Failed to save planner settings', err));

    if (reloadSettingKeys.some((key) => JSON.stringify(previous[key]) !== JSON.stringify(settings[key]))) {
        await loadBoard(getState().activeBoardId);
    }
}

export function savePanelSize(panelId: string, size: number) {
    const { settings } = getState();
    changeSettings({ panelSizes: { ...settings.panelSizes, [panelId]: Math.round(size) } });
}

export async function loadMore(): Promise<void> {
    const { data, settings } = getState();
    if (!data?.backlogNextToken) {
        return;
    }
    try {
        const more = await loadMoreBacklog(data, settings.backlogLimit);
        setData((current) => ({ ...current, ...more }));
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to load more backlog items');
    }
}

export function toggleCollapsedColumn(columnId: string, collapsed: boolean) {
    const { settings, activeBoardId } = getState();
    if (!activeBoardId) {
        return;
    }
    const boardKey = String(activeBoardId);
    const current = new Set(settings.collapsedColumns[boardKey] || []);
    if (collapsed) {
        current.add(columnId);
    } else {
        current.delete(columnId);
    }
    changeSettings({ collapsedColumns: { ...settings.collapsedColumns, [boardKey]: [...current] } });
}

function computeRank(columnKeys: string[], movedKeys: string[], toIndex: number): { keys: string[]; rank: RankPosition } {
    const remaining = columnKeys.filter((k) => !movedKeys.includes(k));
    const index = Math.max(0, Math.min(toIndex, remaining.length));
    const rank: RankPosition = remaining[index] ? { beforeKey: remaining[index] } : index > 0 ? { afterKey: remaining[index - 1] } : {};
    const keys = [...remaining.slice(0, index), ...movedKeys, ...remaining.slice(index)];
    return { keys, rank };
}

function applyMoveLocally(data: BoardData, keys: string[], toColumn: string, toIndex: number): { data: BoardData; rank: RankPosition } {
    const columns: Record<string, string[]> = {};
    for (const [columnId, columnKeys] of Object.entries(data.columns)) {
        columns[columnId] = columnId === toColumn ? columnKeys : columnKeys.filter((k) => !keys.includes(k));
    }
    const { keys: targetKeys, rank } = computeRank(data.columns[toColumn] || [], keys, toIndex);
    columns[toColumn] = targetKeys;

    const sprintId = toColumn === backlogColumnId ? null : Number(toColumn);
    const issues = { ...data.issues };
    for (const key of keys) {
        const issue = issues[key];
        if (issue) {
            issues[key] = {
                ...issue,
                currentSprintId: sprintId,
                sprintIds: sprintId ? [...issue.sprintIds.filter((id) => id !== sprintId), sprintId] : issue.sprintIds,
            };
        }
    }
    return { data: { ...data, columns, issues }, rank };
}

async function writeMove(keys: string[], toColumn: string, rank: RankPosition, rankFieldId: string | null) {
    if (toColumn === backlogColumnId) {
        await moveIssuesToBacklog(keys);
        await rankIssues(keys, rank, rankFieldId);
    } else {
        await moveIssuesToSprint(Number(toColumn), keys, rank);
    }
}

function describeColumn(data: BoardData, columnId: string): string {
    return columnId === backlogColumnId ? 'Backlog' : data.sprints.find((s) => String(s.id) === columnId)?.name || 'sprint';
}

export function findIssueColumn(data: BoardData, key: string): string | null {
    return Object.keys(data.columns).find((columnId) => data.columns[columnId].includes(key)) || null;
}

/** Moves the issues to the column at the given position. Writes sprint membership and rank to Jira (or stages them in draft mode). */
export async function moveIssues(keys: string[], toColumn: string, toIndex: number): Promise<boolean> {
    const { data } = getState();
    if (!data || !keys.length) {
        return false;
    }

    const before = data;
    const { data: updated, rank } = applyMoveLocally(data, keys, toColumn, toIndex);
    usePlannerStore.setState({ data: updated, selection: [] });

    const label = `Move ${keys.length > 1 ? `${keys.length} issues` : keys[0]} to ${describeColumn(data, toColumn)}`;
    if (isDraft()) {
        addDraftChange({ id: createChangeId(), kind: 'move', label, keys, toColumn, rank }, before);
        return true;
    }

    setSaving(keys, true);
    try {
        await writeMove(keys, toColumn, rank, data.config.rankFieldId);
        return true;
    } catch (err) {
        if (getState().data === updated) {
            usePlannerStore.setState({ data: before });
        }
        showError(getJiraErrorMessage(err), `Unable to move ${keys.join(', ')}`);
        loadBoard(data.board.id);
        return false;
    } finally {
        setSaving(keys, false);
    }
}

function buildFieldsPayload(issue: PlannerIssue, edit: IssueEdit, data: BoardData): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    if (edit.assignee !== undefined) {
        fields.assignee = getAssigneeFieldValue(edit.assignee?.id || null);
    }
    if (edit.estimate !== undefined) {
        if (data.estimateUnit === 'hours') {
            fields.timetracking = { originalEstimate: edit.estimate ? `${edit.estimate}h` : '' };
        } else {
            const field = data.config.estimationFieldId || data.fieldIds.storyPoints;
            if (field) {
                fields[field] = edit.estimate;
            }
        }
    }
    if (edit.startDate !== undefined && data.fieldIds.startDate) {
        fields[data.fieldIds.startDate] = edit.startDate ? format(edit.startDate, 'yyyy-MM-dd') : null;
    }
    if (edit.dueDate !== undefined) {
        fields[data.fieldIds.dueDate || 'duedate'] = edit.dueDate ? format(edit.dueDate, 'yyyy-MM-dd') : null;
    }
    return fields;
}

function applyEditLocally(issue: PlannerIssue, edit: IssueEdit, data: BoardData): PlannerIssue {
    const updated = { ...issue };
    if (edit.assignee !== undefined) {
        updated.assignee = edit.assignee;
    }
    if (edit.estimate !== undefined) {
        if (data.estimateUnit === 'hours') {
            const seconds = edit.estimate ? edit.estimate * 3600 : null;
            updated.originalEstimate = seconds;
            updated.remainingEstimate = seconds;
        } else {
            updated.points = edit.estimate;
        }
    }
    if (edit.startDate !== undefined) {
        updated.startDate = edit.startDate;
    }
    if (edit.dueDate !== undefined) {
        updated.dueDate = edit.dueDate;
    }
    return updated;
}

/** Updates the fields of several issues. Used by quick edit, roadmap drag and resource timeline drag. */
export async function updateIssues(edits: { key: string; edit: IssueEdit }[]): Promise<void> {
    const { data } = getState();
    if (!data || !edits.length) {
        return;
    }

    const before = data;
    const issues = { ...data.issues };
    const payloads: { key: string; fields: Record<string, unknown>; edit: IssueEdit }[] = [];
    for (const { key, edit } of edits) {
        const issue = issues[key];
        if (!issue) {
            continue;
        }
        issues[key] = applyEditLocally(issue, edit, data);
        const fields = buildFieldsPayload(issue, edit, data);
        if (Object.keys(fields).length) {
            payloads.push({ key, fields, edit });
        }
    }
    const updated = { ...data, issues };
    usePlannerStore.setState({ data: updated });

    if (isDraft()) {
        payloads.forEach(({ key, fields, edit }) => addDraftChange({ id: createChangeId(), kind: 'fields', label: `Update ${key}`, key, fields, edit }, before));
        return;
    }

    const keys = payloads.map((p) => p.key);
    setSaving(keys, true);
    const failures: string[] = [];
    await Promise.all(
        payloads.map(async ({ key, fields }) => {
            try {
                await updateIssueFields(key, fields);
            } catch (err) {
                failures.push(`${key}: ${getJiraErrorMessage(err)}`);
                const current = getState().data;
                if (current) {
                    usePlannerStore.setState({ data: { ...current, issues: { ...current.issues, [key]: before.issues[key] } } });
                }
            }
        }),
    );
    setSaving(keys, false);
    if (failures.length) {
        showError(failures.join('\n'), 'Unable to update issues');
    }
}

export function updateIssue(key: string, edit: IssueEdit): Promise<void> {
    return updateIssues([{ key, edit }]);
}

/** Saves the planned segments of an issue and keeps the native start/due dates in sync with their outer span when enabled. */
export async function saveSegments(key: string, segments: PlannedSegment[]): Promise<void> {
    const { data, settings } = getState();
    const issue = data?.issues[key];
    if (!data || !issue) {
        return;
    }

    const before = issue;
    const span = getSegmentsSpan(segments);
    const syncDates = settings.syncNativeDates && span;
    const updatedIssue: PlannerIssue = {
        ...issue,
        segments,
        legacySegments: false,
        ...(syncDates ? { startDate: data.fieldIds.startDate ? span.start : issue.startDate, dueDate: span.end } : {}),
    };
    usePlannerStore.setState({ data: { ...data, issues: { ...data.issues, [key]: updatedIssue } } });

    const dateEdit: IssueEdit | null = syncDates ? { startDate: span.start, dueDate: span.end } : null;
    if (isDraft()) {
        addDraftChange({ id: createChangeId(), kind: 'segments', label: `Plan of ${key}`, key, segments }, data);
        if (dateEdit) {
            addDraftChange(
                {
                    id: createChangeId(),
                    kind: 'fields',
                    label: `Dates of ${key}`,
                    key,
                    fields: buildFieldsPayload(issue, dateEdit, data),
                    edit: data.fieldIds.startDate ? dateEdit : { dueDate: dateEdit.dueDate },
                },
                data,
            );
        }
        return;
    }

    setSaving([key], true);
    try {
        await setIssueProperty(key, segmentsPropertyKey, serializeSegments(segments));
        if (dateEdit) {
            await updateIssueFields(key, buildFieldsPayload(issue, dateEdit, data));
        }
    } catch (err) {
        const current = getState().data;
        if (current) {
            usePlannerStore.setState({ data: { ...current, issues: { ...current.issues, [key]: before } } });
        }
        showError(getJiraErrorMessage(err), `Unable to save the plan of ${key}`);
    } finally {
        setSaving([key], false);
    }
}

function updateLinksLocally(data: BoardData, inwardKey: string, outwardKey: string, typeName: string, remove: boolean, linkId?: string): BoardData {
    const issues = { ...data.issues };
    const link = data.issues[inwardKey]?.links.find((l) => l.typeName === typeName);
    const typeInfo = link ? { inward: link.label, outward: link.label } : { inward: typeName, outward: typeName };

    const update = (key: string, otherKey: string, direction: 'inward' | 'outward') => {
        const issue = issues[key];
        if (!issue) {
            return;
        }
        const other = issues[otherKey];
        const links = remove
            ? issue.links.filter((l) => !(l.issueKey === otherKey && l.typeName === typeName && (!linkId || l.id === linkId)))
            : [
                  ...issue.links,
                  {
                      id: linkId || `pending-${otherKey}`,
                      typeName,
                      direction,
                      label: direction === 'outward' ? typeInfo.outward : typeInfo.inward,
                      issueKey: otherKey,
                      issueStatusCategory: other?.statusCategory || 'new',
                  },
              ];
        issues[key] = { ...issue, links };
    };

    // The inward issue of the link shows the outward description of the other issue and vice versa
    update(inwardKey, outwardKey, 'outward');
    update(outwardKey, inwardKey, 'inward');
    return { ...data, issues };
}

/** Creates a dependency by writing a Jira issue link. The blocker is the inward issue when the link type's outward text means "blocks". */
export async function createDependency(blockerKey: string, dependantKey: string): Promise<void> {
    const { data, settings } = getState();
    if (!data) {
        return;
    }
    const linkType = settings.dependencyLinkTypes[0];
    const [inwardKey, outwardKey] = linkType.outwardBlocks ? [blockerKey, dependantKey] : [dependantKey, blockerKey];
    const before = data;
    usePlannerStore.setState({ data: updateLinksLocally(data, inwardKey, outwardKey, linkType.name, false) });

    if (isDraft()) {
        addDraftChange({
            id: createChangeId(),
            kind: 'link',
            label: `${blockerKey} blocks ${dependantKey}`,
            action: 'create',
            typeName: linkType.name,
            inwardKey,
            outwardKey,
        }, before);
        return;
    }

    try {
        await createIssueLink(linkType.name, inwardKey, outwardKey);
        await reloadIssues([inwardKey, outwardKey]);
    } catch (err) {
        usePlannerStore.setState({ data: before });
        showError(getJiraErrorMessage(err), 'Unable to create the dependency');
    }
}

export async function removeDependency(linkId: string, typeName: string, inwardKey: string, outwardKey: string): Promise<void> {
    const { data } = getState();
    if (!data) {
        return;
    }
    const before = data;
    usePlannerStore.setState({ data: updateLinksLocally(data, inwardKey, outwardKey, typeName, true, linkId) });

    if (isDraft()) {
        addDraftChange({ id: createChangeId(), kind: 'link', label: `Remove link ${inwardKey} → ${outwardKey}`, action: 'delete', typeName, inwardKey, outwardKey, linkId }, before);
        return;
    }
    try {
        await deleteIssueLink(linkId);
    } catch (err) {
        usePlannerStore.setState({ data: before });
        showError(getJiraErrorMessage(err), 'Unable to remove the dependency');
    }
}

/** Re-reads the given issues in one search and replaces them in the loaded data. */
export async function reloadIssues(keys: string[]): Promise<void> {
    const { data } = getState();
    if (!data || !keys.length) {
        return;
    }
    const issues = await getIssuesByKey(keys, getIssueFields(data.mapContext), plannerIssueProperties);
    const current = getState().data;
    if (!current) {
        return;
    }
    const updated = { ...current.issues };
    issues.forEach((raw) => {
        const issue = mapPlannerIssue(raw, current.mapContext);
        if (updated[issue.key]) {
            updated[issue.key] = issue;
        }
    });
    usePlannerStore.setState({ data: { ...current, issues: updated } });
}

function replaceSprint(sprint: PlannerSprint) {
    setData((data) => {
        const sprints = data.sprints.map((s) => (s.id === sprint.id ? { ...s, ...sprint } : s));
        return { ...data, sprints, sprintRanges: getSprintRanges(sprints.filter((s) => s.state !== 'closed')) };
    });
}

export async function createSprint(details: SprintUpdate): Promise<PlannerSprint | null> {
    const { data } = getState();
    if (!data) {
        return null;
    }
    try {
        const sprint = await createSprintApi(data.board.id, details);
        setData((current) => {
            const sprints = [...current.sprints, sprint];
            return {
                ...current,
                sprints,
                columns: { ...current.columns, [String(sprint.id)]: [] },
                sprintRanges: getSprintRanges(sprints.filter((s) => s.state !== 'closed')),
            };
        });
        showSuccess(`Sprint "${sprint.name}" created`);
        return sprint;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to create the sprint');
        return null;
    }
}

export async function editSprint(sprintId: number, changes: SprintUpdate): Promise<boolean> {
    try {
        replaceSprint(await updateSprint(sprintId, changes));
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to update the sprint');
        return false;
    }
}

export async function startSprint(sprintId: number, startDate: Date, endDate: Date, goal?: string): Promise<boolean> {
    try {
        replaceSprint(await updateSprint(sprintId, { state: 'active', startDate, endDate, ...(goal !== undefined ? { goal } : {}) }));
        showSuccess('Sprint started');
        await loadBoard(getState().activeBoardId, true);
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to start the sprint');
        return false;
    }
}

export function getOpenIssueKeys(data: BoardData, sprintId: number): string[] {
    const done = new Set(data.config.doneStatusIds);
    return (data.columns[String(sprintId)] || []).filter((key) => {
        const issue = data.issues[key];
        return issue && !(done.size ? done.has(issue.statusId) : issue.statusCategory === 'done');
    });
}

/** Moves the open issues to the chosen target first and then closes the sprint, the same as Jira's complete sprint dialog. */
function applyCompletionLocally(
    data: BoardData,
    sprintId: number,
    openKeys: string[],
    targetColumn: string,
    createdSprint: PlannerSprint | null,
    keepClosed: boolean,
): BoardData {
    const sprintColumn = String(sprintId);
    const doneKeys = (data.columns[sprintColumn] || []).filter((k) => !openKeys.includes(k));
    const closed = data.sprints.map((s) => (s.id === sprintId ? { ...s, state: 'closed' as const, completeDate: new Date() } : s));
    const sprints = orderSprints([...closed.filter((s) => keepClosed || s.id !== sprintId), ...(createdSprint ? [createdSprint] : [])]);

    const columns = { ...data.columns };
    if (keepClosed) {
        columns[sprintColumn] = doneKeys;
    } else {
        delete columns[sprintColumn];
    }
    columns[targetColumn] = [...openKeys, ...(columns[targetColumn] || [])];

    const targetSprintId = targetColumn === backlogColumnId ? null : Number(targetColumn);
    const issues = { ...data.issues };
    for (const key of openKeys) {
        const issue = issues[key];
        if (issue) {
            issues[key] = {
                ...issue,
                currentSprintId: targetSprintId,
                sprintIds: targetSprintId ? [...issue.sprintIds.filter((id) => id !== targetSprintId), targetSprintId] : issue.sprintIds,
            };
        }
    }
    if (!keepClosed) {
        doneKeys.forEach((key) => delete issues[key]);
    }

    return { ...data, sprints, columns, issues, sprintRanges: getSprintRanges(sprints.filter((s) => s.state !== 'closed')) };
}

export async function completeSprint(sprintId: number, target: CompleteSprintTarget): Promise<boolean> {
    const { data } = getState();
    if (!data) {
        return false;
    }
    const openKeys = getOpenIssueKeys(data, sprintId);

    try {
        let targetColumn = backlogColumnId;
        let createdSprint: PlannerSprint | null = null;
        if (openKeys.length) {
            if (target.kind === 'backlog') {
                await moveIssuesToBacklog(openKeys);
                const firstBacklog = data.columns[backlogColumnId][0];
                if (firstBacklog) {
                    await rankIssues(openKeys, { beforeKey: firstBacklog }, data.config.rankFieldId);
                }
            } else {
                let targetId = target.kind === 'sprint' ? target.sprintId : 0;
                if (target.kind === 'new') {
                    createdSprint = await createSprintApi(data.board.id, { name: target.name });
                    targetId = createdSprint.id;
                }
                const firstKey = data.columns[String(targetId)]?.[0];
                await moveIssuesToSprint(targetId, openKeys, firstKey ? { beforeKey: firstKey } : undefined);
                targetColumn = String(targetId);
            }
        }
        await updateSprint(sprintId, { state: 'closed' });
        showSuccess('Sprint completed');
        setData((current) => applyCompletionLocally(current, sprintId, openKeys, targetColumn, createdSprint, getState().settings.showClosedSprints));
        loadVelocityData(true);
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to complete the sprint');
        await loadBoard(data.board.id, true);
        return false;
    }
}

export interface NewIssue {
    projectKey: string;
    issueTypeId: string;
    summary: string;
    estimate?: number | null;
    assignee?: PlannerUser | null;
    parentKey?: string | null;
}

/**
 * Creates an issue directly in the sprint or the backlog. When the project needs more fields than the inline form has,
 * the error is returned so the caller can open Jira's full create form instead of failing silently.
 */
export async function createIssueInColumn(columnId: string, issue: NewIssue): Promise<{ ok: boolean; needsFullForm: boolean; message?: string }> {
    const { data } = getState();
    if (!data) {
        return { ok: false, needsFullForm: false };
    }
    const { $jira } = inject('JiraService');
    const fields: Record<string, unknown> = {
        project: { key: issue.projectKey },
        issuetype: { id: issue.issueTypeId },
        summary: issue.summary,
    };
    if (issue.assignee) {
        fields.assignee = getAssigneeFieldValue(issue.assignee.id);
    }
    if (issue.estimate) {
        Object.assign(fields, buildFieldsPayload({} as PlannerIssue, { estimate: issue.estimate }, data));
    }
    if (issue.parentKey) {
        if (data.fieldIds.epicLink) {
            fields[data.fieldIds.epicLink] = issue.parentKey;
        } else {
            fields.parent = { key: issue.parentKey };
        }
    }
    if (columnId !== backlogColumnId && data.fieldIds.sprint) {
        fields[data.fieldIds.sprint] = Number(columnId);
    }

    try {
        const created = (await $jira.createIssue(fields)) as { key: string };
        await insertCreatedIssue(created.key, columnId);
        return { ok: true, needsFullForm: false };
    } catch (err) {
        const errors = (err as { error?: { errors?: Record<string, string> } })?.error?.errors || {};
        const needsFullForm = Object.keys(errors).some((field) => !Object.prototype.hasOwnProperty.call(fields, field) || /required/i.test(errors[field]));
        return { ok: false, needsFullForm, message: getJiraErrorMessage(err) };
    }
}

async function insertCreatedIssue(key: string, columnId: string) {
    const { data } = getState();
    if (!data) {
        return;
    }
    const [raw] = await getIssuesByKey([key], getIssueFields(data.mapContext), plannerIssueProperties);
    const issue = mapPlannerIssue(raw, data.mapContext);
    setData((current) => ({
        ...current,
        issues: { ...current.issues, [key]: issue },
        columns: { ...current.columns, [columnId]: [...(current.columns[columnId] || []), key] },
    }));
}

export function getFullCreateUrl(projectId: string, issueTypeId: string, summary: string): string {
    const { $session } = inject('SessionService');
    const root = ($session.CurrentUser?.jiraUrl || '').replace(/\/$/, '');
    return `${root}/secure/CreateIssueDetails!init.jspa?pid=${encodeURIComponent(projectId)}&issuetype=${encodeURIComponent(issueTypeId)}&summary=${encodeURIComponent(summary)}`;
}

export function getIcsImportRange(): { start: Date; end: Date } {
    const today = new Date();
    return { start: subDays(today, icsImportPastDays), end: addDays(today, icsImportFutureDays) };
}

function describeUnmapped(unmapped: UnmappedLeave[]): string {
    const people = [...new Set(unmapped.map((u) => u.person))];
    return `Leave of ${people.length} ${people.length === 1 ? 'person' : 'people'} not matched to a team member was skipped: ${people.slice(0, 5).join(', ')}${people.length > 5 ? ', …' : ''}. Map them under Leave calendars and import the file again.`;
}

async function storeSourceLeave(boardId: number, removedSourceIds: string[], imports: { sourceId: string; entries: LeaveEntry[] }[]) {
    const range = getIcsImportRange();
    const window = { start: toDateKey(range.start), end: toDateKey(range.end) };
    for (const sourceId of removedSourceIds) {
        await deleteSourceLeave(boardId, sourceId);
    }
    for (const item of imports) {
        await replaceSourceLeave(boardId, item.sourceId, window.start, window.end, item.entries);
    }
}

export async function saveTeam(team: TeamDefinition, icsImports: Record<string, StoredCalendarEvent[]> = {}): Promise<boolean> {
    const { data } = getState();
    if (!data) {
        return false;
    }
    const importedAt = new Date().toISOString();
    const imports = team.leaveSources
        .filter((source) => icsImports[source.id])
        .map((source) => ({ sourceId: source.id, ...readIcsLeave(source, icsImports[source.id], team, data.members) }));
    const toSave: TeamDefinition = {
        ...team,
        leaveSources: team.leaveSources.map((source) => {
            const imported = imports.find((i) => i.sourceId === source.id);
            return imported ? { ...source, importedAt, importedCount: imported.entries.length } : source;
        }),
    };

    try {
        const saved = await saveTeamDefinition(data.board.id, toSave);
        const removedSourceIds = data.team.leaveSources.filter((s) => !saved.leaveSources.some((n) => n.id === s.id)).map((s) => s.id);
        if (removedSourceIds.length || imports.length) {
            try {
                await storeSourceLeave(data.board.id, removedSourceIds, imports);
            } catch (err) {
                showError(`The team settings were saved, but the calendar leave was not: ${getJiraErrorMessage(err)}`, 'Calendar leave');
            }
        }
        const unmapped = imports.flatMap((i) => i.unmapped);
        if (unmapped.length) {
            const { $message } = inject('MessageService');
            $message.warning(describeUnmapped(unmapped), 'Calendar import');
        }
        await applyTeam(saved);
        usePlannerStore.setState({ teamReadOnlyReason: null });
        return true;
    } catch (err) {
        if (err instanceof TeamConflictError) {
            await applyTeam(err.latest);
            showError(err.message, 'Team settings changed');
        } else if (isPermissionError(err)) {
            usePlannerStore.setState({ teamReadOnlyReason: teamReadOnlyMessage });
            showError(teamReadOnlyMessage, 'Unable to save the team settings');
        } else {
            showError(getJiraErrorMessage(err), 'Unable to save the team settings');
        }
        return false;
    }
}

async function applyTeam(team: TeamDefinition, forceCalendars?: boolean) {
    const { data } = getState();
    if (!data) {
        return;
    }
    const members = await resolveTeamMembers(team, Object.values(data.issues));
    const leave = await loadLeave(data.board.id, team, members, [...data.sprintRanges.values()], { force: forceCalendars });
    setData((current) => ({ ...current, team, members, leave, leaveIndex: buildBoardLeaveIndex(leave) }));
}

function handleLeaveError(err: unknown, title: string) {
    if (isPermissionError(err)) {
        usePlannerStore.setState({ teamReadOnlyReason: teamReadOnlyMessage });
        showError(teamReadOnlyMessage, title);
    } else {
        showError(getJiraErrorMessage(err), title);
    }
}

export async function loadLeaveList(): Promise<LeaveEntry[]> {
    const { data } = getState();
    if (!data) {
        return [];
    }
    const today = new Date();
    const entries = await loadStoredLeave(data.board.id, toDateKey(subDays(today, leaveListPastDays)), toDateKey(addDays(today, leaveListFutureDays)));
    return entries.filter((e) => e.source === 'manual');
}

export async function loadLeaveRange(start: string, end: string): Promise<LeaveEntry[]> {
    const { data } = getState();
    if (!data) {
        return [];
    }
    const stored = await loadStoredLeave(data.board.id, start, end);
    const { manual, entries } = combineLeave(stored, data.leave.live, data.leave.window, data.team, { start, end });
    return [...manual, ...entries];
}

export async function saveManualLeave(entry: LeaveEntry, previous: LeaveEntry | null): Promise<boolean> {
    const { data } = getState();
    if (!data) {
        return false;
    }
    try {
        await saveLeaveEntries(data.board.id, { upsert: [{ ...entry, source: 'manual' }], remove: previous ? [previous] : [] });
        await applyTeam(data.team);
        return true;
    } catch (err) {
        handleLeaveError(err, 'Unable to save the leave');
        return false;
    }
}

export async function removeManualLeave(entry: LeaveEntry): Promise<boolean> {
    const { data } = getState();
    if (!data) {
        return false;
    }
    try {
        await saveLeaveEntries(data.board.id, { upsert: [], remove: [entry] });
        await applyTeam(data.team);
        return true;
    } catch (err) {
        handleLeaveError(err, 'Unable to delete the leave');
        return false;
    }
}

export function acceptStorageConsent() {
    setStorageConsent(true);
    changeSettings({ storageConsentAt: new Date().toISOString() });
    const { data } = getState();
    if (data) {
        shareCalendarCopies(data);
    }
}

export function withdrawStorageConsent() {
    setStorageConsent(false);
    changeSettings({ storageConsentAt: null });
}

export async function refreshCalendars(): Promise<void> {
    const { data } = getState();
    if (data) {
        await applyTeam(data.team, true);
    }
}

export function toggleDraftMode(enabled: boolean) {
    const { draft } = getState();
    if (!enabled && draft.changes.length) {
        return;
    }
    usePlannerStore.setState({ draft: { ...draft, enabled, results: [] } });
}

export function discardDraft() {
    const { draft, data } = getState();
    usePlannerStore.setState({
        data: draft.snapshot || data,
        draft: { ...draft, changes: [], snapshot: null, results: [], isApplying: false, progress: 0 },
    });
}

function getRankIndex(columnKeys: string[], rank: RankPosition): number {
    const index = rank.beforeKey ? columnKeys.indexOf(rank.beforeKey) : rank.afterKey ? columnKeys.indexOf(rank.afterKey) + 1 : 0;
    return index < 0 || (rank.afterKey && index === 0) ? columnKeys.length : index;
}

function replayChange(data: BoardData, change: DraftChange): BoardData {
    switch (change.kind) {
        case 'move': {
            const target = (data.columns[change.toColumn] || []).filter((k) => !change.keys.includes(k));
            return applyMoveLocally(data, change.keys, change.toColumn, getRankIndex(target, change.rank)).data;
        }
        case 'fields': {
            const issue = data.issues[change.key];
            return issue ? { ...data, issues: { ...data.issues, [change.key]: applyEditLocally(issue, change.edit, data) } } : data;
        }
        case 'segments': {
            const issue = data.issues[change.key];
            return issue ? { ...data, issues: { ...data.issues, [change.key]: { ...issue, segments: change.segments, legacySegments: false } } } : data;
        }
        case 'link':
            return updateLinksLocally(data, change.inwardKey, change.outwardKey, change.typeName, change.action === 'delete', change.linkId);
    }
}

export function removeDraftChange(changeId: string) {
    const { draft, data } = getState();
    const changes = draft.changes.filter((c) => c.id !== changeId);
    const snapshot = changes.length ? draft.snapshot : null;
    usePlannerStore.setState({
        data: draft.snapshot ? changes.reduce(replayChange, draft.snapshot) : data,
        draft: { ...draft, changes, snapshot },
    });
}

type OtherChange = Exclude<DraftChange, { kind: 'move' }>;

interface MoveBatch {
    columnId: string;
    keys: string[];
    runs: { keys: string[]; rank: RankPosition }[];
}

function applyOtherChange(change: OtherChange) {
    switch (change.kind) {
        case 'fields':
            return updateIssueFields(change.key, change.fields);
        case 'segments':
            return setIssueProperty(change.key, segmentsPropertyKey, serializeSegments(change.segments));
        case 'link':
            return change.action === 'create'
                ? createIssueLink(change.typeName, change.inwardKey, change.outwardKey)
                : change.linkId && !change.linkId.startsWith('pending-')
                  ? deleteIssueLink(change.linkId)
                  : Promise.resolve();
    }
}

function getRankRuns(columnKeys: string[], moved: Set<string>): MoveBatch['runs'] {
    const runs: MoveBatch['runs'] = [];
    let index = 0;
    while (index < columnKeys.length) {
        if (!moved.has(columnKeys[index])) {
            index++;
            continue;
        }
        const startIndex = index;
        while (index < columnKeys.length && moved.has(columnKeys[index])) {
            index++;
        }
        const keys = columnKeys.slice(startIndex, index);
        const nextKey = columnKeys[index];
        const previousKey = columnKeys[startIndex - 1];
        if (nextKey) {
            runs.push({ keys, rank: { beforeKey: nextKey } });
        } else if (previousKey) {
            runs.push({ keys, rank: { afterKey: previousKey } });
        } else if (keys.length > 1) {
            runs.push({ keys: keys.slice(1), rank: { afterKey: keys[0] } });
        }
    }
    return runs;
}

function getMoveBatches(data: BoardData, moves: Extract<DraftChange, { kind: 'move' }>[]): MoveBatch[] {
    const moved = new Set(moves.flatMap((m) => m.keys));
    return Object.entries(data.columns)
        .map(([columnId, columnKeys]) => {
            const keys = columnKeys.filter((k) => moved.has(k));
            return { columnId, keys, runs: getRankRuns(columnKeys, moved) };
        })
        .filter((batch) => batch.keys.length);
}

async function writeMoveBatch(batch: MoveBatch, rankFieldId: string | null) {
    if (batch.columnId === backlogColumnId) {
        await moveIssuesToBacklog(batch.keys);
    } else {
        await moveIssuesToSprint(Number(batch.columnId), batch.keys);
    }
    for (const run of batch.runs) {
        await rankIssues(run.keys, run.rank, rankFieldId);
    }
}

/**
 * Writes every staged change and reports the result of each. Moves are applied by their final position with the bulk endpoints.
 * Failed changes stay in the draft so they can be retried or removed. Nothing is applied silently.
 */
export async function applyDraft(): Promise<void> {
    const { draft, data } = getState();
    if (!data || !draft.changes.length || draft.isApplying) {
        return;
    }

    usePlannerStore.setState({ draft: { ...draft, isApplying: true, progress: 0, results: [] } });
    const moves = draft.changes.filter((c): c is Extract<DraftChange, { kind: 'move' }> => c.kind === 'move');
    const others = draft.changes.filter((c): c is OtherChange => c.kind !== 'move');
    const batches = getMoveBatches(data, moves);
    const total = batches.length + others.length;
    const results: DraftResult[] = [];
    const failed: DraftChange[] = [];
    const failedKeys = new Map<string, string>();
    let done = 0;

    const reportProgress = () => {
        done++;
        usePlannerStore.setState({ draft: { ...getState().draft, progress: Math.round((done * 100) / Math.max(1, total)), results: [...results] } });
    };

    for (const batch of batches) {
        try {
            await writeMoveBatch(batch, data.config.rankFieldId);
        } catch (err) {
            const message = getJiraErrorMessage(err);
            batch.keys.forEach((key) => failedKeys.set(key, message));
        }
        reportProgress();
    }
    for (const move of moves) {
        const message = move.keys.map((k) => failedKeys.get(k)).find((m) => !!m);
        results.push({ id: move.id, label: move.label, ok: !message, message });
        if (message) {
            failed.push(move);
        }
    }

    for (const change of others) {
        try {
            await applyOtherChange(change);
            results.push({ id: change.id, label: change.label, ok: true });
        } catch (err) {
            results.push({ id: change.id, label: change.label, ok: false, message: getJiraErrorMessage(err) });
            failed.push(change);
        }
        reportProgress();
    }

    usePlannerStore.setState({
        draft: {
            ...getState().draft,
            isApplying: false,
            changes: failed,
            snapshot: null,
            results,
        },
    });

    const count = draft.changes.length;
    if (failed.length) {
        showError(`${failed.length} of ${count} changes could not be applied. They are kept in the draft.`, 'Draft partly applied');
        await loadBoard(data.board.id, true);
        const fresh = getState().data;
        if (fresh) {
            usePlannerStore.setState({ data: failed.reduce(replayChange, fresh), draft: { ...getState().draft, snapshot: fresh } });
        }
        return;
    }

    showSuccess(`${count} changes applied to Jira`);
    const touchedKeys = [...new Set(others.flatMap((c) => (c.kind === 'link' ? [c.inwardKey, c.outwardKey] : [c.key])))];
    if (touchedKeys.length) {
        await reloadIssues(touchedKeys).catch((err) => console.warn('Unable to reload the updated issues', err));
    }
}

export function setSelection(keys: string[]) {
    usePlannerStore.setState({ selection: keys });
}

export function toggleSelection(key: string) {
    const { selection } = getState();
    usePlannerStore.setState({ selection: selection.includes(key) ? selection.filter((k) => k !== key) : [...selection, key] });
}

export interface ForecastAcceptGroup {
    sprintId: number | null;
    newSprint: { name: string; startDate: Date; endDate: Date } | null;
    keys: string[];
}

export interface ForecastAcceptResult {
    label: string;
    ok: boolean;
    keys: string[];
}

/** Moves the accepted forecast into the sprints, one bulk move per sprint. Sprints that do not exist yet are created first. */
export async function acceptForecast(groups: ForecastAcceptGroup[], onProgress: (done: number, total: number) => void): Promise<ForecastAcceptResult[]> {
    const results: ForecastAcceptResult[] = [];
    let done = 0;
    for (const group of groups) {
        let sprintId = group.sprintId;
        let label = getState().data?.sprints.find((s) => s.id === sprintId)?.name || '';
        if (!sprintId && group.newSprint) {
            label = group.newSprint.name;
            const created = await createSprint({ name: group.newSprint.name, startDate: group.newSprint.startDate, endDate: group.newSprint.endDate });
            sprintId = created?.id ?? null;
        }
        const ok = sprintId ? await moveIssues(group.keys, String(sprintId), (getState().data?.columns[String(sprintId)] || []).length) : false;
        results.push({ label, ok, keys: group.keys });
        done++;
        onProgress(done, groups.length);
    }
    return results;
}
