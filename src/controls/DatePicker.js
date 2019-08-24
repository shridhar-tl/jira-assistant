import React, { PureComponent } from 'react';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';
import TextBox from './TextBox';
import moment from 'moment';
import Button from './Button';

const labelText = ['This month', 'Last one month', 'Last month', 'This week', 'Last one week', 'Last week'];

class DatePicker extends PureComponent {
    constructor(props) {
        super(props);
        const { value, range } = props;
        this.dateRange = this.getRange();
        this.displayFormat = props.dateFormat || "DD-MMM-YYYY";
        this.state = { value: this.getDateValue(value, range), displayDate: "" };
    }

    getRange() {
        return {
            'This month': [moment().startOf('month').toDate(), moment().endOf('month').toDate()],
            'Last one month': [moment().subtract(1, 'months').toDate(), moment().toDate()],
            'Last month': [moment().subtract(1, 'months').startOf('month').toDate(), moment().subtract(1, 'months').endOf('month').toDate()],
            'This week': [moment().startOf('week').toDate(), moment().endOf('week').toDate()],
            'Last one week': [moment().subtract(6, 'days').toDate(), moment().toDate()],
            'Last week': [moment().subtract(1, 'weeks').startOf('week').toDate(), moment().subtract(1, 'weeks').endOf('week').toDate()]
        };
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        const { value, range } = newProps;
        this.setState({ value: this.getDateValue(value, range) });
    }

    onChange = (e, picker) => {
        let { value } = e;
        const { range } = this.props;
        let valToPush = value;
        let displayDate = "";

        if (range) {
            const { chosenLabel, startDate, endDate } = picker;
            if (startDate && endDate) {
                valToPush = { fromDate: startDate.toDate(), toDate: endDate.toDate() };

                const idx = labelText.indexOf(chosenLabel);
                if (idx >= 0) {
                    valToPush.quickDate = idx;
                }

                displayDate = `${startDate.format(this.displayFormat)} - ${endDate.format(this.displayFormat)}`;

                value = [valToPush.fromDate, valToPush.toDate];
            }
        }
        this.setState({ value, displayDate });
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
        let {
            onChange, dateRange,
            props: { showTime, multiselect, range, disabled, style, className, placeholder },
            state: { value, displayDate }
        } = this;

        //var selectionMode = "single";
        if (multiselect === true) {
            //selectionMode = "multiple";
            placeholder = placeholder || "Select one or more date";
        }
        else if (range === true) {
            //selectionMode = "range";
            placeholder = placeholder || "Select a date range";
        }

        placeholder = placeholder || "Select a date";

        return <DateRangePicker style={style} className={className} disabled={disabled} startDate={value[0]} endDate={value[1]} showDropdowns={true}
            timePicker={showTime || false}
            ranges={range ? dateRange : null} showCustomRangeLabel={true} alwaysShowCalendars={false} maxSpan={6} autoApply={true}
            linkedCalendars={false} autoUpdateInput={false} singleDatePicker={!range} onApply={onChange}>
            <TextBox className="date-range-ctl" value={displayDate} readOnly={true} placeholder={placeholder} />
            <Button icon="fa fa-calendar" className="icon" />
        </DateRangePicker>;

        /*
        if (range) {
        }
        else {
            return (
                <Calendar appendTo={document.body} value={value} disabled={disabled} tooltip={title} style={style}
                    className={className} showIcon={true} showSeconds={true} showTime={showTime} placeholder={placeholder}
                    selectionMode={selectionMode} monthNavigator={navigator} yearNavigator={navigator} readonlyInput={true} hourFormat="12"
                    onChange={onChange} />
            );
        }*/
    }
}

export default DatePicker;