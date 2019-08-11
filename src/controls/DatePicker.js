import React, { PureComponent } from 'react';
import { Calendar } from 'primereact/calendar';

class DatePicker extends PureComponent {
    constructor(props) {
        super(props);
        var { value, range } = props;
        this.state = { value: this.getDateValue(value, range) };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        var { value, range } = newProps;
        this.setState({ value: this.getDateValue(value, range) });
    }

    onChange = (e) => {
        var { value } = e;
        var { range } = this.props;
        var valToPush = value;
        if (range) {
            if (Array.isArray(value)) {
                valToPush = { fromDate: value[0], toDate: value[1] };
            }
        }
        this.setState({ value });
        this.props.onChange(valToPush);
    }

    getDateValue(value, range) {
        if (range) {
            return typeof value === "object" && value.fromDate ? [value.fromDate, value.toDate || null] : [];
        }
        else {
            return value;
        }
    }

    render() {
        var {
            onChange,
            props: { showTime, navigator, multiselect, range, disabled, title, style, className, placeholder },
            state: { value }
        } = this;

        var selectionMode = "single";
        if (multiselect === true) {
            selectionMode = "multiple";
            placeholder = placeholder || "Select one or more date";
        }
        else if (range === true) {
            selectionMode = "range";
            placeholder = placeholder || "Select a date range";
        }

        placeholder = placeholder || "Select a date";

        return (
            <Calendar appendTo={document.body} value={value} disabled={disabled} tooltip={title} style={style}
                className={className} showIcon={true} showSeconds={true} showTime={showTime} placeholder={placeholder}
                selectionMode={selectionMode} monthNavigator={navigator} yearNavigator={navigator} readonlyInput={true} hourFormat="12"
                onChange={onChange} />
        );
    }
}

export default DatePicker;