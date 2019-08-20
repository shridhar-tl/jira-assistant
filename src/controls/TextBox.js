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
        var { value } = newProps;
        if (!value) { value = ""; }
        if (value !== this.state.value) {
            this.setState({ value });
        }
    }

    onChange = (e) => {
        var { filter, onChange } = this.props;
        var { value: oldValue } = this.state;
        var { target: { value } } = e;
        if (filter) {
            value = oldValue; // ToDo: implement filter
        }
        this.setState({ value });
        onChange(value);
    }

    keyPress = (e) => {
        var { key } = e;
        if (key && key.length > 1) {
            var func = this.props['onKey_' + key];
            if (func) {
                func(this.state.value);
            }
        }
    }

    render() {
        var { value } = this.state;
        var { keyfilter, style, className, maxLength, placeholder, multiline, rows, autoResize, readOnly } = this.props;

        if (multiline) {
            return (
                <InputTextarea rows={rows} value={value} autoResize={autoResize} keyfilter={keyfilter} style={style} maxLength={maxLength}
                    className={'w-p-100 ' + (className || '')} placeholder={placeholder} onChange={this.onChange} onKeyPress={this.keyPress} />
            );
        }
        else {
            return (
                <InputText value={value} keyfilter={keyfilter} style={style} maxLength={maxLength} className={className} placeholder={placeholder}
                    onChange={this.onChange} onKeyDown={this.keyPress} readOnly={readOnly} />
            );
        }
    }
}

TextBox.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    maxLength: PropTypes.number,
    placeholder: PropTypes.string,
    multiline: PropTypes.bool
};

export default TextBox;