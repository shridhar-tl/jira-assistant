import React from 'react';
import { NavLink } from 'react-router-dom';
import config from '../../../customize';
import { isAppBuild } from '../../../constants/build-info';
import ShareWithOthers from '../header/ShareWithOthers';

import YoutubeVideo from '../../../dialogs/YoutubeVideo';
import SkinPicker from '../SkinPicker';
import Notifications from '../Notifications';
import JiraUpdates from '../JiraUpdates';
import LaunchWeb from '../LaunchWeb';
import UserBox from './UserBox';
import { Icons } from 'src/constants/icons';

const showShareOption = config.features.header.shareWithOthers !== false;
const allowWebVersion = config.features.common.allowWebVersion !== false;
const showYoutubeOption = config.features.header.youtubeHelp !== false;
const showContactUs = config.modules.contactUs !== false;

function HeaderRight(props) {
    const {
        showYoutubeVideo, notifications,
        showVersionInfo, disableJiraUpdates, disableNotification, showYoutubeHelp, userId, hideYoutube,
        onLogout,
    } = props;
    const { version, isBeta } = notifications?.updatesAvailable || {};
    return (<>
        <ul className="ml-auto navbar-nav" navbar>
            {allowWebVersion && !isAppBuild && <LaunchWeb />}
            {!!version && <span className={`update-available badge badge-${isBeta ? "warning" : "success"}`}
                title={`Jira Assist ${isBeta ? 'BETA ' : ''}v${version} is now available. Click to know more.`}
                onClick={showVersionInfo}><i className="fa fa-download" /> Updates available</span>}
            {!disableJiraUpdates && <JiraUpdates />}
            {!disableNotification && notifications && <Notifications notifications={notifications} />}
            {showYoutubeOption && <li className="nav-item d-md-down-none">
                <span className="nav-link pointer" onClick={showYoutubeHelp} title="Click to watch YouTube help video for current page">{Icons.youtube}</span>
            </li>}
            <SkinPicker />
            {showShareOption && <ShareWithOthers />}
            {showContactUs && <li className="nav-item d-md-down-none">
                <NavLink to={`/${userId}/contactus`} className="nav-link"><i className="fa fa-phone" title="Contact us"></i></NavLink>
            </li>}
            <UserBox onLogout={onLogout} />
        </ul>
        {showYoutubeOption && showYoutubeVideo && <YoutubeVideo onHide={hideYoutube} />}
    </>
    );
}

export default HeaderRight;