import { type ElementType } from 'react';

import BaseControl from './BaseControl';

interface CommentsDisplayProps {
    value?: any;
    tag?: ElementType | null;
    [key: string]: any;
}

function CommentsDisplay({ value, tag, ...rest }: CommentsDisplayProps) {
    if (!value) return <BaseControl tag={tag} {...rest} />;

    if (typeof value?.maxResults === 'number') {
        return (
            <BaseControl tag={tag} {...rest}>
                {value.maxResults} comments
            </BaseControl>
        );
    }

    const comments = Array.isArray(value?.comments) ? value.comments : value;

    if (!comments?.length) return <BaseControl tag={tag} {...rest} />;

    return (
        <BaseControl tag={tag} {...rest}>
            {comments.length} comments
        </BaseControl>
    );
}

export default CommentsDisplay;
