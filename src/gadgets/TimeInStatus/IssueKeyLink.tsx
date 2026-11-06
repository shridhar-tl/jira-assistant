import { Link } from '@/controls';

import type { TisIssue } from './types';

interface IssueKeyLinkProps {
    issue: TisIssue;
}

export default function IssueKeyLink({ issue }: IssueKeyLinkProps) {
    const content = (
        <>
            {issue.issueType.iconUrl && <img src={issue.issueType.iconUrl} alt={issue.issueType.name} className="h-3.5 w-3.5 shrink-0" />}
            <span className="font-semibold">{issue.key}</span>
        </>
    );

    if (!issue.url) {
        return <span className="inline-flex items-center gap-1 whitespace-nowrap">{content}</span>;
    }

    return (
        <Link
            href={issue.url}
            className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap font-semibold text-(--primary-color) hover:underline"
            title={issue.summary}
        >
            {content}
        </Link>
    );
}
