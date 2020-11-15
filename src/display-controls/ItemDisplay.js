import React from 'react';
import BaseControl from './BaseControl';
import { Image } from '../controls';

class ItemDisplay extends BaseControl {
    renderControl(badge) {
        const { value, textField = 'name', iconField = 'iconUrl' } = this.props;

        if (!value) { return badge; }

        return <>
            {!!iconField && <Image src={value[iconField]} />}
            {value[textField]} {badge}
        </>;
    }
}

export default ItemDisplay;