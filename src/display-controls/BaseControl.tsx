import { type ReactNode } from 'react';
import { type ElementType } from 'react';

interface BaseControlProps {
    tag?: ElementType | null;
    tagProps?: any;
    className?: string;
    settings?: {
        showGroupCount?: boolean;
        [key: string]: any;
    };
    count?: number;
    children?: ReactNode;
}

function BaseControl({ tag: Tag = 'td', tagProps, className, settings, count, children }: BaseControlProps) {
    const badge = !!count && !!settings?.showGroupCount && (
        <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded" title={`Total issues in group: ${count}`}>
            ({count})
        </span>
    );

    const content = (
        <>
            {children}
            {badge}
        </>
    );

    if (Tag === null) {
        return content;
    }

    return (
        <Tag className={className} {...tagProps}>
            {content}
        </Tag>
    );
}

export default BaseControl;
