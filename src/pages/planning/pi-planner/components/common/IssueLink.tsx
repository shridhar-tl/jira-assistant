import classNames from 'classnames';

import { inject } from '@services';

import type { PlannerIssue } from '../../../shared/types';

interface IssueLinkProps {
    issueKey: string;
    issue?: PlannerIssue;
    className?: string;
}

/** Issue key with its type icon, opening the issue in Jira. Done issues are struck through. */
export default function IssueLink({ issueKey, issue, className }: IssueLinkProps) {
    const { $userutils } = inject('UserUtilsService');
    const url = issue?.url || $userutils.getTicketUrl(issueKey) || undefined;
    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={classNames(
                'inline-flex shrink-0 cursor-pointer items-center gap-1 font-medium text-(--text-primary) hover:underline',
                { 'line-through opacity-70': issue?.statusCategory === 'done' },
                className,
            )}
            title={issue ? `${issue.issueType}: ${issue.summary}` : issueKey}
        >
            {issue?.issueTypeIconUrl ? <img src={issue.issueTypeIconUrl} alt={issue.issueType} className="h-4 w-4" /> : <i className="fa fa-ticket text-(--text-tertiary)" />}
            {issueKey}
        </a>
    );
}
