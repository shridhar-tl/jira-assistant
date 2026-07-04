import { type ElementType } from 'react';

import BaseControl from './BaseControl';

interface ProgressDisplayProps {
    value?: any;
    progress?: any;
    tag?: ElementType | null;
    [key: string]: any;
}

function ProgressDisplay({ value, progress = value, tag, ...rest }: ProgressDisplayProps) {
    if (!progress?.percent) return <BaseControl tag={tag} {...rest} />;

    return (
        <BaseControl tag={tag} {...rest}>
            {progress.percent}%
        </BaseControl>
    );
}

export default ProgressDisplay;
