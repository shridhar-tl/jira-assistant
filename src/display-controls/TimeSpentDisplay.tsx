import { type ElementType } from 'react';

import { inject } from '@services';

import BaseControl from './BaseControl';

interface TimeSpentDisplayProps {
    value?: number;
    timespent?: number;
    inputType?: 'secs' | 'days' | 'ticks';
    format?: boolean;
    days?: boolean;
    converter?: (value: number) => number;
    tag?: ElementType | null;
    className?: string;
    [key: string]: any;
}

function TimeSpentDisplay({
    value,
    timespent = value,
    inputType = 'secs',
    format = true,
    days,
    converter,
    tag,
    className,
    ...rest
}: TimeSpentDisplayProps) {
    const { $utils } = inject('UtilsService');

    let timeValue: any = timespent;

    if (converter && typeof timeValue === 'number') {
        timeValue = converter(timeValue);
    }

    if (!timeValue) return <BaseControl tag={tag} className={className} {...rest} />;

    if (inputType === 'days') {
        const mins = timeValue * 24 * 60;
        timeValue = parseInt(String(mins)) * 60;
        if (!timeValue && mins) {
            timeValue = '< 1m';
        }
    } else if (inputType === 'ticks' && timeValue > 500) {
        timeValue = parseInt(String(timeValue / 1000));
    }

    let displayValue: string;

    if (typeof timeValue === 'object' && timeValue?.text) {
        displayValue = timeValue.text;
    } else if (typeof timeValue === 'string') {
        displayValue = timeValue;
    } else if (format === false) {
        displayValue = String($utils.convertSecs(timeValue as number, { showZeroSecs: true }));
    } else {
        displayValue = $utils.formatSecs(timeValue as number, undefined, undefined, days);
    }

    return (
        <BaseControl tag={tag} className={className} {...rest}>
            <span>{displayValue}</span>
        </BaseControl>
    );
}

export default TimeSpentDisplay;
