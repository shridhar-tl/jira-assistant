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
    const badge =
        !!count && !!settings?.showGroupCount ? (
            <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded" title={`Total issues in group: ${count}`}>
                ({count})
            </span>
        ) : null;

    if (!value) {
        return <BaseControl tag={tag} tagProps={tagProps} className={className} settings={settings} count={count} {...rest} />;
    }

    const { value: valueText, child: { value: childText } = {} } = value;

    return (
        <BaseControl tag={tag} tagProps={tagProps} className={className} settings={settings} count={count} {...rest}>
            {valueText} - {childText} {badge}
        </BaseControl>
    );
}

export default CascadeSelect;
