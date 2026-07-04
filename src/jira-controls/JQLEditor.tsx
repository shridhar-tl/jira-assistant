import { useState, useEffect, useCallback } from 'react';

import { Button, TextArea } from '@components';

interface JQLEditorProps {
    jql?: string;
    field?: string;
    plugged?: boolean;
    onChange: (value: string, field?: string) => void;
}

function JQLEditor({ jql, field, plugged, onChange }: JQLEditorProps) {
    const [value, setValue] = useState(jql || '');
    const [isEdit, setEditMode] = useState(!plugged);

    useEffect(() => {
        setValue(jql || '');
    }, [jql]);

    const handleChange = useCallback((e: { value: string }) => setValue(e.value), []);

    const beginEdit = useCallback(() => setEditMode(true), []);

    const doneEdit = useCallback(() => {
        const trimmed = value?.trim();
        onChange(trimmed, field);
        setValue(trimmed);
        setEditMode(false);
    }, [value, onChange, field]);

    const cancelEdit = useCallback(() => {
        setValue(jql || '');
        setEditMode(false);
    }, [jql]);

    return (
        <div className={`jql-editor${plugged ? ' plugged' : ''} flex flex-col gap-2`}>
            {isEdit && (
                <TextArea
                    className="jql-query w-full font-mono text-sm"
                    placeholder="JQL query to fetch data"
                    value={value}
                    onChange={plugged ? handleChange : (e: { value: string }) => onChange(e.value, field)}
                    rows={4}
                    autoFocus
                />
            )}
            {!isEdit && !!jql && (
                <div
                    className="jql-query-text cursor-pointer p-2 rounded border border-[--border-primary] font-mono text-sm"
                    onClick={beginEdit}
                >
                    {jql}
                </div>
            )}
            {!isEdit && !jql && (
                <span
                    className="jql-query-text unavailable cursor-pointer p-2 rounded border border-dashed border-[--border-primary] text-[--text-secondary] text-sm italic"
                    onClick={beginEdit}
                >
                    Provide JQL query text here
                </span>
            )}
            {plugged && isEdit && (
                <div className="flex gap-2">
                    <Button leftIcon={<i className="fa fa-check" />} onClick={doneEdit} />
                    <Button leftIcon={<i className="fa fa-times" />} onClick={cancelEdit} />
                </div>
            )}
        </div>
    );
}

export default JQLEditor;
