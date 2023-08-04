/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { inject } from 'src/services';
import { getHostFromUrl } from 'src/common/utils';
import './UserBox.scss';

function UserBox() {
    const { name, instanceUrl, imageUrl } = React.useMemo(() => {
        const { $session, $utils } = inject('SessionService', 'UtilsService');
        const user = $session.CurrentUser;
        const { jiraUrl, jiraUser: { displayName, emailAddress, key, avatarUrls } = {} } = user;

        return {
            name: $utils.cut(displayName, 27),
            instanceUrl: $utils.cut(getHostFromUrl(jiraUrl), 32),
            login: key,
            emailAddress,
            imageUrl: (avatarUrls || {})["24x24"]
        };
    }, []);

    return (
        <div className="user-box">
            <a className="box">
                <figure className="profile-picture">
                    <img src={imageUrl} alt={name} className="rounded-circle" />
                </figure>
                <div className="profile-info">
                    <span className="name">{name}</span>
                    <span className="role">{instanceUrl}</span>
                </div>
                <span className="fa custom-caret" />
            </a>
        </div>
    );
}

export default UserBox;