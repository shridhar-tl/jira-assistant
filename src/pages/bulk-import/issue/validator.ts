import { runOnQueue } from '@utils/array-utils';

import type { JiraCreateIssueType, JiraFieldMeta, JiraFieldMetaMap } from '@types';

import { epicLinkCustomType, getKindFromMeta, normalizeForCompare, pseudoFields, timeTrackingField } from './field-kinds';
import { getComparableValues, isSameValue, toDisplayItems } from './jira-values';
import { splitKeyList } from './row-builder';
import type { ExistingIssue, ImportAction, ImportCell, ImportColumn, ImportRow, RowContext } from './types';
import { getEmptyPayload, issueKeyRegex, resolveValue, type ResolveEnv } from './value-resolver';

const msgRequired = 'Value is required';
const msgIssueNotFound = 'Issue does not exist or you do not have access to it';
const msgNotOnEditScreen = 'This field is not on the edit screen of the issue or is read only';
const msgNotOnCreateScreen = 'This field is not on the create screen. It will be set right after the issue is created.';
const msgIgnoredForDelete = 'Other values in this row are ignored as the issue will be deleted';
const msgNoChanges = 'No changes to update';
const validationConcurrency = 6;

const specialFields: string[] = [
    pseudoFields.issuekey,
    pseudoFields.project,
    pseudoFields.issuetype,
    pseudoFields.parent,
    pseudoFields.status,
    pseudoFields.comment,
];
const autoFilledRequiredFields = ['project', 'issuetype', 'parent', 'reporter'];

export interface ValidationResult {
    row: ImportRow;
    missingRequired: JiraFieldMeta[];
}

interface ValidationState {
    row: ImportRow;
    cells: Record<string, ImportCell>;
    context: RowContext;
    warnings: string[];
    missingRequired: JiraFieldMeta[];
}

export function getMetaKey(field: string): string {
    return field === pseudoFields.originalEstimate || field === pseudoFields.remainingEstimate ? timeTrackingField : field;
}

export function getExistingValue(existing: ExistingIssue, field: string): unknown {
    const metaKey = getMetaKey(field);
    const value = existing.fields[metaKey];
    if (metaKey === timeTrackingField) {
        const timeTracking = value as { originalEstimate?: string; remainingEstimate?: string } | undefined;
        return field === pseudoFields.originalEstimate ? timeTracking?.originalEstimate : timeTracking?.remainingEstimate;
    }
    return value;
}

export function findEpicLinkField(meta: JiraFieldMetaMap | undefined): string | undefined {
    if (!meta) {
        return undefined;
    }
    return Object.keys(meta).find((key) => meta[key].schema.custom === epicLinkCustomType);
}

export function getCellError(cell: ImportCell | undefined): string | undefined {
    return cell?.error;
}

export function rowHasError(row: ImportRow): boolean {
    return !!row.status.error || !!row.status.conflict?.isError || Object.values(row.cells).some((c) => !!c.error);
}

export function rowHasWarning(row: ImportRow): boolean {
    return (
        !!row.status.warnings.length ||
        (!!row.status.conflict && !row.status.conflict.isError) ||
        Object.values(row.cells).some((c) => !!c.warning)
    );
}

export function canImportRow(row: ImportRow): boolean {
    return row.status.state !== 'imported' && row.status.action !== 'none' && !row.status.validating && !rowHasError(row);
}

function resetCells(cells: Record<string, ImportCell>): Record<string, ImportCell> {
    return Object.keys(cells).reduce<Record<string, ImportCell>>((result, field) => {
        const { input, clear } = cells[field];
        if (input || clear) {
            result[field] = clear ? { clear } : { input };
        }
        return result;
    }, {});
}

function getCell(state: ValidationState, field: string): ImportCell | undefined {
    return state.cells[field];
}

function setCellError(state: ValidationState, field: string, error: string): void {
    const cell = state.cells[field] || {};
    state.cells[field] = { ...cell, error, display: cell.display || (cell.input ? [{ text: cell.input }] : undefined) };
}

function findIssueType(input: string, types: JiraCreateIssueType[]): JiraCreateIssueType | undefined {
    const normalized = normalizeForCompare(input);
    return types.find((t) => t.id === input.trim()) || types.find((t) => normalizeForCompare(t.name) === normalized);
}

