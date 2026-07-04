// Utility functions for bulk import issue

import { exportCsv } from '@utils';

import { IssueColumn, IssueRow, ValueObj, ImportStats } from './types';

/**
 * Get CSS class for row status
 */
export function getRowStatusClass(row: IssueRow): string {
    const { importStatus, disabled } = row;

    if (importStatus?.imported) {
        return 'status-imported';
    }
    if (importStatus?.hasError || disabled) {
        return 'status-error';
    }
    if (importStatus?.hasWarning) {
        return 'status-warning';
    }

    return '';
}

/**
 * Get display value for a field
 */
export function getDisplayValue(valueObj: ValueObj | undefined): string {
    if (!valueObj) return '';

    if (valueObj.clearValue) return 'null';

    return valueObj.displayText || valueObj.value || '';
}

/**
 * Get error message for a field
 */
export function getErrorMessage(valueObj: ValueObj | undefined): string {
    if (!valueObj) return '';
    return valueObj.error || '';
}

/**
 * Get warning message for a field
 */
export function getWarningMessage(valueObj: ValueObj | undefined): string {
    if (!valueObj) return '';
    return valueObj.warning || '';
}

/**
 * Format field mapping for CSV headers
 */
export function normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[ \-_]/g, '');
}

/**
 * Map CSV header to field name
 */
const headerMapping: Record<string, string> = {
    key: 'issuekey',
    issuekey: 'issuekey',
    issue: 'issuekey',
    ticket: 'issuekey',
    ticketno: 'issuekey',

    project: 'project',
    projectkey: 'project',

    issuetype: 'issuetype',
    type: 'issuetype',

    parent: 'parent',
    parentkey: 'parent',
    epic: 'parent',

    summary: 'summary',
    title: 'summary',

    description: 'description',
    desc: 'description',

    assignee: 'assignee',
    assigned: 'assignee',
    assignedto: 'assignee',

    reporter: 'reporter',

    priority: 'priority',

    status: 'status',

    labels: 'labels',
    label: 'labels',

    components: 'components',
    component: 'components',

    fixversions: 'fixVersions',
    fixversion: 'fixVersions',

    affectedversions: 'versions',
    affectedversion: 'versions',
    versions: 'versions',
    version: 'versions',

    duedate: 'duedate',
    due: 'duedate',

    delete: 'delete',
    remove: 'delete',

    clone: 'clone',
    copy: 'clone',
};

export function mapHeader(header: string): string {
    const normalized = normalizeHeader(header);
    return headerMapping[normalized] || header;
}

/**
 * Count selected rows
 */
export function countSelected(rows: IssueRow[]): number {
    return rows.filter((r) => r.selected && !r.disabled).length;
}

/**
 * Count issues by status
 */
export function countByStatus(rows: IssueRow[]): {
    total: number;
    willCreate: number;
    willUpdate: number;
    willClone: number;
    willDelete: number;
    errors: number;
    warnings: number;
    imported: number;
} {
    const stats = {
        total: rows.length,
        willCreate: 0,
        willUpdate: 0,
        willClone: 0,
        willDelete: 0,
        errors: 0,
        warnings: 0,
        imported: 0,
    };

    rows.forEach((row) => {
        const { importStatus, clone, delete: del } = row;

        if (importStatus?.imported) {
            stats.imported++;
        } else if (importStatus?.hasError) {
            stats.errors++;
        } else if (importStatus?.hasWarning) {
            stats.warnings++;
        }

        if (importStatus?.actions) {
            if (importStatus.actions.create) stats.willCreate++;
            if (importStatus.actions.clone) stats.willClone++;
            if (importStatus.actions.delete) stats.willDelete++;
        }

        if (row.issuekey?.value && !clone && !del && !importStatus?.actions?.create) {
            stats.willUpdate++;
        }
    });

    return stats;
}

/**
 * Export data to CSV
 */
