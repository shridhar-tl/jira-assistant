import React, { PureComponent } from 'react';
import Picker from 'rc-time-picker';
import "rc-time-picker/assets/index.css";
import moment from "moment";

const disabledHours = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

class TimePicker extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        let { value } = nextProps;
        let newState = null;

        if (!prevState || prevState.value !== value) {
            newState = { value };
            if (value) {
                const curDate = moment();
                if (nextProps.mode === "string") {
                    // ToDo: Yet to implement
                }
                else {
                    value = value.toString().split('.');
                    curDate.set({ h: value[0], m: (60 * (value[1] || 0)) / 100 });
                }
                newState.timeValue = curDate;
            }
            else {
                newState.timeValue = null;
            }
        }

        return newState;
    }

    onChange = (timeValue) => {
        const value = this.getValue(timeValue);
        this.setState({ timeValue, value });
        this.props.onChange(value);
    }

    getValue(timeValue) {
        if (!timeValue) { return null; }

        const { mode } = this.props;
        if (mode === "string") {
            // ToDo: Yet to implement
        }
        else {
            return timeValue.hour() + (timeValue.minute() / 60);
        }
    }

    checkDisabled = () => disabledHours

    render() {
        const { state: { timeValue }, props: { className, disabled, placeholder = "Choose time" } } = this;

        return (
            <Picker defaultValue={timeValue} className={className} disabled={disabled}
                showSecond={false} inputReadOnly={false} placeholder={placeholder}
                onChange={this.onChange} disabledHours={this.checkDisabled} hideDisabledOptions={true} />
        );
    }
}

export default TimePicker;