function describeIssueTypes(types: JiraCreateIssueType[], subtask?: boolean): string {
    return types
        .filter((t) => subtask === undefined || t.subtask === subtask)
        .map((t) => t.name)
        .join(', ');
}

function getSingleKey(state: ValidationState, field: string, label: string): string | undefined {
    const cell = getCell(state, field);
    if (!cell?.input) {
        return undefined;
    }
    const keys = splitKeyList(cell.input);
    if (keys.length > 1) {
        const otherLabel = field === pseudoFields.project ? 'parents' : 'projects';
        setCellError(
            state,
            field,
            `Only one ${label} can be used in this row. Multiple ${label}s are supported only for new issues${field === pseudoFields.parent ? ' and clones' : ''} and not together with multiple ${otherLabel}.`,
        );
        return undefined;
    }
    return keys[0];
}

async function validateProjectAndType(state: ValidationState, action: ImportAction, env: ResolveEnv): Promise<boolean> {
    const { context } = state;
    const { existing } = context;
    const projectInput = getSingleKey(state, pseudoFields.project, 'project');
    const typeInput = getCell(state, pseudoFields.issuetype)?.input;
    const parentKey = getSingleKey(state, pseudoFields.parent, 'parent');

    if (getCell(state, pseudoFields.project)?.error || getCell(state, pseudoFields.parent)?.error) {
        return false;
    }

    if (action === 'update' && existing) {
        if (projectInput && projectInput !== existing.projectKey) {
            setCellError(
                state,
                pseudoFields.project,
                'Moving issues to another project is not supported. Use Clone to copy the issue to another project.',
            );
            return false;
        }
        return true;
    }

    let projectKey = projectInput || existing?.projectKey;
    if (!projectKey && parentKey) {
        const parent = await env.lookup.getIssue(parentKey);
        if (!parent) {
            setCellError(state, pseudoFields.parent, msgIssueNotFound);
            return false;
        }
        projectKey = parent.projectKey;
    }

    if (!projectKey) {
        setCellError(state, pseudoFields.project, 'Project is required when parent is not provided');
        return false;
    }

    const issueTypes = await env.lookup.getIssueTypes(projectKey);
    if (!issueTypes) {
        setCellError(
            state,
            pseudoFields.project,
            `Project "${projectKey}" does not exist or you do not have permission to create issues in it`,
        );
        return false;
    }

    context.projectKey = projectKey;
    context.issueTypes = issueTypes;
    state.cells[pseudoFields.project] = {
        ...getCell(state, pseudoFields.project),
        display: [{ text: projectKey }],
        payload: { key: projectKey },
    };

    const typeText = typeInput || existing?.issueTypeName;
    if (!typeText) {
        setCellError(state, pseudoFields.issuetype, `${msgRequired}. Available types: ${describeIssueTypes(issueTypes)}`);
        return false;
    }

    const issueType = findIssueType(typeText, issueTypes);
    if (!issueType) {
        setCellError(
            state,
            pseudoFields.issuetype,
            `"${typeText}" is not available in project ${projectKey}. Available types: ${describeIssueTypes(issueTypes)}`,
        );
        return false;
    }

    context.issueType = issueType;
    if (typeInput) {
        state.cells[pseudoFields.issuetype] = {
            input: typeInput,
            display: [{ text: issueType.name, avatarUrl: issueType.iconUrl }],
            payload: { id: issueType.id },
        };
    }

    return true;
}

