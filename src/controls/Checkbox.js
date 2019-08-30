import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'primereact/checkbox';

let _globalUniqueId = 0;

class InputCheckbox extends PureComponent {
    constructor(props) {
        super(props);
        this.inputId = props.inputId || (props.label ? `chk_${++_globalUniqueId}` : null);
    }

    onChange = (e) => {
        const { onChange } = this.props;
        if (onChange) {
            onChange(e.checked);
        }
    }

    render() {
        const { inputId, onChange, onClick, props: { className = "", checked = false, label, disabled } } = this;

        return (
            <span className={`span-cb ${className}`}>
                <Checkbox inputId={inputId} onChange={onChange} checked={checked} disabled={disabled} onClick={onClick} />
                {label && <label htmlFor={inputId} className="chk-label">{label}</label>}
            </span>
        );
    }
}

InputCheckbox.propTypes = {
    checked: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string
};

export default InputCheckbox;