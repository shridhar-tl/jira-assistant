import React, { PureComponent } from 'react';
import { DefaultWorkingDays } from '../../../_constants';

const shortDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

class WeekDaysSelector extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { value: props.value || DefaultWorkingDays };
    }

    UNSAFE_componentWillReceiveProps(props) {
        let { value } = props;
        if (!value) {
            value = value || DefaultWorkingDays;
        }

        if (this.state.value !== value) {
            this.setState({ value });
        }
    }

    getClass($index) {
        return this.state.value.indexOf($index) > -1 ? 'day day-on' : 'day';
    }

    daySelected(index) {
        let { value } = this.state;
        const pos = value.indexOf(index);

        if (pos === -1) {
            value = value.concat(index);
        }
        else {
            value.removeAt(pos);
        }

        value = value.orderBy();
        this.setState({ value });
        this.props.onChange(value, this.props.field);
    }

    render() {
        return (
            <div className="daysinweek">
                {shortDays.map((day, i) => <div key={day} className={this.getClass(i)} onClick={() => this.daySelected(i)}>{day}</div>)}
            </div>
        );
    }
}

export default WeekDaysSelector;