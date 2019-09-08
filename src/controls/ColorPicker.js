import React, { PureComponent } from 'react';
import { ColorPicker as PrimeColorPicker } from 'primereact/colorpicker';
import TextBox from './TextBox';

class ColorPicker extends PureComponent {
    onChange = (e) => this.colorTextChanged(e.value)

    colorTextChanged = (color) => {
        const { onChange, fieldName } = this.props;
        onChange(color, fieldName);
    }

    render() {
        const { disabled } = this.props;
        let { value = "" } = this.props;

        if (value && value.startsWith("#")) {
            value = value.substring(1);
        }

        return (<>
            <PrimeColorPicker format="hex" appendTo={document.body} disabled={disabled} value={value} onChange={this.onChange} />
            <TextBox value={`#${value || ""}`} onChange={this.colorTextChanged} />
        </>);
    }
}

export default ColorPicker;