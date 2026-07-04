// File parsing logic for bulk import

import Papa from 'papaparse';

import { mapHeader } from './utils';

export interface ParseResult {
    success: boolean;
    data?: any[];
    error?: string;
}

/**
 * Parse CSV file
 */
export function parseCSV(file: File): Promise<ParseResult> {
    return parseCSVFile(file);
}

export function parseCSVFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => mapHeader(header),
            complete: (results) => {
                if (results.errors.length > 0) {
                    resolve({
                        success: false,
                        error: `CSV parsing error: ${results.errors[0].message}`,
                    });
                } else if (!results.data || results.data.length === 0) {
                    resolve({
                        success: false,
                        error: 'No data found in the CSV file',
                    });
                } else {
                    resolve({
                        success: true,
                        data: results.data,
                    });
                }
            },
            error: (error) => {
                resolve({
                    success: false,
                    error: `Failed to parse CSV: ${error.message}`,
                });
            },
        });
    });
}

/**
 * Parse Excel/XLSX file (requires additional library)
 * For now, we'll just support CSV
 */
export function parseExcelFile(file: File): Promise<ParseResult> {
    return Promise.resolve({
        success: false,
        error: 'Excel files are not supported yet. Please convert to CSV.',
    });
}

/**
 * Parse file based on extension
 */
export async function parseFile(file: File): Promise<ParseResult> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        return parseCSVFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return parseExcelFile(file);
    } else {
        return {
            success: false,
            error: 'Unsupported file format. Please upload a CSV file.',
        };
    }
}

/**
 * Validate required fields in parsed data
 */
export function validateParsedData(data: any[]): { valid: boolean; message?: string } {
    if (!data || data.length === 0) {
        return { valid: false, message: 'No data to import' };
    }

    // Check if at least one row has project or issuekey
    const hasValidRow = data.some((row) => row.project || row.issuekey);

    if (!hasValidRow) {
        return {
            valid: false,
            message: 'No valid rows found. Each row must have either a project or issuekey field.',
        };
    }

    return { valid: true };
}