async function validateParentForNewIssue(state: ValidationState, env: ResolveEnv): Promise<void> {
    const { context } = state;
    const { issueType, existing, fieldsMeta, projectKey } = context;
    if (!issueType) {
        return;
    }

    const parentCell = getCell(state, pseudoFields.parent);
    const parentKey = parentCell?.input
        ? splitKeyList(parentCell.input)[0]
        : existing?.isSubtask === issueType.subtask
          ? existing?.parentKey
          : undefined;

    if (!parentKey) {
        if (issueType.subtask) {
            setCellError(state, pseudoFields.parent, `Parent is required for ${issueType.name}`);
        }
        return;
    }

    const parent = await env.lookup.getIssue(parentKey);
    if (!parent) {
        setCellError(state, pseudoFields.parent, msgIssueNotFound);
        return;
    }

    if (parent.isSubtask) {
        setCellError(state, pseudoFields.parent, `${parent.key} is a sub-task and cannot be a parent`);
        return;
    }

    let parentFieldId: string | undefined;
    if (issueType.subtask) {
        if (parent.projectKey !== projectKey) {
            setCellError(state, pseudoFields.parent, `Sub-task must be in the same project as its parent (${parent.projectKey})`);
            return;
        }
        parentFieldId = pseudoFields.parent;
    } else {
        parentFieldId = fieldsMeta?.[pseudoFields.parent] ? pseudoFields.parent : findEpicLinkField(fieldsMeta);
        if (!parentFieldId) {
            const subtaskTypes = describeIssueTypes(context.issueTypes || [], true);
            setCellError(
                state,
                pseudoFields.parent,
                `"${issueType.name}" cannot have a parent in this project.${subtaskTypes ? ` Use a sub-task type (${subtaskTypes}) or remove the parent.` : ''}`,
            );
            return;
        }
    }

    context.parentFieldId = parentFieldId;
    state.cells[pseudoFields.parent] = {
        ...parentCell,
        display: [{ text: parent.key, issueKey: parent.key }],
        payload: parentFieldId === pseudoFields.parent ? { key: parent.key } : parent.key,
    };
}

async function validateParentForUpdate(state: ValidationState, env: ResolveEnv): Promise<void> {
    const { context } = state;
    const { existing, fieldsMeta } = context;
    const parentCell = getCell(state, pseudoFields.parent);
    if (!existing || !parentCell) {
        return;
    }

    const epicLinkField = findEpicLinkField(fieldsMeta);
    const parentFieldId = fieldsMeta?.[pseudoFields.parent] ? pseudoFields.parent : !existing.isSubtask ? epicLinkField : undefined;
    const currentParent =
        existing.parentKey || (epicLinkField ? (existing.fields[epicLinkField] as string | undefined)?.toUpperCase() : undefined);

    if (parentCell.clear) {
        if (existing.isSubtask) {
            setCellError(state, pseudoFields.parent, 'Parent of a sub-task cannot be removed');
        } else if (!currentParent) {
            state.cells[pseudoFields.parent] = { ...parentCell, unchanged: true };
        } else if (parentFieldId && parentFieldId === epicLinkField) {
            context.parentFieldId = parentFieldId;
            state.cells[pseudoFields.parent] = { ...parentCell, payload: null };
        } else {
            setCellError(state, pseudoFields.parent, 'Removing the parent is not supported in this Jira. Remove it from Jira directly.');
        }
        return;
    }

    const parentKey = splitKeyList(parentCell.input)[0];
    if (parentKey === currentParent) {
        state.cells[pseudoFields.parent] = { ...parentCell, display: [{ text: parentKey, issueKey: parentKey }], unchanged: true };
        return;
    }

    if (!parentFieldId) {
        setCellError(
            state,
            pseudoFields.parent,
            existing.isSubtask
                ? 'Jira does not allow changing the parent of this sub-task. Set Clone = yes to copy the sub-task under the new parent instead.'
                : 'Parent cannot be set for this issue in this Jira',
        );
        return;
    }

    const parent = await env.lookup.getIssue(parentKey);
    if (!parent) {
        setCellError(state, pseudoFields.parent, msgIssueNotFound);
        return;
    }
    if (parent.isSubtask) {
        setCellError(state, pseudoFields.parent, `${parent.key} is a sub-task and cannot be a parent`);
        return;
    }
    if (parent.key === existing.key) {
        setCellError(state, pseudoFields.parent, 'An issue cannot be its own parent');
        return;
    }

    context.parentFieldId = parentFieldId;
    state.cells[pseudoFields.parent] = {
        ...parentCell,
        display: [{ text: parent.key, issueKey: parent.key }],
        payload: parentFieldId === pseudoFields.parent ? { key: parent.key } : parent.key,
    };
}

