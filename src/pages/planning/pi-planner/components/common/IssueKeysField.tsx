import { IssuePicker } from '@/jira-controls';

import { Button } from '@components';

import type { PlannerIssue } from '../../../shared/types';
import { maxLinkedIssueKeys } from '../../pi-items';

import IssueLink from './IssueLink';
import StatusPill from './StatusPill';

interface IssueKeysFieldProps {
    value: string[];
    onChange: (keys: string[]) => void;
    issues: Record<string, PlannerIssue>;
    placeholder?: string;
    emptyText?: string;
}

/** Issues picked from Jira, listed with their type, summary and status. An epic stands for its stories in the plan. */
export default function IssueKeysField({ value, onChange, issues, placeholder = 'Find an issue by key or summary', emptyText }: IssueKeysFieldProps) {
    const add = (picked: unknown) => {
        const key = typeof picked === 'string' ? picked.toUpperCase() : null;
        if (key && !value.includes(key) && value.length < maxLinkedIssueKeys) {
            onChange([...value, key]);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            {value.length > 0 ? (
                <ul className="flex max-h-48 flex-col gap-0.5 overflow-auto rounded-md border border-(--border-primary) p-1" aria-label="Linked issues">
                    {value.map((key) => {
                        const issue = issues[key];
                        return (
                            <li key={key} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-(--bg-hover)">
                                <IssueLink issueKey={key} issue={issue} />
                                <span className="min-w-0 flex-1 truncate text-(--text-secondary)">{issue?.summary || ''}</span>
                                {issue && <StatusPill status={issue.status} category={issue.statusCategory} />}
                                <Button size="xs" layout="plain" leftIcon={<i className="fa fa-times" />} ariaLabel={`Remove ${key}`} onClick={() => onChange(value.filter((k) => k !== key))} />
                            </li>
                        );
                    })}
                </ul>
            ) : (
                emptyText && <span className="text-xs text-(--text-tertiary)">{emptyText}</span>
            )}
            {value.length < maxLinkedIssueKeys ? (
                <IssuePicker onPick={add} placeholder={placeholder} />
            ) : (
                <span className="text-xs text-(--text-tertiary)">At most {maxLinkedIssueKeys} issues can be linked.</span>
            )}
        </div>
    );
}
