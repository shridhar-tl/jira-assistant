import type JiraService from '@services/jira-service';

import type { JiraErrorResponse, JiraFieldMetaMap, JiraRequestError, JiraTransition } from '@types';

import { getKindFromMeta, normalizeForCompare, pseudoFields, timeTrackingField } from './field-kinds';
import { toPayloadFromJiraValue } from './jira-values';
import type { ImportCell, ImportColumn, ImportRow } from './types';
import { getMetaKey } from './validator';
import { resolveValue, type ResolveEnv } from './value-resolver';

export interface ImportEnv extends ResolveEnv {
    $jira: JiraService;
}

interface FieldPayload {
    fields: Record<string, unknown>;
    pending: string[];
}

const msgCheckHighlightedCells = 'Jira rejected the values of the highlighted cells';
const msgCheckConsole = 'Check the console for details';
const msgAlreadyDeleted = 'Issue was already deleted, possibly along with its parent issue';
const msgCloneQueued = 'Cloning is queued in Jira as it takes longer. Check the issue in Jira after some time.';

const fieldsNotCopied = [
    'project',
    'issuetype',
    'parent',
    'summary',
    'attachment',
    'issuelinks',
    'worklog',
    'comment',
    'timetracking',
    'status',
    'resolution',
];
const nonFieldColumns: string[] = [
    pseudoFields.issuekey,
    pseudoFields.project,
    pseudoFields.issuetype,
    pseudoFields.parent,
    pseudoFields.status,
    pseudoFields.comment,
];

function isJiraErrorResponse(value: unknown): value is JiraErrorResponse {
    return typeof value === 'object' && value !== null && ('errors' in value || 'errorMessages' in value);
}

function parseJiraError(err: unknown): { messages: string[]; fieldErrors: Record<string, string> } {
    const requestError = (err || {}) as JiraRequestError;
    let body: unknown = requestError.error;

    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            body = { errorMessages: [body] };
        }
    }

    const messages: string[] = [];
    const fieldErrors: Record<string, string> = {};

    if (isJiraErrorResponse(body)) {
        messages.push(...(body.errorMessages || []));
        Object.assign(fieldErrors, body.errors || {});
    }

    if (!messages.length && !Object.keys(fieldErrors).length) {
        messages.push(
            err instanceof Error
                ? err.message
                : `Jira returned ${requestError.status || 'an error'}${requestError.response ? `: ${requestError.response}` : ''}`,
        );
    }

    return { messages, fieldErrors };
}

function isEndpointUnavailable(err: unknown): boolean {
    const status = (err as JiraRequestError)?.status;
    return status === 404 || status === 405 || status === 403;
}

function getDataColumns(columns: ImportColumn[]): ImportColumn[] {
    return columns.filter((c) => c.role === 'field' && !c.invalid && !nonFieldColumns.includes(c.field));
}

function isCellToBeSent(cell: ImportCell | undefined): cell is ImportCell {
    return !!cell && !cell.error && !cell.unchanged && (cell.payload !== undefined || !!cell.clear);
}

function addFieldValue(fields: Record<string, unknown>, field: string, value: unknown): void {
    if (field === pseudoFields.originalEstimate || field === pseudoFields.remainingEstimate) {
        const timeTracking = (fields[timeTrackingField] as Record<string, unknown>) || {};
        timeTracking[field === pseudoFields.originalEstimate ? 'originalEstimate' : 'remainingEstimate'] = value;
        fields[timeTrackingField] = timeTracking;
    } else {
        fields[field] = value;
    }
}

function collectFields(row: ImportRow, columns: ImportColumn[], meta: JiraFieldMetaMap, includeDeferred: boolean): FieldPayload {
    const result: FieldPayload = { fields: {}, pending: [] };

    getDataColumns(columns).forEach(({ field }) => {
        const cell = row.cells[field];
        if (!isCellToBeSent(cell) || (cell.deferred && !includeDeferred)) {
            return;
        }

        if (meta[getMetaKey(field)]) {
            addFieldValue(result.fields, field, cell.payload);
        } else {
            result.pending.push(field);
        }
    });

    return result;
}