function validateIssueTypeForUpdate(state: ValidationState): void {
    const { existing, fieldsMeta } = state.context;
    const cell = getCell(state, pseudoFields.issuetype);
    if (!existing || !cell?.input) {
        return;
    }

    if (normalizeForCompare(cell.input) === normalizeForCompare(existing.issueTypeName) || cell.input === existing.issueTypeId) {
        state.cells[pseudoFields.issuetype] = { ...cell, display: [{ text: existing.issueTypeName }], unchanged: true };
        return;
    }

    const allowedTypes = fieldsMeta?.issuetype?.allowedValues || [];
    const match = allowedTypes.find((t) => t.id === cell.input || normalizeForCompare(t.name) === normalizeForCompare(cell.input));
    if (!match) {
        setCellError(
            state,
            pseudoFields.issuetype,
            'Issue type of this issue cannot be changed here. Use "Move" in Jira or set Clone = yes to create a copy with a different type.',
        );
        return;
    }

    state.cells[pseudoFields.issuetype] = {
        ...cell,
        display: [{ text: match.name || cell.input, avatarUrl: match.iconUrl }],
        payload: { id: match.id },
    };
}

async function validateStatus(state: ValidationState, action: ImportAction, env: ResolveEnv): Promise<void> {
    const cell = getCell(state, pseudoFields.status);
    const { context } = state;
    if (!cell) {
        return;
    }

    if (cell.clear || !cell.input) {
        setCellError(state, pseudoFields.status, 'Status cannot be cleared');
        return;
    }

    const target = normalizeForCompare(cell.input);
    const { existing } = context;

    if (action === 'update' && existing) {
        if (normalizeForCompare(existing.statusName) === target) {
            state.cells[pseudoFields.status] = { ...cell, display: [{ text: existing.statusName }], unchanged: true };
            return;
        }

        let transitions;
        try {
            transitions = await env.lookup.getTransitions(existing.key);
        } catch {
            setCellError(state, pseudoFields.status, 'Unable to fetch the workflow transitions of the issue');
            return;
        }

        const transition =
            transitions.find((t) => normalizeForCompare(t.to.name) === target) ||
            transitions.find((t) => normalizeForCompare(t.name) === target);
        if (!transition) {
            const possible = [...new Set(transitions.map((t) => t.to.name))].join(', ');
            setCellError(
                state,
                pseudoFields.status,
                `Issue cannot be moved from "${existing.statusName}" to "${cell.input}".${possible ? ` Possible statuses: ${possible}` : ''}`,
            );
            return;
        }

        context.transition = transition;
        state.cells[pseudoFields.status] = { ...cell, display: [{ text: transition.to.name }], payload: transition.id };
        return;
    }

    const { projectKey, issueType } = context;
    if (!projectKey || !issueType) {
        return;
    }

    let statuses: string[];
    try {
        statuses = await env.lookup.getProjectStatuses(projectKey, issueType.id);
    } catch {
        statuses = [];
    }

    const status = statuses.find((s) => normalizeForCompare(s) === target);
    if (statuses.length && !status) {
        setCellError(
            state,
            pseudoFields.status,
            `"${cell.input}" is not a status of ${issueType.name} in ${projectKey}. Available statuses: ${statuses.join(', ')}`,
        );
        return;
    }

    state.cells[pseudoFields.status] = {
        ...cell,
        display: [{ text: status || cell.input }],
        payload: status || cell.input,
        warning: 'Status is changed using workflow transition right after the issue is created',
    };
}

function isRequired(meta: JiraFieldMeta | undefined): boolean {
    return !!meta?.required && !meta.hasDefaultValue;
}

async function validateComment(state: ValidationState, env: ResolveEnv): Promise<void> {
    const cell = getCell(state, pseudoFields.comment);
    if (!cell) {
        return;
    }
    if (cell.clear) {
        setCellError(state, pseudoFields.comment, 'Comments cannot be removed using import');
        return;
    }
    const resolved = await resolveValue('comment', undefined, cell.input || '', env);
    state.cells[pseudoFields.comment] = {
        ...cell,
        display: resolved.display,
        payload: resolved.error ? undefined : resolved.payload,
        error: resolved.error,
    };
}

function validateTransitionFields(state: ValidationState): void {
    const { transition } = state.context;
    if (!transition) {
        return;
    }

    const missing = Object.values(transition.fields).filter((meta) => {
        const cell = state.cells[meta.key];
        return isRequired(meta) && (!cell || cell.payload === undefined);
    });

    if (missing.length) {
        setCellError(
            state,
            pseudoFields.status,
            `Moving to "${transition.to.name}" requires ${missing.map((m) => m.name).join(', ')}. Add ${missing.length > 1 ? 'these columns' : 'this column'} with values.`,
        );
        missing.forEach((meta) => {
            if (!state.missingRequired.some((m) => m.key === meta.key)) {
                state.missingRequired.push(meta);
            }
        });
    }
}

