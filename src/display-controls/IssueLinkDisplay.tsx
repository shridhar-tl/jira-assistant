import { type ElementType } from 'react';

import { inject } from '@services';

import BaseControl from './BaseControl';
import IssueDisplay from './IssueDisplay';

interface IssueLinkDisplayProps {
    value?: any;
    tag?: ElementType | null;
    [key: string]: any;
}

function IssueLinkDisplay({ value, tag, ...rest }: IssueLinkDisplayProps) {
    const { $userutils } = inject('UserUtilsService');

    if (!value?.inwardIssue && !value?.outwardIssue) {
        return <BaseControl tag={tag} {...rest} />;
    }

    const issue = value.inwardIssue || value.outwardIssue;
    const type = value.type;

    return (
        <BaseControl tag={tag} {...rest}>
            <span className="text-gray-600 mr-2">{type?.name || type?.inward || type?.outward}</span>
            <IssueDisplay value={issue} tag={null} getTicketUrl={(key: string) => $userutils.getTicketUrl(key) || ''} />
        </BaseControl>
    );
}

export default IssueLinkDisplay;
