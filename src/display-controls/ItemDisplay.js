import React from 'react';
import BaseControl from './BaseControl';
import { Image } from '../controls';

class ItemDisplay extends BaseControl {
    renderControl() {
        const { value, textField = 'name', iconField = 'iconUrl' } = this.props;

        if (!value) { return null; }

        return <>
            {!!iconField && <Image src={value[iconField]} />}
            {value[textField]}
        </>;
    }
}

export default ItemDisplay;