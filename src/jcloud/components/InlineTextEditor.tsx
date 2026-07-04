import { useState, useEffect, useCallback, useRef, type KeyboardEvent, type ChangeEvent } from 'react';

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

    const onValueChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.currentTarget.value);
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
            <input
                type="text"
                ref={inputRef}
                value={valueEdited}
                onKeyDown={keyDown}
                onChange={onValueChange}
                onBlur={endEdit}
                className="text-xl w-full border-0 outline-none border-b-2 border-gray-200 bg-transparent"
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
