import React, { PureComponent } from 'react';
import { RadioButton as RButton } from 'primereact/radiobutton';

let _globalUniqueId = 0;

class RadioButton extends PureComponent {
    constructor(props) {
        super(props);
        this.inputId = props.inputId || (props.label ? `rdo_${++_globalUniqueId}` : null);
    }

    onChange = (e) => {
        const { defaultValue } = this.props;
        this.props.onChange(defaultValue);
    }

    render() {
        const { inputId, onChange, props: { name, value, defaultValue, className, label, title, disabled } } = this;
        const checked = defaultValue === value;

        return (
            <span className={`ja-radio ${className || ""}`} title={title}>
                <RButton inputId={inputId} name={name} onChange={onChange} checked={checked} disabled={disabled} />
                {label && <label htmlFor={inputId}>{label}</label>}
            </span>
        );
    }
}

export default RadioButton;