function getParentPayload(row: ImportRow): Record<string, unknown> {
    const { parentFieldId } = row.context;
    const cell = row.cells[pseudoFields.parent];
    return parentFieldId && isCellToBeSent(cell) ? { [parentFieldId]: cell.payload } : {};
}

function markImported(row: ImportRow, resultKey: string | undefined, warnings: string[]): ImportRow {
    return {
        ...row,
        selected: false,
        status: { ...row.status, state: 'imported', resultKey, error: undefined, warnings },
    };
}

function markFailed(row: ImportRow, err: unknown, prefix: string, resultKey?: string): ImportRow {
    const { messages, fieldErrors } = parseJiraError(err);
    const cells = { ...row.cells };
    const unmatched: string[] = [];

    Object.keys(fieldErrors).forEach((field) => {
        const column = Object.keys(cells).find((f) => getMetaKey(f) === field);
        if (column) {
            cells[column] = { ...cells[column], error: fieldErrors[field] };
        } else {
            unmatched.push(`${field}: ${fieldErrors[field]}`);
        }
    });

    console.error(prefix, row, err);

    const error = [...messages, ...unmatched].join('; ');
    return {
        ...row,
        cells,
        status: {
            ...row.status,
            state: resultKey ? 'imported' : 'failed',
            resultKey,
            error: resultKey
                ? undefined
                : `${prefix}: ${error || (Object.keys(fieldErrors).length ? msgCheckHighlightedCells : msgCheckConsole)}`,
            warnings: resultKey ? [...row.status.warnings, `${prefix}: ${error}`] : row.status.warnings,
        },
        selected: false,
    };
}

async function findTransition(env: ImportEnv, key: string, statusName: string): Promise<JiraTransition | undefined> {
    const transitions = await env.$jira.getIssueTransitions(key);
    const target = normalizeForCompare(statusName);
    return (
        transitions.find((t) => normalizeForCompare(t.to.name) === target) ||
        transitions.find((t) => normalizeForCompare(t.name) === target)
    );
}

async function applyStatusAndComment(
    row: ImportRow,
    columns: ImportColumn[],
    key: string,
    env: ImportEnv,
    pendingFields: string[],
): Promise<string[]> {
    const warnings: string[] = [];
    const statusCell = row.cells[pseudoFields.status];
    const remainingFields = [...pendingFields];

    if (isCellToBeSent(statusCell)) {
        try {
            const transition =
                row.context.transition && row.status.action === 'update'
                    ? row.context.transition
                    : await findTransition(env, key, String(statusCell.payload));

            if (!transition) {
                const issue = await env.$jira.getIssue<{ fields: { status?: { name: string } } }>(key, ['status']);
                if (normalizeForCompare(issue.fields.status?.name) !== normalizeForCompare(String(statusCell.payload))) {
                    warnings.push(
                        `Status could not be changed to "${statusCell.payload}" as the workflow does not allow it from the current status`,
                    );
                }
            } else {
                const transitionFields: Record<string, unknown> = {};
                getDataColumns(columns).forEach(({ field }) => {
                    const cell = row.cells[field];
                    const index = remainingFields.indexOf(field);
                    if (index > -1 && isCellToBeSent(cell) && transition.fields[getMetaKey(field)]) {
                        addFieldValue(transitionFields, field, cell.payload);
                        remainingFields.splice(index, 1);
                    }
                });
                await env.$jira.transitionIssue(key, transition.id, transitionFields);
            }
        } catch (err) {
            const { messages, fieldErrors } = parseJiraError(err);
            warnings.push(`Status could not be changed: ${[...messages, ...Object.values(fieldErrors)].join('; ')}`);
        }
    }

    if (remainingFields.length) {
        const names = remainingFields.map((f) => columns.find((c) => c.field === f)?.header || f);
        warnings.push(`Following fields are not available in the screens of the issue and hence not imported: ${names.join(', ')}`);
    }

    const commentCell = row.cells[pseudoFields.comment];
    if (isCellToBeSent(commentCell)) {
        try {
            await env.$jira.addComment(key, String(commentCell.payload));
        } catch (err) {
            warnings.push(`Comment could not be added: ${parseJiraError(err).messages.join('; ')}`);
        }
    }

    return warnings;
}

