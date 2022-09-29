import React from 'react';
import { Dock } from 'primereact/dock';
import { Tooltip } from 'primereact/tooltip';
import { connect } from './store';
import { revealVote, startEstimation, restartEstimation, exitRoom, copyUrl } from './actions';
import { Dialog } from '../../dialogs/CommonDialog';

const ControlBox = function ({
    isModerator, estimating, revealVote,
    startEstimation, restartEstimation, copyUrl, exitRoom }) {
    const controls = [
        isModerator && {
            label: 'Reveal scores', command: revealVote,
            icon: () => <div className="control-icon icon-reveal"><span className="fa fa-eye" /></div>
        },
        isModerator && !estimating && {
            label: 'Start estimating', command: startEstimation,
            icon: () => <div className="control-icon icon-start"><span className="fa fa-play" /></div>
        },
        isModerator && estimating && {
            label: 'Restart estimation', command: restartEstimation,
            icon: () => <div className="control-icon icon-reset"><span className="fa fa-refresh" /></div>
        },
        {
            label: 'Copy link to invite others', command: copyUrl,
            icon: () => <div className="control-icon icon-invite"><span className="fa fa-link" /></div>
        },
        {
            label: isModerator ? 'Close this room' : 'Exit', command: () => Dialog.yesNo(isModerator ?
                'Are you sure to close this room and clear all the data?'
                : 'Are you sure to leave this room?', 'Confirm exit').then(exitRoom),
            icon: () => <div className="control-icon icon-exit"><span className="fa fa-sign-out" /></div>
        },
    ].filter(Boolean);

    return (<div className="control-box">
        <Tooltip className="help-tooltip" target=".p-dock-action" my="center+15 left-15" at="top left" />
        <Dock model={controls} position="right" />
    </div>);
};

export default connect(ControlBox,
    ({ roomName, sid, moderatorId, currentIssueId, viewingIssueId: issueId }) => ({
        roomName, issueId,
        estimating: issueId === currentIssueId,
        isModerator: sid === moderatorId
    }), { revealVote, startEstimation, restartEstimation, copyUrl, exitRoom });