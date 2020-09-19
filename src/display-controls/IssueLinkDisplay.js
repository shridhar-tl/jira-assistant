import React from 'react';
import { inject } from '../services/injector-service';
import BaseControl from './BaseControl';
import IssueDisplay from './IssueDisplay';

class IssueLinkDisplay extends BaseControl {
    constructor() {
        super();
        inject(this, 'UserUtilsService');
    }

    renderControl() {
        const { value } = this.props;

        if (!value?.length) { return null; }
        const getTicketUrl = this.$userutils.getTicketUrl;

        return (<ul className="tags">
            {value.map((a, i) => {
                const type = a.type;
                const linkType = type && (a.inwardIssue ? type.inward : type.outward);

                return (<li key={i}>
                    <IssueDisplay tag="span" issue={type ? (a.inwardIssue || a.outwardIssue) : a}
                        title={linkType}
                        getTicketUrl={getTicketUrl}
                        className="badge badge-pill skin-bg-font" />
                </li>);
            })}
        </ul>);
    }
}

export default IssueLinkDisplay;
