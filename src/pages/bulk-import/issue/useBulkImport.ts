import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { runOnQueue } from '@utils/array-utils';

import { inject } from '@services';

import type { JiraFieldDefinition, JiraFieldMeta } from '@types';

import { exportRows, parseCsvFile } from './csv';
import { createHeaderResolver, epicLinkCustomType, getKindFromSchema } from './field-kinds';
import { importRow, type ImportEnv } from './importer';
import { createJiraLookup } from './jira-lookup';
import {
    buildColumns,
    buildRows,
    createColumnForField,
    createDataColumn,
    createFieldColumn,
    createRowsForIssues,
    getDefaultColumns,
} from './row-builder';
import { useIssueImportStore } from './store';
import type { ImportColumn, ImportRow } from './types';
import { applyCrossRowChecks, canImportRow, validateRow, validateRows } from './validator';
import { getDateFormats } from './value-resolver';

const importConcurrency = 4;
const maxIssuesFromJql = 1000;
const msgFieldsLoadFailed = 'Unable to load the list of fields from Jira. Custom fields will not be recognized.';
const msgOnlyCsv = 'Only CSV files are supported. Save your spreadsheet as CSV (Comma delimited) and try again.';
const msgFileReadFailed = 'Unable to read the file';
const msgNoIssuesForJql = 'No issues found for the query';
const msgValidationFailed = 'Unexpected error while validating. Check console for details.';

function markValidating(row: ImportRow, bumpRevision: boolean): ImportRow {
    return { ...row, revision: bumpRevision ? row.revision + 1 : row.revision, status: { ...row.status, validating: true } };
}

function isPendingRow(row: ImportRow): boolean {
    return row.status.state !== 'imported';
}

export interface ImportSummary {
    imported: number;
    failed: number;
}

