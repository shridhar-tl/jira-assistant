import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Multiselect, TextInput, type ComponentEvent } from '@components';

import {
    defaultIssueFieldIds,
    loadJiraFields,
    toSelectedField,
    type JiraFieldMeta,
    type SelectedIssueField,
} from '../../config/jira-fields';

import { getFieldAliasError } from './dialog-utils';

interface IssueFieldsPickerProps {
    value: SelectedIssueField[];
    onChange: (fields: SelectedIssueField[]) => void;
    excludeIds?: string[];
    autoSelectDefaults?: boolean;
}

export default function IssueFieldsPicker({ value, onChange, excludeIds, autoSelectDefaults }: IssueFieldsPickerProps) {
    const [allFields, setAllFields] = useState<JiraFieldMeta[] | null>(null);

    useEffect(() => {
        let active = true;
        loadJiraFields().then((fields) => {
            if (active) setAllFields(fields);
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!allFields || !autoSelectDefaults || value.length > 0) return;
        const defaults = allFields.filter((f) => defaultIssueFieldIds.includes(f.id) && !excludeIds?.includes(f.id));
        if (defaults.length > 0) onChange(defaults.map(toSelectedField));
    }, [allFields]); // eslint-disable-line react-hooks/exhaustive-deps

    const options = useMemo(
        () =>
            (allFields ?? [])
                .filter((f) => !excludeIds?.includes(f.id))
                .map((f) => ({ value: f.id, label: f.custom ? `${f.name} (${f.id})` : f.name })),
        [allFields, excludeIds],
    );

    const selectedIds = useMemo(() => value.map((f) => f.id), [value]);

    const handleSelection = useCallback(
        (e: ComponentEvent<string[]>) => {
            const ids = e.value ?? [];
            const existing = new Map(value.map((f) => [f.id, f]));
            const byId = new Map((allFields ?? []).map((f) => [f.id, f]));
            onChange(
                ids.flatMap((id) => {
                    const current = existing.get(id);
                    if (current) return [current];
                    const meta = byId.get(id);
                    return meta ? [toSelectedField(meta)] : [];
                }),
            );
        },
        [value, allFields, onChange],
    );

    const setAlias = (id: string, alias: string) => onChange(value.map((f) => (f.id === id ? { ...f, alias } : f)));
    const aliasError = getFieldAliasError(value);

    return (
        <div className="flex flex-col gap-3">
            <Multiselect
                options={options}
                value={selectedIds}
                onChange={handleSelection}
                placeholder={allFields ? 'Choose the Jira fields to include' : 'Loading fields…'}
                loading={!allFields}
                searchable
                maxVisibleChips={6}
                ariaLabel="Jira fields"
            />
            {value.length > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border border-(--border-primary) bg-(--bg-secondary) p-3">
                    <span className="text-xs text-(--text-secondary)">
                        Each field is available in the report as Field.&lt;name&gt;. Rename fields to make expressions easier to read.
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {value.map((f) => (
                            <div key={f.id} className="flex min-w-0 items-center gap-2">
                                <span className="w-32 shrink-0 truncate text-sm text-(--text-primary)" title={f.name}>
                                    {f.name}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <TextInput
                                        value={f.alias}
                                        onChange={(e) => setAlias(f.id, e.value)}
                                        size="sm"
                                        aria-label={`Name of ${f.name} in the report`}
                                    />
                                </div>
                                <Button
                                    layout="plain"
                                    size="sm"
                                    leftIcon={<i className="fa fa-times" />}
                                    onClick={() => onChange(value.filter((x) => x.id !== f.id))}
                                    title={`Remove ${f.name}`}
                                />
                            </div>
                        ))}
                    </div>
                    {aliasError && <span className="text-xs text-(--color-error)">{aliasError}</span>}
                </div>
            )}
        </div>
    );
}
