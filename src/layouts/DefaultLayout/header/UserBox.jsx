import React from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { inject } from 'src/services';
import { getHostFromUrl } from 'src/common/utils';
import BackupImporter from '../BackupImporter';
import ExportSettings from '../ExportSettings';
import './UserBox.scss';
import { Link } from 'src/controls';
import { AppContext } from 'src/common/context';
import { EventCategory } from 'src/constants/settings';
import { isWebBuild } from 'src/constants/build-info';

function UserBox({ onLogout }) {
    const op = React.useRef();
    const [users, setUsers] = React.useState([]);

    React.useEffect(() => { getUsers().then(setUsers); }, []);

    const [showSettingPopup, setShowSettings] = React.useState(false);
    const showSettings = React.useCallback(() => setShowSettings(true), [setShowSettings]);
    const hideSettings = React.useCallback(() => setShowSettings(false), [setShowSettings]);

    const user = React.useMemo(getUserProfileDetails, []);
    const { name, instanceUrl, imageUrl } = user;

    const showOptions = React.useCallback(e => {
        op.current.show(e);
    }, []);

    return (<>
        <li className="user-box">
            <button className="box" onClick={showOptions}>
                <div className="profile-info">
                    <span className="name">{name}</span>
                    <span className="role">{instanceUrl}</span>
                </div>
                <figure className="profile-picture">
                    <img src={imageUrl} alt={name} className="rounded-circle" />
                </figure>
            </button>
        </li>

        {showSettingPopup && <ExportSettings onDone={hideSettings} onHide={hideSettings} />}

        <OverlayPanel ref={op} className="user-options">
            <BackupImporter>
                {(importSettings) => <ProfileOptions
                    users={users}
                    user={user}
                    showSettings={showSettings}
                    importSettings={importSettings}
                    onLogout={onLogout}
                />}
            </BackupImporter>
        </OverlayPanel>
    </>);
}

export default UserBox;

function ProfileOptions({ user, users, showSettings, importSettings, onLogout }) {
    const context = React.useContext(AppContext);

    const switchUser = React.useCallback((e) => {
        const userId = parseInt(e.currentTarget.attributes['data-user-id'].value);
        context.switchUser(userId);
        const { $analytics } = inject('AnalyticsService');
        $analytics.trackEvent("Instance switched", EventCategory.Instance);
    }, [context]);

    const { name, instanceUrl, image_x48, imageUrl, profileUrl } = user;

    return (<div className="options-container">
        <div className="option-block blue-bg">
            <div className="title">Account</div>
            <div className="user-box">
                <span className="box">
                    <div className="profile-info">
                        <span className="name">{name}</span>
                        <span className="role">{instanceUrl}</span>
                    </div>
                    <figure className="profile-picture">
                        <img src={image_x48 || imageUrl} alt={name} className="rounded-circle" />
                    </figure>
                </span>
            </div>
            <Link href={profileUrl} className="menu"><span className="icon fa fa-user" /><span className="text">View Jira profile</span></Link>
        </div>
        <div className="option-block">
            <div className="title">Switch Instance</div>
            {users && users.length > 0 && users.map(u => (
                <button className="menu" key={u.id} data-user-id={u.id} onClick={switchUser} title={u.email}>
                    <span className="icon fa fa-external-link" />
                    <span className="text">{getHostFromUrl(u.jiraUrl)} ({u.userId})</span>
                </button>))}

            <a className="menu" href={isWebBuild ? '/integrate' : '/index.html#/integrate'}>
                <span className="icon fa fa-plug" /><span className="text">Integrate with new instance</span>
            </a>
        </div>
        <div className="option-block">
            <div className="title">Settings</div>
            <button className="menu" onClick={importSettings}><span className="icon fa fa-upload" /><span className="text">Import Settings</span></button>
            <button className="menu" onClick={showSettings}><span className="icon fa fa-download" /><span className="text">Export Settings</span></button>
        </div>
        <div className="option-block">
            <button className="menu" onClick={onLogout}><span className="icon fa fa-lock" /><span>Logout</span></button>
        </div>
    </div>);
}

function getUserProfileDetails() {
    const { $session, $userutils, $utils } = inject('SessionService', 'UserUtilsService', 'UtilsService');
    const user = $session.CurrentUser;
    const { jiraUrl, jiraUser: { displayName, emailAddress, key, avatarUrls } = {} } = user;
    const profileUrl = $userutils.getProfileUrl();

    return {
        name: $utils.cut(displayName, 27),
        instanceUrl: $utils.cut(getHostFromUrl(jiraUrl), 32),
        login: key,
        emailAddress,
        profileUrl,
        imageUrl: (avatarUrls || {})["24x24"],
        image_x48: (avatarUrls || {})["48x48"]
    };
}

async function getUsers() {
    const { $session, $user } = inject('SessionService', 'UserService');
    const currentUserId = $session.CurrentUser.userId;
    const users = await $user.getUsersList();

    return users.filter(u => u.id !== currentUserId);
}