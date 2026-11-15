import { addDays, format } from 'date-fns';
import Papa from 'papaparse';

import { exportCsv } from '@utils';

import { pseudoFields } from './field-kinds';
import type { ImportColumn, ImportRow } from './types';

export interface ParsedRecord {
    line: number;
    values: string[];
}

export interface ParsedFile {
    headers: string[];
    records: ParsedRecord[];
    warnings: string[];
}

const maxRowsAllowed = 5000;

export function parseCsvFile(file: File): Promise<ParsedFile> {
    return new Promise((resolve, reject) => {
        Papa.parse<string[]>(file, {
            header: false,
            skipEmptyLines: 'greedy',
            complete: (result) => {
                const [headerRow, ...dataRows] = result.data;
                if (!headerRow?.length) {
                    reject(new Error('The file is empty. First line of the file must contain the column headers.'));
                    return;
                }

                const fatalError = result.errors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter');
                if (fatalError) {
                    const line = typeof fatalError.row === 'number' ? ` near line ${fatalError.row + 1}` : '';
                    reject(new Error(`Unable to read the file${line}: ${fatalError.message}`));
                    return;
                }

                if (!dataRows.length) {
                    reject(new Error('No issues found in the file. Add one issue per line below the column headers.'));
                    return;
                }

                if (dataRows.length > maxRowsAllowed) {
                    reject(new Error(`The file has ${dataRows.length} rows. A maximum of ${maxRowsAllowed} rows can be imported at once.`));
                    return;
                }

                const warnings: string[] = [];
                const headers = headerRow.map((h) => h.trim());
                const records = dataRows.map((values, index) => {
                    const line = index + 2;
                    if (values.length > headers.length && values.slice(headers.length).some((v) => v.trim())) {
                        warnings.push(`Line ${line} has more values than column headers. Extra values are ignored.`);
                    }
                    return { line, values: headers.map((_, i) => (values[i] || '').trim()) };
                });

                resolve({ headers, records, warnings });
            },
            error: (error) => reject(new Error(`Unable to read the file: ${error.message}`)),
        });
    });
}

function toCsv(rows: string[][]): string {
    return Papa.unparse(rows, { quotes: false, newline: '\n' });
}

export function downloadTemplate(): void {
    const dueDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');

    const rows = [
        [
            'Issue Key',
            'Clone',
            'Delete',
            'Project',
            'Issue Type',
            'Parent',
            'Summary',
            'Description',
            'Assignee',
            'Priority',
            'Labels',
            'Components',
            'Due Date',
            'Status',
            'Comment',
        ],
        [
            '',
            '',
            '',
            'PROJ',
            'Task',
            '',
            'Create a new task',
            'Multi line text is allowed within quotes',
            'john@example.com',
            'High',
            'backend;api',
            '',
            dueDate,
            '',
            '',
        ],
        ['', '', '', 'PROJ', 'Story', 'PROJ-10', 'Create a story under epic PROJ-10', '', '', 'Medium', '', '', '', '', ''],
        [
            '',
            '',
            '',
            '',
            'Sub-task',
            'PROJ-101; PROJ-102; PROJ-103',
            'Write unit tests',
            'Creates one sub-task under each of the 3 parents',
            '',
            '',
            'testing',
            '',
            '',
            '',
            '',
        ],
        ['', '', '', 'PROJ; OPS', 'Task', '', 'Same task created in 2 projects', '', '', '', '', '', '', '', ''],
        [
            'PROJ-201; PROJ-202; PROJ-203',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            'jane@example.com',
            'Highest',
            '',
            '',
            '',
            'In Progress',
            'Updated in bulk',
        ],
        ['PROJ-204', '', '', '', '', '', 'Only summary is changed and due date is cleared', '', '', '', '', '', 'null', '', ''],
        ['PROJ-301', 'yes', '', '', '', 'PROJ-110; PROJ-111', '', '', '', '', '', '', '', '', ''],
        ['PROJ-999', '', 'yes', '', '', '', '', '', '', '', '', '', '', '', ''],
    ];

    exportCsv(toCsv(rows), 'jira_issue_import_template');
}

function getCellText(row: ImportRow, column: ImportColumn): string {
    if (column.field === pseudoFields.clone) {
        return row.clone ? 'yes' : '';
    }
    if (column.field === pseudoFields.delete) {
        return row.delete ? 'yes' : '';
    }

    const cell = row.cells[column.field];
    if (cell?.clear) {
        return 'null';
    }
    if (column.field === pseudoFields.issuekey && row.status.resultKey && row.status.action !== 'update') {
        return row.status.resultKey;
    }
    return cell?.input || '';
}

export function exportRows(rows: ImportRow[], columns: ImportColumn[]): void {
    const dataColumns = columns.filter((c) => c.role !== 'selector' && c.role !== 'rowStatus' && !c.invalid);
    const csvRows = [dataColumns.map((c) => c.header), ...rows.map((row) => dataColumns.map((c) => getCellText(row, c)))];
    exportCsv(toCsv(csvRows), `jira_issue_import_${format(new Date(), 'yyyyMMdd_HHmm')}`);
}
