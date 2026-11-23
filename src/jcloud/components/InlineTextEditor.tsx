import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';

import { TextInput, type ComponentEvent } from '@components';

interface InlineTextEditorProps {
    value?: string;
    placeholder?: string;
    className?: string;
    altClassName?: string;
    onChange: (value: string) => void;
}

export default function InlineTextEditor({ value, placeholder, className, altClassName, onChange }: InlineTextEditorProps) {
    const [isEdit, setEditMode] = useState(false);
    const [valueEdited, setValue] = useState(value || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(value || '');
    }, [value]);

    useEffect(() => {
        if (isEdit && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEdit]);

    const endEdit = useCallback(() => {
        setEditMode(false);
        onChange(valueEdited);
    }, [valueEdited, onChange]);

    const onValueChange = useCallback((e: ComponentEvent<string>) => {
        setValue(e.value);
    }, []);

    const keyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                setEditMode(false);
                onChange((e.target as HTMLInputElement).value);
            }
        },
        [onChange],
    );

    const enterEdit = useCallback(() => setEditMode(true), []);

    if (isEdit) {
        return (
            <TextInput
                ref={inputRef}
                size="sm"
                className="w-full"
                value={valueEdited}
                onKeyDown={keyDown}
                onChange={onValueChange}
                onBlur={endEdit}
            />
        );
    }

    if (value) {
        return (
            <span className={className} onClick={enterEdit}>
                {value}
            </span>
        );
    }

    return (
        <span className={altClassName} onClick={enterEdit}>
            {placeholder || '<< no value >>'}
        </span>
    );
}
