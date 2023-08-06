import React from 'react';
import { ColorPicker as PrimeColorPicker } from 'primereact/colorpicker';
import TextBox from './TextBox';

function ColorPicker({ fieldName, value = "", disabled, onChange }) {
    const colorTextChanged = React.useCallback((color) => {
        if (color && !color.startsWith("#")) {
            color = `#${color}`;
        }

        onChange(color, fieldName);
    }, [fieldName, onChange]);

    const onPick = React.useCallback((e) => colorTextChanged(e.value), [colorTextChanged]);

    let hexValue = value;
    if (hexValue && hexValue.startsWith("#")) {
        hexValue = hexValue.substring(1);
    }

    return (<>
        <PrimeColorPicker format="hex" appendTo={document.body} disabled={disabled} value={hexValue} onChange={onPick} />
        <TextBox value={value || ''} onChange={colorTextChanged} />
    </>);
}

export default ColorPicker;