async function resolveDeferredFields(
    row: ImportRow,
    columns: ImportColumn[],
    key: string,
    env: ImportEnv,
    pending: string[],
): Promise<FieldPayload> {
    const deferredColumns = getDataColumns(columns).filter((c) => row.cells[c.field]?.deferred || pending.includes(c.field));
    if (!deferredColumns.length) {
        return { fields: {}, pending: [] };
    }

    const editMeta = await env.$jira.getIssueEditMeta(key);
    const result: FieldPayload = { fields: {}, pending: [] };

    await Promise.all(
        deferredColumns.map(async (column) => {
            const cell = row.cells[column.field];
            const meta = editMeta[getMetaKey(column.field)];
            if (!isCellToBeSent(cell)) {
                return;
            }
            if (!meta) {
                result.pending.push(column.field);
                return;
            }
            const resolved = await resolveValue(getKindFromMeta(meta, column), meta, cell.input || '', env, row.context.projectKey);
            if (resolved.error) {
                result.pending.push(column.field);
            } else {
                addFieldValue(result.fields, column.field, resolved.payload);
            }
        }),
    );

    return result;
}

async function completeNewIssue(
    row: ImportRow,
    columns: ImportColumn[],
    key: string,
    env: ImportEnv,
    pending: string[],
): Promise<ImportRow> {
    const warnings: string[] = [];
    let pendingFields = pending;

    try {
        const deferred = await resolveDeferredFields(row, columns, key, env, pending);
        pendingFields = deferred.pending;
        if (Object.keys(deferred.fields).length) {
            await env.$jira.updateIssue(key, { fields: deferred.fields });
        }
    } catch (err) {
        warnings.push(`Issue ${key} is created but some fields could not be updated: ${parseJiraError(err).messages.join('; ')}`);
    }

    warnings.push(...(await applyStatusAndComment(row, columns, key, env, pendingFields)));
    return markImported(row, key, warnings);
}

async function createIssue(row: ImportRow, columns: ImportColumn[], env: ImportEnv): Promise<ImportRow> {
    const { projectKey, issueType, fieldsMeta = {} } = row.context;
    const { fields, pending } = collectFields(row, columns, fieldsMeta, false);

    const payload = { ...fields, ...getParentPayload(row), project: { key: projectKey }, issuetype: { id: issueType?.id } };

    let key: string;
    try {
        ({ key } = await env.$jira.createIssue(payload));
    } catch (err) {
        return markFailed(row, err, 'Create failed');
    }

    return completeNewIssue(row, columns, key, env, pending);
}

async function copyIssue(row: ImportRow, columns: ImportColumn[], env: ImportEnv): Promise<ImportRow> {
    const { existing, projectKey, issueType, fieldsMeta = {} } = row.context;
    if (!existing) {
        return row;
    }

    let source;
    try {
        source = await env.lookup.getFullIssue(existing.key);
    } catch (err) {
        return markFailed(row, err, 'Unable to read the issue to be cloned');
    }

    const copiedFields: Record<string, unknown> = {};
    Object.values(fieldsMeta).forEach((meta) => {
        if (fieldsNotCopied.includes(meta.key) || (meta.operations && !meta.operations.includes('set'))) {
            return;
        }
        const value = toPayloadFromJiraValue(meta, source.fields[meta.key]);
        if (value !== undefined) {
            copiedFields[meta.key] = value;
        }
    });

    const sourceTimeTracking = source.fields.timetracking as { originalEstimate?: string } | undefined;
    if (fieldsMeta[timeTrackingField] && sourceTimeTracking?.originalEstimate) {
        copiedFields[timeTrackingField] = { originalEstimate: sourceTimeTracking.originalEstimate };
    }

    const { fields, pending } = collectFields(row, columns, fieldsMeta, false);
    const summaryCell = row.cells.summary;
    const parentPayload = getParentPayload(row);
    const canKeepSourceParent = issueType?.subtask ? existing.isSubtask : !existing.isSubtask && !!fieldsMeta[pseudoFields.parent];
    if (!Object.keys(parentPayload).length && existing.parentKey && canKeepSourceParent) {
        parentPayload[pseudoFields.parent] = { key: existing.parentKey };
    }

    const payload = {
        ...copiedFields,
        ...fields,
        ...parentPayload,
        project: { key: projectKey },
        issuetype: { id: issueType?.id },
        summary: isCellToBeSent(summaryCell) ? summaryCell.payload : existing.summary,
    };

    let key: string;
    try {
        ({ key } = await env.$jira.createIssue(payload));
    } catch (err) {
        return markFailed(row, err, 'Clone failed');
    }

    return completeNewIssue(row, columns, key, env, pending);
}

