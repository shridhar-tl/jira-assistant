import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Autocomplete, TextInput, type ComponentEvent } from '@components';

import { isMultiValueKind, pseudoFields } from '../field-kinds';
import { getAllowedValueText } from '../jira-values';
import type { FieldKind, ImportCell, ImportColumn, ImportRow } from '../types';
import { getMetaKey } from '../validator';

interface CellEditorProps {
    column: ImportColumn;
    row: ImportRow;
    disabled?: boolean;
    onCommit: (cell: ImportCell | undefined) => void;
    onCancel: () => void;
}

interface Suggestion {
    value: string;
    label: string;
}

const placeholders: Partial<Record<FieldKind, string>> = {
    issuekey: 'PROJ-123 or PROJ-1; PROJ-2',
    project: 'Project key',
    parent: 'PROJ-123 or PROJ-1; PROJ-2',
    issuetype: 'Issue type name',
    status: 'Target status',
    date: 'yyyy-mm-dd',
    datetime: 'yyyy-mm-dd hh:mm',
    user: 'Email, username or name',
    users: 'Email; Email',
    labels: 'label1; label2',
    strings: 'value1; value2',
    options: 'Value1; Value2',
    cascading: 'Parent > Child',
    sprint: 'Sprint name or id',
    originalEstimate: '3d 4h 30m',
    remainingEstimate: '3d 4h 30m',
    number: 'Number',
    url: 'https://',
};

const keyFields: string[] = [pseudoFields.issuekey, pseudoFields.parent, pseudoFields.project];
const blurCommitDelay = 250;
const maxSuggestions = 50;
const clearText = 'null';
const defaultPlaceholder = 'Enter value or null to clear';

function getSuggestions(column: ImportColumn, row: ImportRow): string[] {
    if (column.field === pseudoFields.issuetype) {
        return (row.context.issueTypes || []).map((t) => t.name);
    }

    const metaKey = getMetaKey(column.field);
    const meta = row.context.fieldsMeta?.[metaKey] || row.context.transition?.fields[metaKey];
    const allowedValues = meta?.allowedValues || [];

    if (column.kind === 'cascading' || meta?.schema.type === 'option-with-child') {
        return allowedValues.flatMap((v) => {
            const parent = getAllowedValueText(v);
            return [parent, ...(v.children || []).map((c) => `${parent} > ${getAllowedValueText(c)}`)];
        });
    }

    return allowedValues.filter((v) => !v.disabled && !v.archived).map(getAllowedValueText);
}

function stopPropagation(e: React.SyntheticEvent) {
    e.stopPropagation();
}

function toCell(text: string, field: string): ImportCell | undefined {
    const value = text.trim();
    if (!value) {
        return undefined;
    }
    if (value.toLowerCase() === clearText) {
        return { clear: true };
    }
    return { input: keyFields.includes(field) ? value.toUpperCase() : value };
}

function CellEditor({ column, row, disabled, onCommit, onCancel }: CellEditorProps) {
    const cell = row.cells[column.field];
    const [text, setText] = useState(cell?.clear ? clearText : cell?.input || '');
    const committedRef = useRef(false);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const isMulti = !!column.kind && isMultiValueKind(column.kind);

    const allSuggestions = useMemo(() => getSuggestions(column, row), [column, row]);

    const items = useMemo<Suggestion[]>(() => {
        const segment = (isMulti ? text.split(';').pop() || '' : text).trim().toLowerCase();
        return allSuggestions
            .filter((s) => !segment || s.toLowerCase().includes(segment))
            .slice(0, maxSuggestions)
            .map((s) => ({ value: s, label: s }));
    }, [allSuggestions, text, isMulti]);

    useEffect(() => () => clearTimeout(blurTimerRef.current), []);

    useEffect(() => {
        if (disabled) {
            onCancel();
        }
    }, [disabled, onCancel]);

    const commit = useCallback(
        (value: string) => {
            if (committedRef.current) {
                return;
            }
            committedRef.current = true;
            onCommit(toCell(value, column.field));
        },
        [onCommit, column.field],
    );

    const cancel = useCallback(() => {
        committedRef.current = true;
        onCancel();
    }, [onCancel]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                commit(e.currentTarget.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            }
        },
        [commit, cancel],
    );

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const { value } = e.currentTarget;
            // Delay is required to let the selection of a suggestion to complete before committing the typed value
            blurTimerRef.current = setTimeout(() => commit(value), blurCommitDelay);
        },
        [commit],
    );

    const handleSelect = useCallback(
        (e: ComponentEvent<string>) => {
            clearTimeout(blurTimerRef.current);
            if (!isMulti) {
                commit(e.value);
                return;
            }
            const parts = text.split(';').map((p) => p.trim());
            parts[parts.length - 1] = e.value;
            commit(parts.filter(Boolean).join('; '));
        },
        [isMulti, text, commit],
    );

    const placeholder = (column.kind && placeholders[column.kind]) || defaultPlaceholder;

    return (
        <div className="w-full min-w-48" onMouseDown={stopPropagation} onDoubleClick={stopPropagation}>
            {allSuggestions.length ? (
                <Autocomplete
                    items={items}
                    value={text}
                    minLength={0}
                    debounceMs={0}
                    autoFocus
                    size="sm"
                    placeholder={placeholder}
                    onChange={(e: ComponentEvent<string>) => setText(e.value)}
                    onSelect={handleSelect}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                />
            ) : (
                <TextInput
                    value={text}
                    autoFocus
                    size="sm"
                    placeholder={placeholder}
                    onChange={(e: ComponentEvent<string>) => setText(e.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                />
            )}
        </div>
    );
}

export default CellEditor;