export default function useBulkImport() {
    const { $jira, $message, $session, $userutils } = useMemo(
        () => inject('JiraService', 'MessageService', 'SessionService', 'UserUtilsService'),
        [],
    );
    const [fieldDefinitions, setFieldDefinitions] = useState<JiraFieldDefinition[]>([]);
    const fieldsRequestRef = useRef<Promise<JiraFieldDefinition[]>>(Promise.resolve([]));
    const loadedFieldsRef = useRef<JiraFieldDefinition[]>([]);
    const cancelRef = useRef(false);

    const createEnv = useCallback((): ImportEnv => {
        const { isAtlasCloud, dateFormat, timeFormat } = $session.CurrentUser || {};
        const epicLinkFields = loadedFieldsRef.current.filter((f) => f.schema?.custom === epicLinkCustomType).map((f) => f.id);
        return {
            $jira,
            lookup: createJiraLookup($jira, !!isAtlasCloud, epicLinkFields),
            ...getDateFormats(dateFormat, timeFormat),
            formatDate: (date) => $userutils.formatDate(date),
            formatDateTime: (date) => $userutils.formatDateTime(date),
        };
    }, [$jira, $session, $userutils]);

    const envRef = useRef<ImportEnv | null>(null);
    const getEnv = useCallback(() => {
        if (!envRef.current) {
            envRef.current = createEnv();
        }
        return envRef.current;
    }, [createEnv]);

    useEffect(() => {
        const request = $jira.getCustomFields().then(
            (fields: JiraFieldDefinition[]) => fields,
            (err: unknown) => {
                console.error('Unable to load Jira fields', err);
                $message.error(msgFieldsLoadFailed);
                return [];
            },
        );
        fieldsRequestRef.current = request;
        request.then((fields) => {
            loadedFieldsRef.current = fields;
            setFieldDefinitions(fields);
        });
    }, [$jira, $message]);

    const finalizeRows = useCallback(() => useIssueImportStore.getState().setRows(applyCrossRowChecks), []);

    const addMissingColumns = useCallback(
        (missing: JiraFieldMeta[]): boolean => {
            const { columns, setColumns } = useIssueImportStore.getState();
            const existing = new Set(columns.map((c) => c.field));
            const newColumns = missing
                .filter((meta) => !existing.has(meta.key))
                .map((meta) => {
                    const definition = fieldDefinitions.find((d) => d.id === meta.key);
                    return definition
                        ? createFieldColumn(definition)
                        : createDataColumn({ field: meta.key, kind: getKindFromSchema(meta.schema, meta.key) }, meta.name);
                });

            if (newColumns.length) {
                setColumns([...columns, ...newColumns]);
                $message.info(`Required field(s) added as columns: ${newColumns.map((c) => c.header).join(', ')}`);
            }
            return newColumns.length > 0;
        },
        [fieldDefinitions, $message],
    );

    const revalidate = useCallback(
        async (rowIds?: number[]) => {
            const { rows, setRows, applyRowResults } = useIssueImportStore.getState();
            const ids = new Set(rowIds || rows.filter(isPendingRow).map((r) => r.rowId));
            setRows((list) => list.map((r) => (ids.has(r.rowId) ? markValidating(r, false) : r)));

            const env = getEnv();
            const toValidate = useIssueImportStore.getState().rows.filter((r) => ids.has(r.rowId));
            const { columns } = useIssueImportStore.getState();

            const missing = await validateRows(toValidate, columns, env, (row) => applyRowResults([row]));

            if (addMissingColumns(missing)) {
                const { rows: latest, columns: latestColumns } = useIssueImportStore.getState();
                const affected = latest.filter((r) => ids.has(r.rowId) && (r.status.action === 'create' || r.status.action === 'clone'));
                await validateRows(affected, latestColumns, env, (row) => applyRowResults([row]));
            }

            finalizeRows();
        },
        [getEnv, addMissingColumns, finalizeRows],
    );

    const validateSingleRow = useCallback(
        async (rowId: number) => {
            const { rows, columns, applyRowResults } = useIssueImportStore.getState();
            const row = rows.find((r) => r.rowId === rowId);
            if (!row) {
                return;
            }

            let result;
            try {
                result = await validateRow(row, columns, getEnv());
            } catch (err) {
                console.error('Unexpected error while validating row', row, err);
                applyRowResults([{ ...row, selected: false, status: { ...row.status, validating: false, error: msgValidationFailed } }]);
                return;
            }

            const { row: validated, missingRequired } = result;
            applyRowResults([validated]);
            if (addMissingColumns(missingRequired)) {
                await revalidate([rowId]);
            } else {
                finalizeRows();
            }
        },
        [getEnv, addMissingColumns, revalidate, finalizeRows],
    );

    const loadData = useCallback(
        async (columns: ImportColumn[], rows: ImportRow[], source: string, notices: string[]) => {
            const { setData, setPhase } = useIssueImportStore.getState();
            envRef.current = createEnv();
            setData({ columns, rows: rows.map((r) => markValidating(r, false)), source, notices });
            setPhase('loading');
            try {
                await revalidate();
            } finally {
                setPhase('idle');
            }
        },
        [createEnv, revalidate],
    );

    const loadFile = useCallback(
        async (file: File) => {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                $message.warning(msgOnlyCsv);
                return;
            }

            try {
                const [parsed, definitions] = await Promise.all([parseCsvFile(file), fieldsRequestRef.current]);
                const { columns, fieldByIndex } = buildColumns(parsed, createHeaderResolver(definitions));
                const rows = buildRows(parsed, fieldByIndex);
                const invalidColumns = columns.filter((c) => c.invalid).map((c) => c.header || '(blank)');
                const notices = [...parsed.warnings];
                if (invalidColumns.length) {
                    notices.unshift(
                        `Following columns will not be imported: ${invalidColumns.join(', ')}. Hover over the column header to know why.`,
                    );
                }
                if (rows.length > parsed.records.length) {
                    notices.unshift(
                        `${parsed.records.length} lines in the file are expanded to ${rows.length} rows as some rows have multiple issue keys, parents or projects.`,
                    );
                }
                await loadData(columns, rows, file.name, notices);
            } catch (err) {
                $message.error(err instanceof Error ? err.message : msgFileReadFailed);
            }
        },
        [loadData, $message],
    );

    const loadFromJql = useCallback(
        async (jql: string, fieldIds: string[]): Promise<boolean> => {
            let issues: { key: string }[];
            try {
                issues = await $jira.searchTickets(jql, ['key'], undefined, { maxResults: maxIssuesFromJql });
            } catch {
                return false;
            }

            if (!issues.length) {
                $message.warning(msgNoIssuesForJql);
                return false;
            }

            const definitions = await fieldsRequestRef.current;
            const columns = getDefaultColumns();
            fieldIds.forEach((id) => {
                const column = createColumnForField(id, definitions);
                if (column && !columns.some((c) => c.field === column.field)) {
                    columns.push(column);
                }
            });

            const notices = issues.length >= maxIssuesFromJql ? [`Only the first ${maxIssuesFromJql} issues of the query are loaded`] : [];
            await loadData(columns, createRowsForIssues(issues.map((i) => i.key)), `JQL: ${jql}`, notices);
            return true;
        },
        [$jira, $message, loadData],
    );

    const addColumn = useCallback(
        async (fieldId: string) => {
            const column = createColumnForField(fieldId, fieldDefinitions);
            const { columns, setColumns } = useIssueImportStore.getState();
            if (!column || columns.some((c) => c.field === column.field)) {
                return;
            }
            setColumns([...columns, column]);
            await revalidate();
        },
        [fieldDefinitions, revalidate],
    );

    const removeColumn = useCallback(
        async (field: string) => {
            const { columns, setColumns, setRows } = useIssueImportStore.getState();
            setColumns(columns.filter((c) => c.field !== field));
            setRows((rows) =>
                rows.map((row) => {
                    if (!row.cells[field]) {
                        return row;
                    }
                    const cells = { ...row.cells };
                    delete cells[field];
                    return { ...row, cells, revision: row.revision + 1 };
                }),
            );
            await revalidate();
        },
        [revalidate],
    );

    const updateGrid = useCallback(
        (newRows: ImportRow[], newColumns: ImportColumn[]) => {
            const { rows, columns, setColumns, setRows } = useIssueImportStore.getState();
            if (newColumns !== columns) {
                setColumns(newColumns);
            }

            const acceptedRows = newRows.map((row, index) => (rows[index] && !isPendingRow(rows[index]) ? rows[index] : row));
            const changedIds = acceptedRows.filter((row, index) => row !== rows[index]).map((r) => r.rowId);
            if (!changedIds.length) {
                return;
            }

            const changed = new Set(changedIds);
            setRows(() => acceptedRows.map((row) => (changed.has(row.rowId) ? markValidating(row, false) : row)));

            if (changedIds.length === 1) {
                validateSingleRow(changedIds[0]);
            } else {
                revalidate(changedIds);
            }
        },
        [validateSingleRow, revalidate],
    );

    const updateRowFlags = useCallback(
        (rowId: number, flags: Partial<Pick<ImportRow, 'clone' | 'delete'>>) => {
            useIssueImportStore
                .getState()
                .setRows((rows) => rows.map((r) => (r.rowId === rowId ? markValidating({ ...r, ...flags }, true) : r)));
            validateSingleRow(rowId);
        },
        [validateSingleRow],
    );

    const toggleClone = useCallback((row: ImportRow) => updateRowFlags(row.rowId, { clone: !row.clone, delete: false }), [updateRowFlags]);

    const toggleDelete = useCallback(
        (row: ImportRow) => updateRowFlags(row.rowId, { delete: !row.delete, clone: false }),
        [updateRowFlags],
    );

    const toggleSelection = useCallback((row: ImportRow) => {
        if (!canImportRow(row)) {
            return;
        }
        useIssueImportStore.getState().setRows((rows) => rows.map((r) => (r.rowId === row.rowId ? { ...r, selected: !r.selected } : r)));
    }, []);

    const selectAll = useCallback((selected: boolean) => {
        useIssueImportStore.getState().setRows((rows) => rows.map((r) => ({ ...r, selected: selected && canImportRow(r) })));
    }, []);

    const importSelected = useCallback(async (): Promise<ImportSummary> => {
        const { rows, columns, setRows, applyRowResults, setPhase, setProgress } = useIssueImportStore.getState();
        const toImport = rows.filter((r) => r.selected && canImportRow(r));
        const env = getEnv();
        const summary: ImportSummary = { imported: 0, failed: 0 };

        cancelRef.current = false;
        setPhase('importing');
        setProgress({ current: 0, total: toImport.length });
        const ids = new Set(toImport.map((r) => r.rowId));
        setRows((list) => list.map((r) => (ids.has(r.rowId) ? { ...r, status: { ...r.status, state: 'importing' } } : r)));

        let completed = 0;
        try {
            await runOnQueue(toImport, importConcurrency, async (row) => {
                const latest = useIssueImportStore.getState().rows.find((r) => r.rowId === row.rowId) || row;
                if (cancelRef.current) {
                    applyRowResults([{ ...latest, status: { ...latest.status, state: 'ready' } }], true);
                    return;
                }

                const result = await importRow(latest, columns, env);
                if (result.status.state === 'imported') {
                    summary.imported++;
                } else {
                    summary.failed++;
                }
                applyRowResults([result], true);
                setProgress({ current: ++completed, total: toImport.length });
            });
        } finally {
            setPhase('idle');
            finalizeRows();
        }

        return summary;
    }, [getEnv, finalizeRows]);

    const cancelImport = useCallback(() => {
        cancelRef.current = true;
    }, []);

    const revalidateAll = useCallback(() => revalidate(), [revalidate]);

    const exportData = useCallback(() => {
        const { rows, columns } = useIssueImportStore.getState();
        exportRows(rows, columns);
    }, []);

    const clear = useCallback(() => {
        envRef.current = null;
        useIssueImportStore.getState().reset();
    }, []);

    return {
        fieldDefinitions,
        loadFile,
        loadFromJql,
        addColumn,
        removeColumn,
        updateGrid,
        toggleClone,
        toggleDelete,
        toggleSelection,
        selectAll,
        importSelected,
        cancelImport,
        exportData,
        clear,
        revalidateAll,
        getTicketUrl: $userutils.getTicketUrl,
    };
}
