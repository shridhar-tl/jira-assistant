import { useCallback, useMemo, useRef, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';


import { Dialog } from '@/dialogs/CommonDialog';

import { inject } from '@services';

import { Button, Dropdown, type ComponentEvent } from '@components';

import ImportGrid from './components/ImportGrid';
import ImportSummaryBar from './components/ImportSummaryBar';
import JqlLoaderDialog from './components/JqlLoaderDialog';
import { downloadTemplate } from './csv';
import ImportInstructions from './ImportInstructions';
import { getAddableFields, getDefaultColumns } from './row-builder';
import { calculateStats } from './stats';
import { useIssueImportStore } from './store';
import type { ImportStats } from './types';
import useBulkImport from './useBulkImport';

/**
 Scenarios to handle

 Record with key:
 - With correct project
 - With different project
 - With correct parent
 - With different parent (need to check for issue type)

 Record without key:
 - With project
 - With parent
 - Without project and parent
 - with different project and parent

 - Repeat issues with multiple parent or project
 - Use JQL to pull records
 - Allow removing columns or not
 - Allow editing columns or not (not required)
 - context menu support for row and col header - insert row / col, delete row / col
 - Support for deleting issues
 - Option to use bulk / individual import / delete
 */

const defaultFields = new Set(getDefaultColumns().map((c) => c.field));
const msgConfirmClear = 'All the rows loaded and the changes made in the grid will be removed. Do you want to continue?';

function getImportResultMessage(imported: number, failed: number): string {
    return failed
        ? `${imported} row(s) imported and ${failed} row(s) failed. Hover over the status of failed rows to see the reason. Correct the highlighted cells or select the failed rows to import them again.`
        : `${imported} row(s) imported successfully`;
}

function getConfirmMessage(stats: ImportStats): React.ReactNode {
    const parts = [
        stats.toCreate && `create ${stats.toCreate}`,
        stats.toUpdate && `update ${stats.toUpdate}`,
        stats.toClone && `clone ${stats.toClone}`,
        stats.toDelete && `delete ${stats.toDelete}`,
    ].filter(Boolean);

    return (
        <div className="flex flex-col gap-2 text-sm">
            <p>This will {parts.join(', ')} issue(s) in Jira. Changes made in Jira cannot be undone from here.</p>
            {stats.toDelete > 0 && (
                <p className="text-red-600 dark:text-red-400 font-medium">
                    <i className="fa fa-exclamation-triangle mr-1" />
                    {stats.toDelete} issue(s) and their sub-tasks will be permanently deleted.
                </p>
            )}
        </div>
    );
}

function BulkImportIssue() {
    const { columns, rows, phase, progress, source, notices } = useIssueImportStore(
        useShallow((s) => ({
            columns: s.columns,
            rows: s.rows,
            phase: s.phase,
            progress: s.progress,
            source: s.source,
            notices: s.notices,
        })),
    );
    const {
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
        getTicketUrl,
    } = useBulkImport();
    const { $message } = useMemo(() => inject('MessageService'), []);
    const [showHelp, setShowHelp] = useState(!rows.length);
    const [showJqlLoader, setShowJqlLoader] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stats = useMemo(() => calculateStats(rows), [rows]);
    const isBusy = phase !== 'idle';
    const hasData = rows.length > 0;
    const isValidating = phase === 'loading' || rows.some((r) => r.status.validating);

    const removableFields = useMemo(
        () => new Set(columns.filter((c) => c.role === 'field' && !defaultFields.has(c.field)).map((c) => c.field)),
        [columns],
    );

    const fieldOptions = useMemo(
        () =>
            getAddableFields(
                fieldDefinitions,
                columns.map((c) => c.field),
            ),
        [fieldDefinitions, columns],
    );

    const chooseFile = useCallback(() => fileInputRef.current?.click(), []);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) {
                setShowHelp(false);
                await loadFile(file);
            }
        },
        [loadFile],
    );

    const handleAddField = useCallback(
        (e: ComponentEvent<string>) => {
            if (e.value) {
                addColumn(e.value);
            }
        },
        [addColumn],
    );

    const handleLoadFromJql = useCallback(
        async (jql: string, fieldIds: string[]) => {
            setShowHelp(false);
            return loadFromJql(jql, fieldIds);
        },
        [loadFromJql],
    );

    const handleImport = useCallback(() => {
        Dialog.yesNo(getConfirmMessage(stats), 'Confirm import').then(async () => {
            const { imported, failed } = await importSelected();
            const message = getImportResultMessage(imported, failed);
            if (failed) {
                $message.warning(message);
            } else {
                $message.success(message);
            }
        });
    }, [stats, importSelected, $message]);

    const handleClear = useCallback(() => {
        Dialog.yesNo(msgConfirmClear, 'Clear all rows').then(() => {
            clear();
            setShowHelp(true);
        });
    }, [clear]);

    return (
        <div className="flex flex-col gap-4 p-4 sm:p-6 min-h-full bg-(--bg-secondary)">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-semibold text-(--text-primary) flex items-center gap-2">
                        <i className="fa fa-cloud-upload text-(--color-primary-600)" />
                        Bulk Import Issues
                    </h1>
                    <p className="text-sm text-(--text-secondary)">
                        Create, update, clone or delete many Jira issues at once using a CSV file or a JQL query
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        leftIcon={<i className="fa fa-question-circle" />}
                        label={showHelp ? 'Hide Help' : 'Show Help'}
                        onClick={() => setShowHelp(!showHelp)}
                    />
                    <Button
                        variant="secondary"
                        leftIcon={<i className="fa fa-download" />}
                        label="Download Template"
                        onClick={downloadTemplate}
                    />
                    <Button
                        variant="secondary"
                        leftIcon={<i className="fa fa-search" />}
                        label="Load by JQL"
                        onClick={() => setShowJqlLoader(true)}
                        disabled={isBusy}
                    />
                    <Button
                        variant="primary"
                        leftIcon={<i className="fa fa-upload" />}
                        label="Upload CSV"
                        onClick={chooseFile}
                        disabled={isBusy}
                    />
                    <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                </div>
            </div>

            {showHelp && <ImportInstructions />}

            {hasData && (
                <>
                    <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
                        <ImportSummaryBar stats={stats} />
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="w-56">
                                <Dropdown
                                    options={fieldOptions}
                                    value={null}
                                    searchable
                                    size="sm"
                                    placeholder="Add Field"
                                    readOnly={isBusy}
                                    onChange={handleAddField}
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                leftIcon={<i className="fa fa-refresh" />}
                                label="Revalidate"
                                onClick={revalidateAll}
                                disabled={isBusy}
                            />
                            <Button
                                size="sm"
                                variant="secondary"
                                leftIcon={<i className="fa fa-file-excel" />}
                                label="Export"
                                onClick={exportData}
                                disabled={isBusy}
                            />
                            <Button
                                size="sm"
                                variant="danger"
                                leftIcon={<i className="fa fa-trash" />}
                                label="Clear"
                                onClick={handleClear}
                                disabled={isBusy}
                            />
                            {phase === 'importing' ? (
                                <Button
                                    size="sm"
                                    variant="warning"
                                    leftIcon={<i className="fa fa-spinner fa-spin" />}
                                    label={`Importing ${progress.current}/${progress.total} (click to stop)`}
                                    onClick={cancelImport}
                                />
                            ) : (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    leftIcon={<i className="fa fa-cloud-upload" />}
                                    label={`Import ${stats.selected || ''} Selected`}
                                    onClick={handleImport}
                                    disabled={isBusy || isValidating || !stats.selected}
                                />
                            )}
                        </div>
                    </div>

                    {(!!source || !!notices.length) && (
                        <div className="flex flex-col gap-1 text-xs text-(--text-secondary)">
                            {!!source && (
                                <span className="truncate">
                                    <i className="fa fa-file-lines mr-1" />
                                    {source}
                                    {isValidating && (
                                        <span className="ml-2 text-(--color-primary-600)">
                                            <i className="fa fa-spinner fa-spin mr-1" />
                                            Validating with Jira...
                                        </span>
                                    )}
                                </span>
                            )}
                            {notices.map((notice) => (
                                <span key={notice} className="text-amber-700 dark:text-amber-400">
                                    <i className="fa fa-info-circle mr-1" />
                                    {notice}
                                </span>
                            ))}
                        </div>
                    )}

                    <ImportGrid
                        columns={columns}
                        rows={rows}
                        readOnly={phase === 'importing'}
                        removableFields={removableFields}
                        getTicketUrl={getTicketUrl}
                        onChange={updateGrid}
                        onToggleSelection={toggleSelection}
                        onSelectAll={selectAll}
                        onToggleClone={toggleClone}
                        onToggleDelete={toggleDelete}
                        onRemoveColumn={removeColumn}
                    />

                    {phase === 'importing' && progress.total > 0 && (
                        <div className="h-1.5 rounded-full bg-(--bg-tertiary) overflow-hidden">
                            <div
                                className="h-full bg-(--color-primary-600) transition-all"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            />
                        </div>
                    )}
                </>
            )}

            {!hasData && phase === 'loading' && (
                <div className="flex items-center justify-center gap-2 py-16 text-(--text-secondary)">
                    <i className="fa fa-spinner fa-spin" /> Reading the file...
                </div>
            )}

            {!hasData && phase === 'idle' && (
                <div className="flex flex-col items-center text-center gap-3 py-12 px-4 rounded-xl border border-dashed border-(--border-secondary) bg-(--bg-primary)">
                    <i className="fa fa-cloud-upload text-4xl text-(--text-tertiary)" />
                    <h2 className="text-lg font-semibold text-(--text-primary)">No issues loaded</h2>
                    <p className="text-sm text-(--text-secondary) max-w-xl">
                        Upload a CSV file to create or update issues, or load existing issues using JQL to change them in bulk. Download the
                        template to see examples of all the supported scenarios.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button
                            variant="secondary"
                            leftIcon={<i className="fa fa-download" />}
                            label="Download Template"
                            onClick={downloadTemplate}
                        />
                        <Button
                            variant="secondary"
                            leftIcon={<i className="fa fa-search" />}
                            label="Load by JQL"
                            onClick={() => setShowJqlLoader(true)}
                        />
                        <Button variant="primary" leftIcon={<i className="fa fa-upload" />} label="Upload CSV" onClick={chooseFile} />
                    </div>
                </div>
            )}

            <JqlLoaderDialog
                isOpen={showJqlLoader}
                fieldDefinitions={fieldDefinitions}
                onClose={() => setShowJqlLoader(false)}
                onLoad={handleLoadFromJql}
            />
        </div>
    );
}

export default BulkImportIssue;
