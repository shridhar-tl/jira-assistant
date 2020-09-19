import React from 'react';
import { inject } from '../services/injector-service';
import BaseControl from './BaseControl';
import { Image } from '../controls';

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

    renderControl() {
        const { value, issue = value, title, className } = this.props;

        if (!issue) { return null; }

        const key = issue.key;
        const fields = issue.fields;
        const issueType = fields?.issuetype;
        const summary = fields?.summary;
        const iconUrl = issueType?.iconUrl;
        const issueTypeName = issueType?.name;
        const status = fields?.status?.name;

        return (
            <a href={this.getTicketUrl(key)} title={title} rel="noopener noreferrer"
                className={`link ${className}`} target="_blank">
                {!!iconUrl && <Image src={iconUrl} title={issueTypeName} />}
                <span title={summary}>{key || 'Unknown'} ({status})</span>
            </a>
        );
    }
}

export default IssueDisplay;
