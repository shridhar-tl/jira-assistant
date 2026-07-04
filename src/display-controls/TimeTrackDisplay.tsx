import { type ElementType } from 'react';

import BaseControl from './BaseControl';

interface TimeTrackValue {
    remainingEstimate?: string;
    timeSpent?: string;
}

interface TimeTrackDisplayProps {
    value?: TimeTrackValue;
    tag?: ElementType | null;
    tagProps?: any;
    className?: string;
    settings?: { showGroupCount?: boolean; [key: string]: any };
    count?: number;
    [key: string]: any;
}

function TimeTrackDisplay({ value, tag, tagProps, className, settings, count, ...rest }: TimeTrackDisplayProps) {
    if (!value) {
        return <BaseControl tag={tag} tagProps={tagProps} className={className} settings={settings} count={count} {...rest} />;
    }

    const { remainingEstimate, timeSpent } = value;

    if (!timeSpent && !remainingEstimate) {
        return <BaseControl tag={tag} tagProps={tagProps} className={className} settings={settings} count={count} {...rest} />;
    }

    return (
        <BaseControl tag={tag} tagProps={tagProps} className={className} settings={settings} count={count} {...rest}>
            <span>
                {timeSpent} ({remainingEstimate} remaining)
            </span>
        </BaseControl>
    );
}

export default TimeTrackDisplay;