export function exportToCSV(columns: IssueColumn[], rows: IssueRow[]): string {
    const headers = columns
        .filter((col) => !['importStatus', 'selected', 'disabled', 'raw'].includes(col.field))
        .map((col) => col.displayText || col.field);

    const csvRows = rows.map((row) => {
        return columns
            .filter((col) => !['importStatus', 'selected', 'disabled', 'raw'].includes(col.field))
            .map((col) => {
                const value = getDisplayValue(row[col.field] as ValueObj);
                // Escape quotes and wrap in quotes if contains comma or quote
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            })
            .join(',');
    });

    return [headers.join(','), ...csvRows].join('\n');
}

/**
 * Download sample CSV template with common Jira fields
 */
export function downloadSampleTemplate(): void {
    const today = new Date().toISOString().split('T')[0];

    const lines = [
        'Issue Key,Project,Issue Type,Summary,Description,Assignee,Reporter,Priority,Labels,Components,Due Date,Parent,Clone,Delete',
        `,,PROJ,Task,Implement user authentication,Add login and registration functionality,john.doe@example.com,admin@example.com,High,Backend;Security,Component A,${today},,,no,no`,
        `,,PROJ,Bug,Fix login error,Users unable to login after password reset,jane.smith@example.com,john.doe@example.com,Critical,Bug;Urgent,Component B,${today},,,no,no`,
        ',,PROJ,Story,Dashboard redesign,Modernize the dashboard UI/UX,designer@example.com,admin@example.com,Medium,Frontend;UX,Component C,,,no,no',
        ',,PROJ,Sub-task,Create login API,Develop backend API for authentication,john.doe@example.com,admin@example.com,High,Backend,,PROJ-100,,no,no',
        'PROJ-123,,,,Update existing task summary,This will update only the summary and description fields,,,,,,,no,no',
        'PROJ-124,,,Clone of task 124,,,,,,,,yes,no',
        'PROJ-999,,,,,,,,,,,,,yes',
    ];

    exportCsv(lines.join('\n'), 'bulk_import_issues_template');
}

/**
 * Calculate import statistics
 */
export function calculateImportStats(issues: IssueRow[]): ImportStats {
    return {
        total: issues.length,
        selected: issues.filter((i) => i.selected && !i.disabled).length,
        withErrors: issues.filter((i) => i.importStatus?.hasError).length,
        withWarnings: issues.filter((i) => i.importStatus?.hasWarning).length,
        toCreate: issues.filter((i) => i.selected && !i.disabled && !i.issuekey?.value).length,
        toUpdate: issues.filter((i) => i.selected && !i.disabled && i.issuekey?.value && !i.delete && !i.clone).length,
        toClone: issues.filter((i) => i.selected && !i.disabled && i.clone).length,
        toDelete: issues.filter((i) => i.selected && !i.disabled && i.delete).length,
    };
}

/**
 * Get validation summary message
 */
export function getValidationSummary(stats: ImportStats): string {
    const parts: string[] = [];

    if (stats.toCreate > 0) parts.push(`${stats.toCreate} to create`);
    if (stats.toUpdate > 0) parts.push(`${stats.toUpdate} to update`);
    if (stats.toClone > 0) parts.push(`${stats.toClone} to clone`);
    if (stats.toDelete > 0) parts.push(`${stats.toDelete} to delete`);
    if (stats.withErrors > 0) parts.push(`${stats.withErrors} with errors`);
    if (stats.withWarnings > 0) parts.push(`${stats.withWarnings} with warnings`);

    return parts.join(', ');
}

/**
 * Export current data to CSV
 */
export function exportIssuesToCsv(issues: IssueRow[], columns: IssueColumn[]): void {
    const headers = columns
        .filter((c) => c.field !== 'importStatus' && c.field !== 'selected' && c.field !== 'disabled')
        .map((c) => c.displayText || c.field);

    const rows = issues.map((issue) => {
        return columns
            .filter((c) => c.field !== 'importStatus' && c.field !== 'selected' && c.field !== 'disabled')
            .map((col) => {
                const field = col.field;
                const value = issue[field];

                if (field === 'clone' || field === 'delete') {
                    return value ? 'yes' : 'no';
                }

                if (typeof value === 'object' && value !== null) {
                    return value.value || value.displayText || '';
                }

                return value || '';
            });
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const timestamp = new Date().toISOString().split('T')[0];
    exportCsv(csvContent, `bulk-import-issues-${timestamp}`);
}
