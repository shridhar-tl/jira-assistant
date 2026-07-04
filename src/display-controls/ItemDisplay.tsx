import { type ElementType } from 'react';

import { Image } from '@/controls';

import BaseControl from './BaseControl';

interface ItemDisplayProps {
    value?: any;
    textField?: string;
    iconField?: string;
    tag?: ElementType | null;
    [key: string]: any;
}

function ItemDisplay({ value, textField = 'name', iconField = 'iconUrl', tag, ...rest }: ItemDisplayProps) {
    if (!value) return <BaseControl tag={tag} {...rest} />;

    return (
        <BaseControl tag={tag} {...rest}>
            {!!iconField && value[iconField] && <Image className="mr-2" src={value[iconField]} />}
            {value[textField]}
        </BaseControl>
    );
}

export default ItemDisplay;