async function cloneIssue(row: ImportRow, columns: ImportColumn[], env: ImportEnv): Promise<ImportRow> {
    const { existing, fieldsMeta = {} } = row.context;
    if (!existing) {
        return row;
    }

    if (row.context.cloneAsCopy) {
        return copyIssue(row, columns, env);
    }

    const summaryCell = row.cells.summary;
    const summary = isCellToBeSent(summaryCell) ? String(summaryCell.payload) : existing.summary;

    let response: { key?: string };
    try {
        response = await env.$jira.cloneIssue(existing.key, summary);
    } catch (err) {
        if (isEndpointUnavailable(err)) {
            // Jira clone API is an internal API which may not be available. Fallback to creating a copy of the issue
            const createMeta = await env.lookup.getCreateFields(existing.projectKey, existing.issueTypeId);
            return copyIssue({ ...row, context: { ...row.context, cloneAsCopy: true, fieldsMeta: createMeta } }, columns, env);
        }
        return markFailed(row, err, 'Clone failed');
    }

    if (!response.key) {
        return markImported(row, undefined, [msgCloneQueued]);
    }

    const { key } = response;
    const { fields, pending } = collectFields(row, columns, fieldsMeta, true);
    delete fields.summary;

    try {
        if (Object.keys(fields).length) {
            await env.$jira.updateIssue(key, { fields });
        }
    } catch (err) {
        return markFailed(row, err, `Issue is cloned as ${key}, but the values could not be updated`, key);
    }

    const warnings = await applyStatusAndComment(row, columns, key, env, pending);
    return markImported(row, key, warnings);
}

async function updateIssue(row: ImportRow, columns: ImportColumn[], env: ImportEnv): Promise<ImportRow> {
    const { existing, fieldsMeta = {} } = row.context;
    if (!existing) {
        return row;
    }

    const { fields, pending } = collectFields(row, columns, fieldsMeta, true);
    const typeCell = row.cells[pseudoFields.issuetype];
    if (isCellToBeSent(typeCell)) {
        fields.issuetype = typeCell.payload;
    }
    Object.assign(fields, getParentPayload(row));

    try {
        if (Object.keys(fields).length) {
            await env.$jira.updateIssue(existing.key, { fields });
        }
    } catch (err) {
        return markFailed(row, err, 'Update failed');
    }

    const warnings = await applyStatusAndComment(row, columns, existing.key, env, pending);
    env.lookup.invalidateIssue(existing.key);
    return markImported(row, existing.key, warnings);
}

async function deleteIssue(row: ImportRow, env: ImportEnv): Promise<ImportRow> {
    const { existing } = row.context;
    if (!existing) {
        return row;
    }

    try {
        await env.$jira.deleteIssue(existing.key, existing.subtaskCount > 0);
    } catch (err) {
        if ((err as JiraRequestError)?.status !== 404) {
            return markFailed(row, err, 'Delete failed');
        }
        env.lookup.invalidateIssue(existing.key);
        return markImported(row, existing.key, [msgAlreadyDeleted]);
    }

    env.lookup.invalidateIssue(existing.key);
    return markImported(row, existing.key, []);
}

export async function importRow(row: ImportRow, columns: ImportColumn[], env: ImportEnv): Promise<ImportRow> {
    try {
        switch (row.status.action) {
            case 'create':
                return await createIssue(row, columns, env);
            case 'update':
                return await updateIssue(row, columns, env);
            case 'clone':
                return await cloneIssue(row, columns, env);
            case 'delete':
                return await deleteIssue(row, env);
            default:
                return row;
        }
    } catch (err) {
        return markFailed(row, err, 'Import failed');
    }
}
