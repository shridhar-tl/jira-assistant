import type { JiraFieldDefinition } from '@types';

import type { ParsedFile } from './csv';
import { getKindFromSchema, getUnsupportedReason, pseudoFields, rowStatusField, selectorField, type ResolvedHeader } from './field-kinds';
import type { ImportCell, ImportColumn, ImportRow, RawRecord } from './types';

const defaultFieldOrder = [
    pseudoFields.issuekey,
    pseudoFields.clone,
    pseudoFields.delete,
    pseudoFields.project,
    pseudoFields.issuetype,
    pseudoFields.parent,
    'summary',
];

const defaultHeaders: Record<string, string> = {
    [pseudoFields.issuekey]: 'Issue Key',
    [pseudoFields.clone]: 'Clone',
    [pseudoFields.delete]: 'Delete',
    [pseudoFields.project]: 'Project',
    [pseudoFields.issuetype]: 'Issue Type',
    [pseudoFields.parent]: 'Parent',
    [pseudoFields.status]: 'Status',
    [pseudoFields.comment]: 'Comment',
    [pseudoFields.originalEstimate]: 'Original Estimate',
    [pseudoFields.remainingEstimate]: 'Remaining Estimate',
    summary: 'Summary',
};

const columnWidths: Record<string, number> = {
    [selectorField]: 36,
    [rowStatusField]: 170,
    [pseudoFields.issuekey]: 120,
    [pseudoFields.clone]: 64,
    [pseudoFields.delete]: 64,
    [pseudoFields.project]: 110,
    [pseudoFields.issuetype]: 130,
    [pseudoFields.parent]: 130,
    summary: 320,
    description: 280,
};

const keyFields: string[] = [pseudoFields.issuekey, pseudoFields.parent, pseudoFields.project];
const trueValues = ['yes', 'y', 'true', '1', 'x'];
const keyListSeparator = /[\s,;]+/;
const clearValueText = 'null';

let rowIdSequence = 0;

export function createDataColumn(resolved: ResolvedHeader, header: string, invalid?: string): ImportColumn {
    const { field, kind, definition, warning } = resolved;
    const isAction = field === pseudoFields.clone || field === pseudoFields.delete;
    const reason = invalid || resolved.invalid;

    return {
        field,
        header,
        displayText: header,
        role: field === pseudoFields.clone ? 'clone' : field === pseudoFields.delete ? 'delete' : 'field',
        kind,
        definition,
        invalid: reason,
        warning,
        width: columnWidths[field] || 160,
        headerEditable: false,
        cellEditable: !reason && !isAction,
    };
}

export function createFieldColumn(definition: JiraFieldDefinition): ImportColumn {
    return createDataColumn(
        { field: definition.id, definition, kind: getKindFromSchema(definition.schema, definition.id) },
        definition.name,
    );
}

const estimateFieldAliases: Record<string, string> = {
    timeoriginalestimate: pseudoFields.originalEstimate,
    timeestimate: pseudoFields.remainingEstimate,
};

export interface FieldOption {
    value: string;
    label: string;
}

export function getAddableFields(definitions: JiraFieldDefinition[], existingFields: string[]): FieldOption[] {
    const existing = new Set([...existingFields, ...defaultFieldOrder]);
    const options: FieldOption[] = [
        { value: pseudoFields.status, label: 'Status' },
        { value: pseudoFields.comment, label: 'Comment (adds a new comment)' },
        { value: pseudoFields.originalEstimate, label: 'Original Estimate' },
        { value: pseudoFields.remainingEstimate, label: 'Remaining Estimate' },
    ];
    const pseudoValues = new Set(options.map((o) => o.value));

    definitions.forEach((definition) => {
        const { id, name } = definition;
        if (pseudoValues.has(id) || estimateFieldAliases[id] || getUnsupportedReason(id) || !definition.schema) {
            return;
        }
        options.push({ value: id, label: definition.custom ? `${name} (${id})` : name });
    });

    return options.filter((o) => !existing.has(o.value)).sort((a, b) => a.label.localeCompare(b.label));
}

export function createColumnForField(fieldId: string, definitions: JiraFieldDefinition[]): ImportColumn | undefined {
    const field = estimateFieldAliases[fieldId] || fieldId;
    if (defaultHeaders[field] && !definitions.some((d) => d.id === field)) {
        return createDataColumn({ field, kind: getKindFromSchema(undefined, field) }, defaultHeaders[field]);
    }
    const definition = definitions.find((d) => d.id === field);
    return definition ? createFieldColumn(definition) : undefined;
}

