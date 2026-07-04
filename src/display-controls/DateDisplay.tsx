import { type ElementType } from 'react';

import { inject } from '@services';

import BaseControl from './BaseControl';

interface DateDisplayProps {
    value?: any;
    date?: string | Date;
    quick?: boolean;
    format?: string;
    dateOnly?: boolean;
    tag?: ElementType | null;
    className?: string;
    [key: string]: any;
}

function DateDisplay({ value, date = value, quick, format: fType, dateOnly, tag, className, ...rest }: DateDisplayProps) {
    const { $userutils } = inject('UserUtilsService');

    if (!date) return <BaseControl tag={tag} className={className} {...rest} />;

    if (value?.text) {
        return (
            <BaseControl tag={tag} className={className} {...rest}>
                {value.text}
            </BaseControl>
        );
    }

    const format = dateOnly ? $userutils.formatDate : $userutils.formatDateTime;

    return (
        <BaseControl tag={tag} className={className} {...rest}>
            <span title={quick ? format(date) : undefined}>
                {quick && 'about '} {format(date, quick ? 'quick' : fType)}
            </span>
        </BaseControl>
    );
}

export default DateDisplay;
