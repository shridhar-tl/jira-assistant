import React from 'react';
import { NavLink } from 'react-router-dom';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle, DropdownItem, Nav, NavItem } from 'reactstrap';
import config from '../../../customize';
import { isAppBuild, isPluginBuild } from '../../../constants/build-info';
import ShareWithOthers from '../header/ShareWithOthers';

import YoutubeVideo from '../../../dialogs/YoutubeVideo';
import SkinPicker from '../SkinPicker';
import SwitchAccountOption from '../SwitchAccountMenu';
import Notifications from '../Notifications';
import JiraUpdates from '../JiraUpdates';
import LaunchWeb from '../LaunchWeb';
import BackupImporter from '../BackupImporter';
import AsideUserInfo from '../AsideUserInfo';

const showShareOption = config.features.header.shareWithOthers !== false;
const allowWebVersion = config.features.common.allowWebVersion !== false;
const showYoutubeOption = config.features.header.youtubeHelp !== false;
const showContactUs = config.modules.contactUs !== false;

function HeaderRight(props) {
    const {
        showYoutubeVideo, notifications,
        currentJiraInstance, showVersionInfo, disableJiraUpdates, disableNotification, showYoutubeHelp, userId, hideYoutube,
        onLogout,
    } = props;
    const { version, isBeta } = notifications?.updatesAvailable || {};

    return (<div className="header-right">
        <ul className="notifications">
            {!disableNotification && notifications && <Notifications notifications={notifications} />}
            <UncontrolledDropdown nav direction="down">
                <DropdownToggle nav className="notification-icon">
                    <i className="fa fa-adjust"></i>
                </DropdownToggle>
                <DropdownMenu end className="notification-menu">
                    <DropdownItem header tag="div" className="notification-title">
                        Pick theme
                    </DropdownItem>
                    <SkinPicker />
                </DropdownMenu>
            </UncontrolledDropdown>
            {showYoutubeOption && <NavItem className="d-md-down-none">
                <div className="notification-icon">
                    <span className="nav-link" onClick={showYoutubeHelp}><i className="fa-brands fa-youtube"></i></span>
                </div>
            </NavItem>}
            {showShareOption && <ShareWithOthers />}

            {showContactUs && <NavItem className="d-md-down-none">
                <div className="notification-icon">
                    <NavLink to={`/${userId}/contactus`} className="nav-link"><i className="fa fa-phone" title="Contact us"></i></NavLink>
                </div>
            </NavItem>}
        </ul>
        <span className="separator"></span>
        <Nav className="ml-auto d-none" navbar>
            {!isPluginBuild && <BackupImporter>
                {(importSettings) => <SwitchAccountOption instance={currentJiraInstance} onLogout={onLogout} onImport={importSettings} />}
            </BackupImporter>}
            {allowWebVersion && !isAppBuild && <LaunchWeb />}
            {!!version && <span className={`update-available badge badge-${isBeta ? "warning" : "success"}`}
                title={`Jira Assist ${isBeta ? 'BETA ' : ''}v${version} is now available. Click to know more.`}
                onClick={showVersionInfo}><i className="fa fa-download" /> Updates available</span>}
            {!disableJiraUpdates && <JiraUpdates />}
        </Nav>
        <AsideUserInfo />
        {showYoutubeOption && showYoutubeVideo && <YoutubeVideo onHide={hideYoutube} />}
    </div>);
}

export default HeaderRight;