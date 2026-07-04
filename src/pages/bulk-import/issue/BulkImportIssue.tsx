import { useState, useRef, useCallback, useMemo } from 'react';

import { inject } from '@services';

import { Button, EditableGrid, LoadingSpinner } from '@components';

import { parseCSVFile } from './file-parser';
import { validateAndProcessData, importIssues } from './import-service';
import ImportInstructions from './ImportInstructions';
import type { IssueRow, ImportData } from './types';
import { downloadSampleTemplate, calculateImportStats, getValidationSummary, exportIssuesToCsv } from './utils';
import './BulkImportIssue.css';

function BulkImportIssue() {
    const [importData, setImportData] = useState<ImportData | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [showInstructions, setShowInstructions] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { $ticket, $message } = inject('TicketService', 'MessageService');

    // Calculate statistics
    const stats = useMemo(() => {
        if (!importData) return null;
        return calculateImportStats(importData.importData);
    }, [importData]);

    /**
     * Handle file upload
     */
    const handleFileUpload = useCallback(
        async (file: File) => {
            if (!file) return;

            setIsValidating(true);
            setShowInstructions(false);
            try {
                const result = await parseCSVFile(file);

                if (!result.success || !result.data) {
                    $message.error(result.error || 'Failed to parse CSV file');
                    return;
                }

                const parsedData = result.data;

                if (!parsedData || parsedData.length === 0) {
                    $message.error('No data found in CSV file');
                    return;
                }

                $message.info('Validating issues against Jira...');
                const validatedData = await validateAndProcessData(parsedData, $ticket);
                setImportData(validatedData);

                const stats = calculateImportStats(validatedData.importData);
                $message.success(`Loaded ${stats.total} issues. ${getValidationSummary(stats)}`);
            } catch (error: any) {
                $message.error(`Error processing CSV: ${error.message || 'Unknown error'}`);
                console.error('CSV processing error:', error);
            } finally {
                setIsValidating(false);
            }
        },
        [$ticket, $message],
    );

    /**
     * Handle import
     */
    const handleImport = useCallback(async () => {
        if (!importData) return;

        const selectedIssues = importData.importData.filter((issue) => issue.selected && !issue.disabled);
        if (selectedIssues.length === 0) {
            $message.warning('No issues selected for import');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to import ${selectedIssues.length} issue(s)?\n\n` + 'This action cannot be undone.',
        );

        if (!confirmed) return;

        setIsImporting(true);
        setProgress({ current: 0, total: selectedIssues.length });

        try {
            await importIssues(importData.importData, importData.columns, importData.addedFields, $ticket, $message, {
                onProgress: (current, total) => {
                    setProgress({ current, total });
                },
                onComplete: (result) => {
                    if (result.success) {
                        $message.success(result.message || 'Import completed successfully');
                    } else {
                        $message.warning(result.message || 'Import completed with errors');
                    }
                },
            });

            // Refresh the data to show updated status
            setImportData({ ...importData });
        } catch (error: any) {
            $message.error(`Import failed: ${error.message}`);
        } finally {
            setIsImporting(false);
            setProgress({ current: 0, total: 0 });
        }
    }, [importData, $ticket, $message]);

    /**
     * Handle clear all data
     */
    const handleClear = useCallback(() => {
        const confirmed = window.confirm('Are you sure you want to clear all data?');
        if (confirmed) {
            setImportData(null);
            setShowInstructions(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, []);

    /**
     * Handle export to CSV
     */
    const handleExport = useCallback(() => {
        if (!importData) return;
        exportIssuesToCsv(importData.importData, importData.columns);
        $message.success('Data exported to CSV');
    }, [importData, $message]);

    /**
     * Handle select all/deselect all
     */
    const handleSelectAll = useCallback(
        (selected: boolean) => {
            if (!importData) return;
            const updatedData = {
                ...importData,
                importData: importData.importData.map((issue) => ({
                    ...issue,
                    selected: issue.disabled ? false : selected,
                })),
            };
            setImportData(updatedData);
        },
        [importData],
    );

    /**
     * Handle data change from grid
     */
    const handleDataChange = useCallback(
        (newData: IssueRow[]) => {
            if (!importData) return;
            setImportData({
                ...importData,
                importData: newData,
            });
        },
        [importData],
    );

    return (
        <div className="bulk-import-issue-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="page-title">
                            <i className="fa fa-cloud-upload mr-2" />
                            Bulk Import Issues
                        </h1>
                        <p className="page-subtitle">Create, update, clone, or delete multiple Jira issues using CSV files</p>
                    </div>
                    <div className="header-actions">
                        <Button
                            variant="secondary"
                            leftIcon={<i className="fa fa-question-circle" />}
                            label={showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                            onClick={() => setShowInstructions(!showInstructions)}
                        />
                        <Button
                            variant="info"
                            leftIcon={<i className="fa fa-download" />}
                            label="Download Template"
                            onClick={downloadSampleTemplate}
                        />
                        <Button
                            variant="primary"
                            leftIcon={<i className="fa fa-upload" />}
                            label="Upload CSV"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isValidating || isImporting}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                                e.target.value = '';
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Instructions */}
            {showInstructions && <ImportInstructions />}

            {/* Loading State */}
            {isValidating && (
                <div className="validation-loading">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg">Validating issues against Jira...</p>
                    <p className="text-sm text-secondary">This may take a moment for large files</p>
                </div>
            )}

            {/* Import Data Grid */}
            {importData && !isValidating && (
                <div className="import-content">
                    {/* Stats Bar */}
                    {stats && (
                        <div className="stats-bar">
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Total Issues</span>
                                    <span className="stat-value">{stats.total}</span>
                                </div>
                                <div className="stat-item stat-selected">
                                    <span className="stat-label">Selected</span>
                                    <span className="stat-value">{stats.selected}</span>
                                </div>
                                {stats.toCreate > 0 && (
                                    <div className="stat-item stat-create">
                                        <span className="stat-label">To Create</span>
                                        <span className="stat-value">{stats.toCreate}</span>
                                    </div>
                                )}
                                {stats.toUpdate > 0 && (
                                    <div className="stat-item stat-update">
                                        <span className="stat-label">To Update</span>
                                        <span className="stat-value">{stats.toUpdate}</span>
                                    </div>
                                )}
                                {stats.toClone > 0 && (
                                    <div className="stat-item stat-clone">
                                        <span className="stat-label">To Clone</span>
                                        <span className="stat-value">{stats.toClone}</span>
                                    </div>
                                )}
                                {stats.toDelete > 0 && (
                                    <div className="stat-item stat-delete">
                                        <span className="stat-label">To Delete</span>
                                        <span className="stat-value">{stats.toDelete}</span>
                                    </div>
                                )}
                                {stats.withErrors > 0 && (
                                    <div className="stat-item stat-error">
                                        <span className="stat-label">Errors</span>
                                        <span className="stat-value">{stats.withErrors}</span>
                                    </div>
                                )}
                                {stats.withWarnings > 0 && (
                                    <div className="stat-item stat-warning">
                                        <span className="stat-label">Warnings</span>
                                        <span className="stat-value">{stats.withWarnings}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="action-bar">
                        <div className="action-bar-left">
                            <Button
                                variant="default"
                                size="sm"
                                leftIcon={<i className="fa fa-check-square" />}
                                label="Select All"
                                onClick={() => handleSelectAll(true)}
                                disabled={isImporting}
                            />
                            <Button
                                variant="default"
                                size="sm"
                                leftIcon={<i className="fa fa-square-o" />}
                                label="Deselect All"
                                onClick={() => handleSelectAll(false)}
                                disabled={isImporting}
                            />
                            <Button
                                variant="default"
                                size="sm"
                                leftIcon={<i className="fa fa-download" />}
                                label="Export"
                                onClick={handleExport}
                                disabled={isImporting}
                            />
                        </div>
                        <div className="action-bar-right">
                            <Button
                                variant="danger"
                                leftIcon={<i className="fa fa-trash" />}
                                label="Clear All"
                                onClick={handleClear}
                                disabled={isImporting}
                            />
                            <Button
                                variant="primary"
                                leftIcon={<i className={isImporting ? 'fa fa-spinner fa-spin' : 'fa fa-cloud-upload'} />}
                                label={
                                    isImporting
                                        ? `Importing... (${progress.current}/${progress.total})`
                                        : `Import ${stats?.selected || 0} Selected`
                                }
                                onClick={handleImport}
                                disabled={isImporting || !stats || stats.selected === 0}
                            />
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="grid-container">
                        <EditableGrid columns={importData.columns} rows={importData.importData} onChange={handleDataChange} />
                    </div>

                    {/* Progress Indicator */}
                    {isImporting && progress.total > 0 && (
                        <div className="progress-overlay">
                            <div className="progress-card">
                                <h3 className="progress-title">Importing Issues</h3>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                                </div>
                                <p className="progress-text">
                                    {progress.current} of {progress.total} issues processed
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!importData && !isValidating && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <i className="fa fa-cloud-upload" />
                    </div>
                    <h2 className="empty-state-title">No Data Loaded</h2>
                    <p className="empty-state-description">Upload a CSV file to import issues, or download our template to get started</p>
                    <div className="empty-state-actions">
                        <Button
                            variant="secondary"
                            size="lg"
                            leftIcon={<i className="fa fa-download" />}
                            label="Download Template"
                            onClick={downloadSampleTemplate}
                        />
                        <Button
                            variant="primary"
                            size="lg"
                            leftIcon={<i className="fa fa-upload" />}
                            label="Upload CSV File"
                            onClick={() => fileInputRef.current?.click()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default BulkImportIssue;
