import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { InputText } from "primereact/inputtext";
import { InputTextarea } from 'primereact/inputtextarea';

class TextBox extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { value: props.value || "" };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        let { value } = newProps;
        if (!value) { value = ""; }
        if (value !== this.state.value) {
            this.setState({ value });
        }
    }

    onChange = (e) => {
        const { filter, onChange, readOnly, field, args } = this.props;
        if (readOnly === true) { return; }

        const { value: oldValue } = this.state;
        let { target: { value } } = e;
        if (filter) {
            value = oldValue; // ToDo: implement filter
        }
        this.setState({ value });
        onChange(value, field, args);
    };

    keyPress = (e) => {
        const { key } = e;
        if (key && key.length > 1) {
            const func = this.props[`onKey_${key}`];
            if (func) {
                func(this.state.value);
            }
        }

        const { onKeyDown } = this.props;

        if (onKeyDown) { onKeyDown(e); }
    };

    render() {
        const { value } = this.state;
        const { type, keyfilter, style, className, maxLength, placeholder, multiline, rows, autoResize, readOnly, disabled, autoFocus } = this.props;

        if (multiline) {
            return (
                <InputTextarea rows={rows} value={value} autoResize={autoResize} keyfilter={keyfilter} style={style} maxLength={maxLength} disabled={disabled}
                    className={`w-100 ${className || ''}`} placeholder={placeholder} onChange={this.onChange} onKeyPress={this.keyPress}
                    onBlur={this.props.onBlur} />
            );
        }
        else {
            return (
                <InputText type={type} value={value} keyfilter={keyfilter} style={style} maxLength={maxLength} className={className} placeholder={placeholder}
                    onChange={this.onChange} onKeyDown={this.keyPress} readOnly={readOnly} disabled={disabled} onBlur={this.props.onBlur} autoFocus={autoFocus} />
            );
        }
    }
}

TextBox.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.string,
    maxLength: PropTypes.number,
    placeholder: PropTypes.string,
    multiline: PropTypes.bool
};

export default TextBox;