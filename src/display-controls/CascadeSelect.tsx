import { type ElementType } from 'react';

import BaseControl from './BaseControl';

interface CascadeSelectValue {
    value: string;
    child?: { value: string };
}

interface CascadeSelectProps {
    value?: CascadeSelectValue;
    tag?: ElementType | null;
    tagProps?: any;
    className?: string;
    settings?: { showGroupCount?: boolean; [key: string]: any };
    count?: number;
    [key: string]: any;
}

function CascadeSelect({ value, tag, tagProps, className, settings, count, ...rest }: CascadeSelectProps) {
    if (!value) {
        return <BaseControl tag={tag} tagProps={tagProps} className={className} settings={settings} count={count} {...rest} />;
    }

    const { value: valueText, child: { value: childText } = {} } = value;

    return (
        <BaseControl tag={tag} tagProps={tagProps} className={className} settings={settings} count={count} {...rest}>
            {valueText} - {childText}
        </BaseControl>
    );
}

export default CascadeSelect;
