import React from 'react';
import BaseControl from './BaseControl';

class UnknownItemDisplay extends BaseControl {
    renderControl(badge) {
        let { value } = this.props;

        if (!value) { return badge; }

        value = value?.text || value;

        if (typeof value !== 'object') {
            return <>{value} {badge}</>;
        }
        else {
            return JSON.stringify(value);
        }
    }
}

export default UnknownItemDisplay;