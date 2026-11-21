import type { FileParser, ParsedTable } from '@components/report-builder';
import { setField } from '@components/report-builder';

type Row = Record<string, unknown>;

interface ExcelCellValueObject {
    result?: unknown;
    text?: string;
    richText?: Array<{ text: string }>;
    hyperlink?: string;
}

/** exceljs returns the wall-clock value of a cell as UTC, so it is moved to the same wall-clock time in the local timezone. */
function toLocalDate(value: Date): Date {
    return new Date(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
        value.getUTCHours(),
        value.getUTCMinutes(),
        value.getUTCSeconds(),
        value.getUTCMilliseconds(),
    );
}

function toPlainValue(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : toLocalDate(value);
    if (typeof value !== 'object') return value;
    const obj = value as ExcelCellValueObject;
    if (obj.result !== undefined) return toPlainValue(obj.result);
    if (Array.isArray(obj.richText)) return obj.richText.map((r) => r.text).join('');
    if (obj.text !== undefined) return obj.text;
    return null;
}

function uniqueHeaders(headers: string[]): string[] {
    const seen = new Map<string, number>();
    return headers.map((h, i) => {
        const base = h.trim() || `column${i + 1}`;
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        return count === 0 ? base : `${base}_${count + 1}`;
    });
}

function headerText(value: unknown): string {
    if (value === null || value === undefined) return '';
    return value instanceof Date ? value.toLocaleDateString() : String(value);
}

export const excelFileParser: FileParser = {
    id: 'excel',
    label: 'Excel',
    extensions: ['.xlsx'],
    parse: async (file) => {
        const Excel = await import('exceljs');
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const tables: ParsedTable[] = [];
        workbook.eachSheet((sheet) => {
            const matrix: unknown[][] = [];
            sheet.eachRow({ includeEmpty: false }, (row) => {
                const values = Array.isArray(row.values) ? row.values.slice(1) : [];
                matrix.push(Array.from(values, toPlainValue));
            });
            if (matrix.length === 0) return;
            const width = matrix.reduce((max, cells) => Math.max(max, cells.length), 0);
            const headers = uniqueHeaders(Array.from({ length: width }, (_, i) => headerText(matrix[0][i])));
            const rows: Row[] = matrix.slice(1).map((cells) => {
                const out: Row = {};
                headers.forEach((h, i) => setField(out, h, cells[i] ?? null));
                return out;
            });
            tables.push({ name: sheet.name, rows });
        });
        if (tables.length === 0) throw new Error('The workbook has no data.');
        return tables;
    },
};
