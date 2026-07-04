import { type ElementType } from 'react';

import BaseControl from './BaseControl';
import TagsDisplay from './TagsDisplay';

interface UnknownItemDisplayProps {
    value?: any;
    tag?: ElementType | null;
    [key: string]: any;
}

function UnknownItemDisplay({ value, tag, ...rest }: UnknownItemDisplayProps) {
    if (!value) return <BaseControl tag={tag} {...rest} />;

    const val = value?.text || value;

    if (typeof val !== 'object') {
        return (
            <BaseControl tag={tag} {...rest}>
                {val}
            </BaseControl>
        );
    }

    if (Array.isArray(val)) {
        if (!val.length) return <BaseControl tag={tag} {...rest} />;
        return getTagRenderer(val[0], val);
    }

    return getTagRenderer(val, val);
}

function getTagRenderer(obj: any, value: any) {
    if (typeof obj === 'string') {
        return <TagsDisplay value={value} tagProp="" tag="span" />;
    } else if (obj['value']) {
        if (typeof obj['value'] === 'string' && !Array.isArray(value)) {
            return <>{obj['value']}</>;
        }
        return <TagsDisplay value={value} tagProp="value" tag="span" />;
    } else if (obj['name']) {
        return <TagsDisplay value={value} tagProp="name" tag="span" />;
    } else {
        return <>{JSON.stringify(obj)}</>;
    }
}

export default UnknownItemDisplay;