async function validateFieldColumn(state: ValidationState, column: ImportColumn, action: ImportAction, env: ResolveEnv): Promise<void> {
    const { field } = column;
    const { context } = state;
    const isNewIssue = action === 'create' || (action === 'clone' && !!context.cloneAsCopy);
    const metaKey = getMetaKey(field);
    const transitionMeta = context.transition?.fields[metaKey];
    const meta = context.fieldsMeta?.[metaKey] || transitionMeta;
    const kind = getKindFromMeta(meta, column);
    const cell = getCell(state, field);
    const existingValue = context.existing ? getExistingValue(context.existing, field) : undefined;
    const hasSourceValue = action === 'clone' && getComparableValues(existingValue, kind).length > 0;

    if (!cell) {
        if (isNewIssue && isRequired(meta) && !autoFilledRequiredFields.includes(metaKey) && !hasSourceValue) {
            setCellError(state, field, msgRequired);
        }
        return;
    }

    if (cell.clear) {
        if (isNewIssue && !hasSourceValue) {
            state.cells[field] = { ...cell, unchanged: true };
            return;
        }
        if (!meta) {
            setCellError(state, field, msgNotOnEditScreen);
            return;
        }
        if (meta.required) {
            setCellError(state, field, `${meta.name} is a required field and cannot be cleared`);
            return;
        }
        if (kind === 'originalEstimate' || kind === 'remainingEstimate') {
            setCellError(state, field, 'Estimates cannot be cleared using import');
            return;
        }
        state.cells[field] = {
            ...cell,
            payload: getEmptyPayload(kind),
            unchanged: action === 'update' && !getComparableValues(existingValue, kind).length,
        };
        return;
    }

    let deferred = false;
    if (!meta) {
        if (!isNewIssue) {
            setCellError(state, field, msgNotOnEditScreen);
            return;
        }
        deferred = true;
    }

    const resolved = await resolveValue(kind, meta, cell.input || '', env, context.projectKey);
    const unchanged = action === 'update' && !resolved.error && isSameValue(kind, resolved.payload, existingValue);

    state.cells[field] = {
        ...cell,
        display: resolved.display,
        payload: resolved.error ? undefined : resolved.payload,
        error: resolved.error,
        warning: resolved.warning || (deferred && !resolved.error ? msgNotOnCreateScreen : undefined),
        deferred,
        unchanged,
    };
}

function collectMissingRequired(state: ValidationState, columns: ImportColumn[]): void {
    const { fieldsMeta } = state.context;
    if (!fieldsMeta) {
        return;
    }
    const columnFields = new Set(columns.map((c) => getMetaKey(c.field)));
    state.missingRequired = Object.values(fieldsMeta).filter(
        (meta) => isRequired(meta) && !autoFilledRequiredFields.includes(meta.key) && !columnFields.has(meta.key),
    );
}

function buildExistingDisplay(
    existing: ExistingIssue | undefined,
    columns: ImportColumn[],
    env: ResolveEnv,
): Record<string, ReturnType<typeof toDisplayItems>> {
    if (!existing) {
        return {};
    }

    const formatters: Record<string, (value: string) => string> = {
        date: (value) => env.formatDate(new Date(`${value}T00:00:00`)),
        datetime: (value) => env.formatDateTime(new Date(value)),
    };

    return columns.reduce<Record<string, ReturnType<typeof toDisplayItems>>>((result, column) => {
        if (column.role !== 'field' || column.field === pseudoFields.issuekey) {
            return result;
        }
        const value = column.field === pseudoFields.status ? existing.statusName : getExistingValue(existing, column.field);
        result[column.field] = toDisplayItems(value, column.kind ? formatters[column.kind] : undefined);
        return result;
    }, {});
}

function hasAnyChange(state: ValidationState): boolean {
    return Object.keys(state.cells).some((field) => {
        if (field === pseudoFields.issuekey || field === pseudoFields.project) {
            return false;
        }
        const cell = state.cells[field];
        return !cell.unchanged && !cell.error && (cell.payload !== undefined || !!cell.clear);
    });
}

