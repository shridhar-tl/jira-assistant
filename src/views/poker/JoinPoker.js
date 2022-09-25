import React from 'react';
import { WebSiteUrl } from '../../constants/urls';
import { AppVersionNo } from '../../constants/common';
import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';
import './JoinPoker.scss';

function JoinPoker() {
    return (
        <div className="poker-start">
            <div className="ja-header flex justify-content-center">
                <h1><img src="/assets/icon_48.png" alt="" /> Jira Assistant - [Planning Poker]</h1>
            </div>
            <div className="row">
                <div className="col-lg-6"><CreateRoom /></div>
                <div className="col-lg-6"><JoinRoom /></div>
            </div>
            <div className="footer">
                <span className="copyright flex justify-content-center">© 2016-{new Date().getFullYear()} &nbsp;
                    <a href={WebSiteUrl} target="_blank" rel="noreferrer">Jira Assistant </a>&nbsp;v{AppVersionNo}</span>
                <p className="flex justify-content-center">The privacy policy of Jira Assistant is not completely applicable for Poker.
                    The details you provide here like your name, jira issue key, estimates, summary, etc., would be temporarily cached
                    in JA server to serve across all the members. However, once you end the session, all the details would automatically
                    be cleared from cache. By proceeding with using the poker, you agree to all the terms and condiations.</p>
            </div>
        </div>
    );
}

export default JoinPoker;
