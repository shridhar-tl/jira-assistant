import React from 'react';
import BaseControl from './BaseControl';

class CascadeSelect extends BaseControl {
    renderControl(badge) {
        const { value } = this.props;

        if (!value) { return badge; }

        const { value: valueText, child: { value: childText } = {} } = value;

        return <>
            {valueText} - {childText} {badge}
        </>;
    }
}

export default CascadeSelect;