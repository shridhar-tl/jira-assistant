import React from 'react';
import { inject } from '../services/injector-service';
import BaseControl from './BaseControl';
import { Image } from '../controls';
import Link from '../controls/Link';

class IssueDisplay extends BaseControl {
    constructor(props) {
        super();

        if (props.getTicketUrl) {
            this.getTicketUrl = props.getTicketUrl;
        } else {
            inject(this, 'UserUtilsService');
            this.getTicketUrl = this.$userutils.getTicketUrl;
        }
    }

    renderControl(badge) {
        const { value, issue = value, title, className, settings } = this.props;

        if (!issue) { return badge; }

        if (typeof issue === 'string') {
            return (
                <Link href={this.getTicketUrl(issue)} className={`link ${className}`}>
                    {issue} {badge}
                </Link>
            );
        }

        const key = issue.key;
        const fields = issue.fields;
        const issueType = fields?.issuetype;
        const summary = fields?.summary;
        const iconUrl = issueType?.iconUrl;
        const issueTypeName = issueType?.name;
        let status = fields?.status?.name;
        status = !!status && settings?.showStatus !== false && `(${status})`;

        const valueType = settings?.valueType;

        let disp = key || 'Unknown';

        if (valueType === 'summary') {
            disp = summary;
        }
        else if (valueType === 'both') {
            disp = (<>{disp} - {summary}</>);
        }

        return (
            <Link href={this.getTicketUrl(key)} title={title}
                className={`link ${className}`}>
                {!!iconUrl && <Image src={iconUrl} title={issueTypeName} />}
                <span title={summary}>{disp} {status}</span>
                {badge}
            </Link>
        );
    }
}

export default IssueDisplay;
