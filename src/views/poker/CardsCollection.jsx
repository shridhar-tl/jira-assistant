import React from 'react';
import classNames from 'classnames';
import { Dock } from 'primereact/dock';
import { connect } from './store';
import { submitVote } from './actions';
import { scoresList } from './constants';

const CardsCollection = function ({ allowVoting, min = 0, max = 89, value, showHalfScore, scoreType, submitVote }) {
    let storypoints = scoresList[scoreType];

    if (!storypoints) {
        return null;
    }

    if (scoreType < 3) {
        storypoints = storypoints.filter(p => (p >= min && p <= max) && (showHalfScore || p !== 0.5));
    }

    const cards = storypoints.map((p, i) => ({
        icon: <Card key={p} className={`card-color-${(i + (i % 2)) / 2}`}
            value={p} selected={value === p}
            submitVote={submitVote} allowVoting={allowVoting} />
    }));
    cards.push({
        label: 'Not Sure',
        icon: <Card className="card-other icon-red" icon="fa fa-question" value="?"
            selected={value === '?'} submitVote={submitVote} allowVoting={allowVoting} />
    }, {
        label: 'Break',
        icon: <Card className="card-other icon-purple" icon="fa fa-coffee" value="~"
            selected={value === '~'} submitVote={submitVote} allowVoting={allowVoting} />
    }
    );

    return (
        <div className={`cards-list${allowVoting ? '' : ' disabled'}`}>
            <Dock magnification={allowVoting} model={cards} position="bottom" />
        </div>
    );
};

const Card = React.memo(function ({ className, value, icon, selected, allowVoting, submitVote }) {
    return (<div className={classNames("card", className, { selected, 'card-icon': !!icon })}
        onClick={(allowVoting || undefined) && (() => submitVote(value))}>
        {icon && <div className="card-content">
            <div className="card-val-icon"><span className={icon} /></div>
        </div>}
        {!icon && <div className="card-content">
            <div className="card-val-tl">{value}</div>
            <div className="card-val-m">{value}</div>
            <div className="card-val-br">{value}</div>
        </div>}
    </div>);
});

export default connect(React.memo(CardsCollection),
    ({ votesMap, sid, currentIssueId, viewingIssueId, maxPoints, scoreType, showHalfScore }) => ({
        value: votesMap[viewingIssueId]?.[sid],
        allowVoting: currentIssueId && currentIssueId === viewingIssueId,
        max: maxPoints, scoreType, showHalfScore
    }),
    { submitVote });