function createSystemColumns(): ImportColumn[] {
    return [
        {
            field: selectorField,
            header: '',
            role: 'selector',
            width: columnWidths[selectorField],
            editable: false,
            headerEditable: false,
        },
        {
            field: rowStatusField,
            header: 'Import Status',
            displayText: 'Import Status',
            role: 'rowStatus',
            width: columnWidths[rowStatusField],
            editable: false,
            headerEditable: false,
        },
    ];
}

export function buildColumns(
    file: ParsedFile,
    resolveHeader: (header: string) => ResolvedHeader,
): { columns: ImportColumn[]; fieldByIndex: (string | null)[] } {
    const added = new Set<string>();
    const fileColumns: ImportColumn[] = [];

    const fieldByIndex = file.headers.map((header) => {
        const resolved = resolveHeader(header);
        if (added.has(resolved.field)) {
            fileColumns.push(
                createDataColumn(resolved, header, `Duplicate column. Values of the first "${resolved.field}" column are used.`),
            );
            return null;
        }

        fileColumns.push(createDataColumn(resolved, header));
        if (resolved.invalid) {
            return null;
        }

        added.add(resolved.field);
        return resolved.field;
    });

    const leadingColumns = defaultFieldOrder.map(
        (field) =>
            fileColumns.find((c) => c.field === field && !c.invalid) ||
            createDataColumn({ field, kind: getKindFromSchema(undefined, field) }, defaultHeaders[field]),
    );

    const otherColumns = fileColumns.filter((c) => !leadingColumns.includes(c));

    return { columns: [...createSystemColumns(), ...leadingColumns, ...otherColumns], fieldByIndex };
}

export function getDefaultColumns(): ImportColumn[] {
    return [
        ...createSystemColumns(),
        ...defaultFieldOrder.map((field) => createDataColumn({ field, kind: getKindFromSchema(undefined, field) }, defaultHeaders[field])),
    ];
}

export function splitKeyList(value: string | undefined): string[] {
    if (!value) {
        return [];
    }
    return [...new Set(value.toUpperCase().split(keyListSeparator).filter(Boolean))];
}

function parseBoolean(value: string | undefined): boolean {
    return !!value && trueValues.includes(value.trim().toLowerCase());
}

export function expandRecord(record: RawRecord): RawRecord[] {
    const keys = splitKeyList(record[pseudoFields.issuekey]);
    if (keys.length > 1) {
        return keys.flatMap((issuekey) => expandRecord({ ...record, [pseudoFields.issuekey]: issuekey }));
    }

    const parents = splitKeyList(record[pseudoFields.parent]);
    const projects = splitKeyList(record[pseudoFields.project]);
    const isClone = keys.length === 1 && parseBoolean(record[pseudoFields.clone]);

    if ((keys.length === 0 || isClone) && parents.length > 1 && projects.length <= 1) {
        return parents.map((parent) => ({ ...record, [pseudoFields.parent]: parent }));
    }

    if (keys.length === 0 && projects.length > 1 && parents.length <= 1) {
        return projects.map((project) => ({ ...record, [pseudoFields.project]: project }));
    }

    return [record];
}

function createCell(field: string, rawValue: string): ImportCell | undefined {
    const value = rawValue.trim();
    if (!value) {
        return undefined;
    }
    if (value.toLowerCase() === clearValueText) {
        return { clear: true };
    }
    return { input: keyFields.includes(field) ? value.toUpperCase() : value };
}

export function createRow(record: RawRecord, line?: number): ImportRow {
    const cells: Record<string, ImportCell> = {};
    Object.keys(record).forEach((field) => {
        if (field === pseudoFields.clone || field === pseudoFields.delete) {
            return;
        }
        const cell = createCell(field, record[field] || '');
        if (cell) {
            cells[field] = cell;
        }
    });

    const hasKey = !!cells[pseudoFields.issuekey]?.input;
    const isDelete = hasKey && parseBoolean(record[pseudoFields.delete]);

    return {
        rowId: ++rowIdSequence,
        revision: 0,
        line,
        selected: true,
        blocked: false,
        delete: isDelete,
        clone: hasKey && !isDelete && parseBoolean(record[pseudoFields.clone]),
        cells,
        existingDisplay: {},
        status: { action: 'none', state: 'ready', warnings: [] },
        context: {},
    };
}

export function buildRows(file: ParsedFile, fieldByIndex: (string | null)[]): ImportRow[] {
    return file.records.flatMap(({ line, values }) => {
        const record = fieldByIndex.reduce<RawRecord>((rec, field, index) => {
            if (field) {
                rec[field] = values[index] || '';
            }
            return rec;
        }, {});

        return expandRecord(record).map((r) => createRow(r, line));
    });
}

export function createRowsForIssues(keys: string[]): ImportRow[] {
    return keys.map((key) => createRow({ [pseudoFields.issuekey]: key }));
}
