import React, { PureComponent } from 'react';
import { stop } from '../components/editable-table/utils';
import { DatePicker } from '../controls';
import { inject } from '../services/injector-service';

class DateEditor extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'UserUtilsService');
        const { formatDateTime, formatDate } = this.$userutils;
        this.format = props.showTime ? formatDateTime : formatDate;
    }

    editorKeyDown = (e) => {
        const { keyCode } = e;

        if (keyCode === 27) {
            this.onBlur();
            stop(e);
        }
    };

    onBlur = (e) => this.onChange(this.props.value, false);

    onChange = (value, modified) => {
        const valueObj = value ? { value, displayText: this.format(value) } : { clearValue: true };
        this.props.onChange(valueObj, modified);
    };
    valueChanged = (val) => this.onChange(val, true);

    render() {
        const { placeholder = "Choose a date", value, showTime } = this.props;

        return (
            <DatePicker className="ja-date-editor" value={value} autoFocus showTime={showTime} placeholder={placeholder} onChange={this.valueChanged}
                onKeyDown={this.editorKeyDown} onBlur={this.onBlur} allowClear={true} />
        );
    }
}

export default DateEditor;