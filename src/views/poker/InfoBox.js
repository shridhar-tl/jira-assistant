import React from 'react';
import { connect } from './store';
import { Image } from '../../controls';
import './InfoBox.scss';

function InfoBox() {
    return (<div className="info-box">
        <VoteInfo />
        <IssueDetail />
    </div>);
}

export default InfoBox;

const VoteInfo = connect(function ({ vote: { average, finalScore } }) {
    return (<div className="est-info">
        <div className="block">
            <span className="label">Final score:</span>
            <span className="value">{finalScore}</span>
        </div>
        <div className="block">
            <span className="label">Average:</span>
            <span className="value">{average}</span>
        </div>
        <div className="block">
            <span className="label">Status:</span>
            <span className="value fa fa-clock-o" />
        </div>
    </div>);
}, ({ viewingIssueId: vID, votesMap
}) => ({ vote: votesMap[vID] || { average: 'N/A', finalScore: 'N/A' } }));

const IssueDetail = connect(React.memo(function ({ issue: { key, icon, url, summary } = {} }) {
    return (<div className="issue-details">
        <Image src={icon} />
        <span className="issue-key">
            <a href={url} target="_blank" rel="noreferrer"> {key}</a>
        </span>
        {!!summary && <span className="issue-summary"> - {summary}</span>}
    </div>);
}), ({ issuesMap,
    viewingIssueId: vID }) => ({ issue: issuesMap[vID] || {} }));

