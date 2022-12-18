import React from 'react';
import { connect } from './store';
import { Image } from '../../controls';
import './InfoBox.scss';
import Link from '../../controls/Link';

function InfoBox() {
    return (<div className="info-box">
        <VoteInfo />
        <IssueDetail />
    </div>);
}

export default InfoBox;

const VoteInfo = connect(function ({ vote: { reveal, average, finalScore } }) {
    return (<div className="est-info">
        <div className="block">
            <span className="label">Final score:</span>
            <span className="value">{reveal ? finalScore : 'N/A'}</span>
        </div>
        <div className="block">
            <span className="label">Average:</span>
            <span className="value">{reveal ? average : 'N/A'}</span>
        </div>
        <div className="block">
            <span className="label">Status:</span>
            <span className="value fa fa-clock-o" />
        </div>
    </div>);
}, ({ viewingIssueId: vID, votesMap
}) => ({ vote: votesMap[vID] || {} }));

const IssueDetail = connect(React.memo(function ({ issue: { key, icon, url, summary } = {} }) {
    return (<div className="issue-details">
        <Image src={icon} />
        <span className="issue-key">
            <Link href={url}> {key}</Link>
        </span>
        {!!summary && <span className="issue-summary"> - {summary}</span>}
    </div>);
}), ({ issuesMap,
    viewingIssueId: vID }) => ({ issue: issuesMap[vID] || {} }));

