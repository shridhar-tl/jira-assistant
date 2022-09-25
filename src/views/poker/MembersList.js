import React from 'react';
import { Avatar } from './Avatar';
import { connect } from './store';
import { Icons } from './constants';
import './MemberList.scss';

const MembersList = React.memo(({ members, votes, issueId, moderatorId }) => (
    <div className="members-list">
        {members.map(m => <Member key={m.id} data={m} vote={votes[m.id]}
            issueId={issueId} isModerator={m.id === moderatorId} />)}
    </div>
));

const Member = React.memo(function ({ data, vote: score, issueId, isModerator }) {
    const { avatarUrl, avatarId, name, [`vote_${issueId}`]: state } = data;

    return (
        <div className={`member${isModerator ? ' moderator' : ''}`}>
            <Avatar avatarUrl={avatarUrl} avatarId={avatarId} name={name} />
            <div className="member-state">
                {score === '?' && <span className="score fa fa-question" />}
                {score === '~' && <span className="score fa fa-coffee" />}
                {!isNaN(score) && <span className="score">{score}</span>}
                {!score && <span className="state-logo">{!state ? Icons.thinking : Icons.thumbsUp}</span>}
            </div>
            <span className="member-name">{name}</span>
        </div>
    );
});

export default connect(MembersList,
    ({ viewingIssueId: issueId, members, votesMap, sid, moderatorId }) => ({
        members,
        issueId,
        moderatorId,
        isModerator: sid === moderatorId,
        votes: votesMap[issueId] || {}
    }));
