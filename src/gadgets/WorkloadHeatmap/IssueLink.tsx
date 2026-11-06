import { Link } from '@/controls';

import type { HeatmapIssue } from './types';

interface IssueLinkProps {
    issue: HeatmapIssue;
}

export default function IssueLink({ issue }: IssueLinkProps) {
    const content = (
        <>
            {issue.issueTypeIconUrl && <img src={issue.issueTypeIconUrl} alt={issue.issueType} className="h-3.5 w-3.5 shrink-0" />}
            <span className="font-semibold">{issue.key}</span>
        </>
    );

    if (!issue.url) {
        return <span className="inline-flex items-center gap-1">{content}</span>;
    }

    return (
        <Link
            href={issue.url}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-(--primary-color) hover:underline"
            title={issue.summary}
        >
            {content}
        </Link>
    );
}
