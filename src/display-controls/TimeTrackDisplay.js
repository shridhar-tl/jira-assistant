import React from 'react';
import BaseControl from './BaseControl';

class TimeTrackDisplay extends BaseControl {
    renderControl() {
        const { value } = this.props;

        if (!value) { return null; }

        const { remainingEstimate, timeSpent } = value;

        if (!timeSpent && !remainingEstimate) { return null; }

        return (
            <span>{timeSpent} ({remainingEstimate} remaining)</span>
        );
    }
}

export default TimeTrackDisplay;