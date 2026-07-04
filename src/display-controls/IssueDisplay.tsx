import { type ElementType } from 'react';

import { Image, Link } from '@/controls';

import { inject } from '@services';

import BaseControl from './BaseControl';

interface IssueDisplayProps {
    value?: any;
    issue?: any;
    title?: string;
    className?: string;
    iconClass?: string;
    style?: React.CSSProperties;
    settings?: {
        showStatus?: boolean;
        valueType?: 'key' | 'summary' | 'both';
        [key: string]: any;
    };
    getTicketUrl?: (key: string) => string;
    tag?: ElementType | null;
    [key: string]: any;
}

function IssueDisplay({
    value,
    issue = value,
    title,
    className = '',
    iconClass,
    style,
    settings,
    getTicketUrl: customGetTicketUrl,
    tag,
    ...rest
}: IssueDisplayProps) {
    const { $userutils } = customGetTicketUrl ? ({} as any) : inject('UserUtilsService');
    const getTicketUrl = customGetTicketUrl || (($userutils?.getTicketUrl as (key: string) => string) ?? (() => ''));

    if (!issue) return <BaseControl tag={tag} className={className} {...rest} />;

    if (typeof issue === 'string') {
        return (
            <BaseControl tag={tag} className={className} {...rest}>
                <Link href={getTicketUrl(issue) || ''} className={`text-blue-600 hover:underline ${className}`}>
                    {issue}
                </Link>
            </BaseControl>
        );
    }

    const key = issue.key;
    const fields = issue.fields;
    const issueType = fields?.issuetype;
    const summary = fields?.summary;
    const iconUrl = issueType?.iconUrl;
    const issueTypeName = issueType?.name;
    const statusField = fields?.status || {};
    let status = statusField.name;
    const isDone = statusField.statusCategory?.key === 'done' || status?.toLowerCase() === 'done';
    status = !!status && settings?.showStatus !== false && `(${status})`;
    const valueType = settings?.valueType;

    let disp: React.ReactNode = key || 'Unknown';

    if (valueType === 'summary') {
        disp = summary;
    } else if (valueType === 'both') {
        disp = (
            <>
                {disp} - {summary}
            </>
        );
    }

    return (
        <BaseControl tag={tag} className={className} {...rest}>
            <Link
                href={getTicketUrl(key) || ''}
                title={title}
                className={`text-blue-600 hover:underline${isDone ? ' line-through' : ''} ${className}`}
                style={style}
            >
                {!!iconUrl && <Image src={iconUrl} className={iconClass} title={issueTypeName} />}
                <span title={summary}>
                    {disp} {status}
                </span>
            </Link>
        </BaseControl>
    );
}

export default IssueDisplay;
