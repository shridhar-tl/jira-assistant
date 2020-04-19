import React, { PureComponent } from 'react';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';
import TextBox from './TextBox';
import moment from 'moment';
import Button from './Button';
import { inject } from '../services';

const labelText = ['This month', 'Last one month', 'Last month', 'This week', 'Last one week', 'Last week'];

export function getRange() {
    return {
        'This month': [moment().startOf('month').toDate(), moment().endOf('month').toDate()],
        'Last one month': [moment().subtract(1, 'months').toDate(), moment().toDate()],
        'Last month': [moment().subtract(1, 'months').startOf('month').toDate(), moment().subtract(1, 'months').endOf('month').toDate()],
        'This week': [moment().startOf('week').toDate(), moment().endOf('week').toDate()],
        'Last one week': [moment().subtract(6, 'days').toDate(), moment().toDate()],
        'Last week': [moment().subtract(1, 'weeks').startOf('week').toDate(), moment().subtract(1, 'weeks').endOf('week').toDate()]
    };
}

export function getQuickDateValue(quickDate, asMoment) {
    if (quickDate === 0 || quickDate > 0) {
        const dateRange = getRange();
        const key = labelText[quickDate];
        const value = key ? dateRange[key] || [] : [];
        return asMoment ? value.map(d => moment(d)) : value;
    }
}

class DatePicker extends PureComponent {
    constructor(props) {
        super(props);
        const { value, range, showTime } = props;
        inject(this, "SessionService");
        let timeFormat = this.$session.CurrentUser.timeFormat || " hh:mm tt";
        this.timePicker24Hour = timeFormat.indexOf("tt") === -1;
        timeFormat = timeFormat.replace("tt", "A").replace(".ss", "").replace(":ss", "");
        this.dateRange = getRange();
        this.displayFormat = props.dateFormat || `DD-MMM-YYYY${showTime ? timeFormat : ""}`;
        this.state = this.getDateValue(value, range);
    }


    UNSAFE_componentWillReceiveProps(newProps) {
        const { value, range } = newProps;
        this.setState(this.getDateValue(value, range));
    }

    onChange = (e, picker) => {
        this.manuallyEdited = false;
        //let { value } = e;
        const { range } = this.props;
        let value = picker.startDate;
        let valToPush = value.toDate();
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
        else {
            displayDate = value.format(this.displayFormat);
        }

        this.setState({ value, displayDate });
        this.props.onChange(valToPush);
    }

    getDateValue(value, range) {
        const newState = { displayDate: "" };

        if (value) {
            if (range) {
                if (typeof value === "object") {
                    if (value.quickDate >= 0) {
                        value = getQuickDateValue(value.quickDate, true);
                    } else {
                        value = typeof value === "object" && value.fromDate ? [moment(value.fromDate), moment(value.toDate) || null] : [];
                    }

                    newState.value = value;
                    if (value[0] && value[1]) {
                        newState.displayDate = `${value[0].format(this.displayFormat)} - ${value[1].format(this.displayFormat)}`;
                    }
                }
            }
            else {
                newState.value = moment(value);
                newState.displayDate = newState.value.format(this.displayFormat);
            }
        }
        else if (range) {
            newState.value = [];
        }

        return newState;
    }

    setDate = (e) => {
        if (this.manuallyEdited) {
            let { target: { value } } = e;
            value = value.trim();

            let startDate = moment(value, this.displayFormat);

            if (startDate.format(this.displayFormat) !== value) {
                startDate = this.state.value;
            }

            this.onChange(null, { startDate });
        }
    }

    dateEdited = (e) => {
        this.manuallyEdited = true;
    }

    render() {
        const {
            onChange, dateRange,
            props: { showTime, multiselect, range, disabled, style, className },
            state: { value, displayDate }
        } = this;
        let { placeholder } = this.props;

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

        if (range) {
            return <DateRangePicker style={style} className={className} disabled={disabled} startDate={value[0]} endDate={value[1]} showDropdowns={true}
                timePicker={showTime || false}
                ranges={range ? dateRange : null} showCustomRangeLabel={true} alwaysShowCalendars={false} maxSpan={6} autoApply={true}
                linkedCalendars={false} autoUpdateInput={false} singleDatePicker={!range} onApply={onChange}>
                <TextBox className="date-range-ctl" value={displayDate} readOnly={true} placeholder={placeholder} />
                <Button icon="fa fa-calendar" className="icon" />
            </DateRangePicker>;
        }
        else {
            return <DateRangePicker style={style} className={className} disabled={disabled} startDate={value} endDate={value} showDropdowns={true}
                timePicker={showTime || false} timePicker24Hour={this.timePicker24Hour} alwaysShowCalendars={false} maxSpan={6} autoApply={true}
                linkedCalendars={false} autoUpdateInput={false} singleDatePicker={!range} onApply={onChange}>
                <TextBox className="date-range-ctl" value={displayDate} placeholder={placeholder} onChange={this.dateEdited} onBlur={this.setDate} />
                <Button icon="fa fa-calendar" className="icon" />
            </DateRangePicker>;
        }

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