async function validateKeyedRow(
    state: ValidationState,
    action: ImportAction,
    columns: ImportColumn[],
    env: ResolveEnv,
): Promise<ImportAction> {
    const keyCell = getCell(state, pseudoFields.issuekey)!;
    const key = (keyCell.input || '').toUpperCase();

    if (!issueKeyRegex.test(key)) {
        setCellError(state, pseudoFields.issuekey, 'Not a valid issue key. Use the format PROJ-123.');
        return action;
    }

    const existing = await env.lookup.getIssue(key);
    if (!existing) {
        setCellError(state, pseudoFields.issuekey, msgIssueNotFound);
        return action;
    }

    const { context } = state;
    context.existing = existing;
    state.cells[pseudoFields.issuekey] = { input: key, display: [{ text: existing.key, issueKey: existing.key }] };
    state.row = { ...state.row, existingDisplay: buildExistingDisplay(existing, columns, env) };

    if (action === 'delete') {
        if (existing.subtaskCount) {
            state.warnings.push(`${existing.subtaskCount} sub-task(s) of this issue will also be deleted`);
        }
        if (Object.keys(state.cells).some((f) => f !== pseudoFields.issuekey)) {
            state.warnings.push(msgIgnoredForDelete);
        }
        return action;
    }

    if (action === 'clone') {
        const projectInput = getCell(state, pseudoFields.project)?.input;
        const typeInput = getCell(state, pseudoFields.issuetype)?.input;
        const parentInput = getCell(state, pseudoFields.parent)?.input;
        const isProjectChanged = !!projectInput && splitKeyList(projectInput)[0] !== existing.projectKey;
        const isTypeChanged = !!typeInput && normalizeForCompare(typeInput) !== normalizeForCompare(existing.issueTypeName);
        const isParentChanged = !!parentInput && splitKeyList(parentInput)[0] !== existing.parentKey;

        // Jira Data Center does not have clone API. In Jira Cloud, the clone API cannot change project, type or parent.
        context.cloneAsCopy = !env.lookup.isCloud || isProjectChanged || isTypeChanged || isParentChanged;
    }

    if (action === 'update' || (action === 'clone' && !context.cloneAsCopy)) {
        if (!(await validateProjectAndType(state, 'update', env))) {
            return action;
        }
        context.projectKey = existing.projectKey;
        context.issueType = { id: existing.issueTypeId, name: existing.issueTypeName, subtask: existing.isSubtask };

        const fieldsMeta = await env.lookup.getEditFields(existing.key);
        if (!fieldsMeta) {
            setCellError(
                state,
                pseudoFields.issuekey,
                'Unable to read the edit screen of the issue. Check if you have permission to edit it.',
            );
            return action;
        }
        context.fieldsMeta = fieldsMeta;

        validateIssueTypeForUpdate(state);
        if (action === 'update') {
            await validateParentForUpdate(state, env);
        } else if (getCell(state, pseudoFields.parent)?.input) {
            state.cells[pseudoFields.parent] = { ...getCell(state, pseudoFields.parent), unchanged: true };
        }
        return action;
    }

    if (await validateProjectAndType(state, 'clone', env)) {
        context.fieldsMeta = await env.lookup.getCreateFields(context.projectKey!, context.issueType!.id);
        await validateParentForNewIssue(state, env);
    }

    return action;
}

