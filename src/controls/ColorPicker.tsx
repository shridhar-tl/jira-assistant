import { useCallback, useState } from 'react';

import type { ComponentEvent } from 'fluxo-ui';

import { TextInput } from '@components';

interface ColorPickerProps {
    value?: string;
    disabled?: boolean;
    onChange: (value: string, fieldName: string) => void;
    fieldName: string;
}

function ColorPicker({ value = '', disabled = false, fieldName, onChange }: ColorPickerProps) {
    const [localValue, setLocalValue] = useState(value);

    const colorTextChanged = useCallback(
        (e: ComponentEvent<string>) => {
            let color = e.value;
            if (color && !color.startsWith('#')) {
                color = `#${color}`;
            }
            setLocalValue(color);
            onChange(color, fieldName);
        },
        [onChange, fieldName],
    );

    const handleColorPick = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const color = e.target.value;
            setLocalValue(color);
            onChange(color, fieldName);
        },
        [onChange, fieldName],
    );

    return (
        <div className="flex gap-2 items-center">
            <input
                type="color"
                value={localValue || '#000000'}
                onChange={handleColorPick}
                disabled={disabled}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <TextInput value={localValue || ''} onChange={colorTextChanged} disabled={disabled} className="flex-1" />
        </div>
    );
}

export default ColorPicker;
