// Import service - handles the import logic

import type MessageService from '@services/message-service';
import type TicketService from '@services/ticket-service';

import { IssueRow, IssueColumn } from './types';

export interface ImportResult {
    success: boolean;
    imported: number;
    failed: number;
    message?: string;
}

export interface ImportOptions {
    onProgress?: (current: number, total: number, currentIssue?: string) => void;
    onComplete?: (result: ImportResult) => void;
}

/**
 * Import issues to Jira
 */
export async function importIssues(
    rows: IssueRow[],
    columns: IssueColumn[],
    addedFields: Record<string, boolean>,
    ticketService: TicketService,
    messageService: MessageService,
    options?: ImportOptions,
): Promise<ImportResult> {
    const selectedRows = rows.filter((r) => r.selected && !r.disabled);

    if (selectedRows.length === 0) {
        return {
            success: false,
            imported: 0,
            failed: 0,
            message: 'No issues selected for import',
        };
    }

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < selectedRows.length; i++) {
        const row = selectedRows[i];
        const issueKey = row.issuekey?.value || 'New Issue';

        options?.onProgress?.(i + 1, selectedRows.length, issueKey);

        try {
            const result = await ticketService.importIssue(row, columns, addedFields);

            if (result?.importStatus?.imported) {
                imported++;
            } else if (result?.importStatus?.hasError) {
                failed++;
            }
        } catch (error) {
            console.error('Error importing issue:', issueKey, error);
            failed++;

            if (row.importStatus) {
                row.importStatus.hasError = true;
                row.importStatus.error = error instanceof Error ? error.message : 'Unknown error';
            }
        }
    }

    const result: ImportResult = {
        success: failed === 0,
        imported,
        failed,
        message: `Import completed: ${imported} succeeded, ${failed} failed`,
    };

    options?.onComplete?.(result);

    return result;
}

/**
 * Validate and process data for import
 */
export async function validateAndProcessData(
    data: any[],
    ticketService: TicketService,
): Promise<{ columns: IssueColumn[]; importData: IssueRow[]; addedFields: Record<string, boolean> }> {
    // Process the data using the existing data-processor
    const { processData } = await import('./data-processor');
    const { getDefaultColumns, getColumnMapping } = await import('./field-mapping');

    // Get default columns and column mapping
    const defaultColumns = getDefaultColumns();
    const colMapping = getColumnMapping();

    const invalidHeaderTemplate = (column: IssueColumn) => {
        return `${column.field} ❌`;
    };

    const unsupportedFieldTemplate = (column: IssueColumn) => {
        return `${column.field} ⚠️`;
    };

    const result = processData(data, colMapping, defaultColumns, invalidHeaderTemplate, unsupportedFieldTemplate);

    // Validate issues using ticket service
    return await ticketService.validateIssuesForImport(result);
}
