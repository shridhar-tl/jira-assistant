import React from 'react';
import BaseControl from './BaseControl';
import TagsDisplay from './TagsDisplay';

class UnknownItemDisplay extends BaseControl {
    renderControl(badge) {
        let { value } = this.props;

        if (!value) { return badge; }

        value = value?.text || value;

        if (typeof value !== 'object') {
            return <>{value} {badge}</>;
        }
        else if (Array.isArray(value)) {
            if (!value.length) {
                return null;
            }

            return this.getTagRenderer(value[0], value);
        }

        return this.getTagRenderer(value, value);
    }

    getTagRenderer(obj, value) {
        if (obj['value']) {
            return (<TagsDisplay value={value} tagProp="value" tag="span" />);
        }
        else if (obj['name']) {
            return (<TagsDisplay value={value} tagProp="name" tag="span" />);
        }
        else {
            return JSON.stringify(obj);
        }
    }
}

export default UnknownItemDisplay;