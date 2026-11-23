import { useCallback } from 'react';

import { ColorPicker as ColorPickerInput } from '@components';

interface ColorPickerProps {
    value?: string;
    disabled?: boolean;
    onChange: (value: string, fieldName: string) => void;
    fieldName: string;
}

const hexColorPattern = /^#[0-9a-f]{6}$/i;

function ColorPicker({ value = '', disabled = false, fieldName, onChange }: ColorPickerProps) {
    const colorChanged = useCallback((color: string) => onChange(color, fieldName), [onChange, fieldName]);

    return (
        <ColorPickerInput
            variant="input"
            editable
            showAlpha={false}
            value={hexColorPattern.test(value) ? value : '#000000'}
            disabled={disabled}
            ariaLabel={fieldName}
            onChange={colorChanged}
        />
    );
}

export default ColorPicker;
