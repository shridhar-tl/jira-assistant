import React from 'react';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { inject } from '../../services';
import { SwitchAccountMenu } from './SwitchAccountMenu';
import './AsideUserInfo.scss';

function AsideUserInfo() {
    const state = React.useMemo(() => {
        const { $session } = inject("SessionService");
        const { jiraUser: { displayName, emailAddress, key, avatarUrls } = {} } = $session.CurrentUser;

        return {
            name: displayName,
            login: key,
            emailAddress,
            imageUrl: (avatarUrls || {})["24x24"]
        };
    }, []);

    const { name, emailAddress, imageUrl } = state;

    return (<UncontrolledDropdown id="userbox" tag="div" className="userbox" direction="down">
        <DropdownToggle tag="a" style={{ cursor: "pointer" }}>
            <figure className="profile-picture">
                <img src={imageUrl} alt={name} className="rounded-circle" />
            </figure>
            <div className="profile-info">
                <span className="name">{name}</span>
                <span className="role">{emailAddress}</span>
            </div>
            <i className="fa custom-caret"></i>
        </DropdownToggle>
        <DropdownMenu>
            <SwitchAccountMenu />
        </DropdownMenu>
    </UncontrolledDropdown>);
}

export default AsideUserInfo;