import { useEffect, useRef, useState } from 'react';

import { TextInput, type ComponentEvent } from '@components';

interface StringEditorProps {
    value?: string;
    placeholder?: string;
    onChange: (result: { value: string }, modified: boolean) => void;
}

function StringEditor({ value, placeholder = 'Enter value', onChange }: StringEditorProps) {
    const [newValue, setNewValue] = useState(value ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleChange = (val: string, modified: boolean) => {
        onChange({ value: val }, modified);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleChange(e.currentTarget.value, true);
        } else if (e.key === 'Escape') {
            handleChange(value || '', false);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        handleChange(e.currentTarget.value, true);
    };

    const handleValueChange = (e: ComponentEvent<string>) => {
        setNewValue(e.value);
    };

    return (
        <TextInput
            ref={inputRef}
            size="sm"
            className="string-editor"
            placeholder={placeholder}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onChange={handleValueChange}
            value={newValue}
        />
    );
}

export default StringEditor;
