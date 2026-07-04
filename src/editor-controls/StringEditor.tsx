import { useEffect, useRef, useState } from 'react';

interface StringEditorProps {
    value?: string;
    placeholder?: string;
    onChange: (result: { value: string }, modified: boolean) => void;
}

function StringEditor({ value, placeholder = 'Enter value', onChange }: StringEditorProps) {
    const [newValue, setNewValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleChange = (val: string, modified: boolean) => {
        onChange({ value: val }, modified);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const { keyCode } = e;

        if (keyCode === 13) {
            handleChange(e.currentTarget.value, true);
        } else if (keyCode === 27) {
            handleChange(value || '', false);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        handleChange(e.currentTarget.value, true);
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewValue(e.currentTarget.value);
    };

    return (
        <input
            ref={inputRef}
            type="text"
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