export async function validateRow(sourceRow: ImportRow, columns: ImportColumn[], env: ResolveEnv): Promise<ValidationResult> {
    const state: ValidationState = {
        row: { ...sourceRow, existingDisplay: {} },
        cells: resetCells(sourceRow.cells),
        context: {},
        warnings: [],
        missingRequired: [],
    };

    const hasKey = !!getCell(state, pseudoFields.issuekey)?.input;
    let action: ImportAction = hasKey ? (sourceRow.delete ? 'delete' : sourceRow.clone ? 'clone' : 'update') : 'create';

    if (hasKey) {
        action = await validateKeyedRow(state, action, columns, env);
    } else if (await validateProjectAndType(state, 'create', env)) {
        state.context.fieldsMeta = await env.lookup.getCreateFields(state.context.projectKey!, state.context.issueType!.id);
        await validateParentForNewIssue(state, env);
    }

    const { context } = state;
    const canValidateFields = action !== 'delete' && !!context.fieldsMeta && !getCell(state, pseudoFields.issuekey)?.error;

    if (canValidateFields) {
        await validateStatus(state, action, env);

        const fieldColumns = columns.filter((c) => c.role === 'field' && !c.invalid && !specialFields.includes(c.field));
        await Promise.all(fieldColumns.map((column) => validateFieldColumn(state, column, action, env)));
        await validateComment(state, env);

        if (action === 'create' || context.cloneAsCopy) {
            collectMissingRequired(state, columns);
        }
        validateTransitionFields(state);

        if (action === 'update' && !hasAnyChange(state)) {
            action = 'none';
            state.warnings.push(msgNoChanges);
        }
    }

    const row: ImportRow = {
        ...state.row,
        cells: state.cells,
        context,
        status: {
            ...sourceRow.status,
            action,
            state: sourceRow.status.state === 'imported' ? 'imported' : 'ready',
            validating: false,
            error: undefined,
            warnings: state.warnings,
            conflict: undefined,
        },
    };

    const hadError = rowHasError(sourceRow);
    const hasError = rowHasError(row);
    if (hasError || action === 'none') {
        row.selected = false;
    } else if (hadError || sourceRow.status.action === 'none') {
        row.selected = true;
    }

    return { row, missingRequired: state.missingRequired };
}

export function applyCrossRowChecks(rows: ImportRow[]): ImportRow[] {
    const usage = new Map<string, ImportRow[]>();
    rows.forEach((row) => {
        const key = row.cells[pseudoFields.issuekey]?.input;
        if (key && row.status.state !== 'imported' && row.status.action !== 'none') {
            usage.set(key, [...(usage.get(key) || []), row]);
        }
    });

    const describeLines = (list: ImportRow[]) => list.map((r) => (r.line ? `line ${r.line}` : 'another row')).join(', ');

    return rows.map((row) => {
        const key = row.cells[pseudoFields.issuekey]?.input;
        const others = ((key && usage.get(key)) || []).filter((r) => r !== row);
        let conflict: ImportRow['status']['conflict'];

        const isDeleteConflict = others.length > 0 && (row.status.action === 'delete' || others.some((r) => r.status.action === 'delete'));
        const otherUpdates = others.filter((r) => r.status.action === 'update');

        if (isDeleteConflict) {
            conflict = {
                message: `${key} is deleted in one row and also used in ${describeLines(others)}. Keep only one of them.`,
                isError: true,
            };
        } else if (row.status.action === 'update' && otherUpdates.length) {
            conflict = {
                message: `${key} is also updated in ${describeLines(otherUpdates)}. Rows are imported in parallel and so the order is not guaranteed.`,
                isError: false,
            };
        }

        if (row.status.conflict?.message === conflict?.message) {
            return row;
        }

        const updated = { ...row, status: { ...row.status, conflict } };
        if (conflict?.isError) {
            updated.selected = false;
        }
        return updated;
    });
}

export async function validateRows(
    rows: ImportRow[],
    columns: ImportColumn[],
    env: ResolveEnv,
    onValidated: (row: ImportRow) => void,
): Promise<JiraFieldMeta[]> {
    const keys = rows.flatMap((r) => [
        ...splitKeyList(r.cells[pseudoFields.issuekey]?.input),
        ...splitKeyList(r.cells[pseudoFields.parent]?.input),
    ]);
    const fieldsToFetch = columns.filter((c) => c.role === 'field' && !c.invalid && !specialFields.includes(c.field)).map((c) => c.field);
    await env.lookup.prefetchIssues(keys, fieldsToFetch);

    const missing = new Map<string, JiraFieldMeta>();
    await runOnQueue(rows, validationConcurrency, async (row) => {
        let result: ValidationResult;
        try {
            result = await validateRow(row, columns, env);
        } catch (err) {
            console.error('Unexpected error while validating row', row, err);
            result = {
                row: {
                    ...row,
                    selected: false,
                    status: { ...row.status, validating: false, error: 'Unexpected error while validating. Check console for details.' },
                },
                missingRequired: [],
            };
        }
        result.missingRequired.forEach((meta) => missing.set(meta.key, meta));
        onValidated(result.row);
    });

    return [...missing.values()];
}
