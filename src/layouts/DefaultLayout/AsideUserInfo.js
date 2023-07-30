import React from 'react';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import Avatar, { AvatarItem } from '@atlaskit/avatar';
import { inject } from '../../services';
import { SwitchAccountMenu } from './SwitchAccountMenu';

function AsideUserInfo() {
    const { name, emailAddress, imageUrl } = React.useMemo(() => {
        const { $session } = inject("SessionService");
        const { jiraUser: { displayName, emailAddress, key, avatarUrls } = {} } = $session.CurrentUser;

        return {
            name: displayName,
            login: key,
            emailAddress,
            imageUrl: (avatarUrls || {})["24x24"]
        };
    }, []);

    return (
        <UncontrolledDropdown direction="down">
            <DropdownToggle tag="div" style={{ cursor: "pointer" }}>
                <AvatarItem primaryText={name} secondaryText={emailAddress}
                    avatar={<Avatar src={imageUrl} name={name} presence="" />}
                />
            </DropdownToggle>
            <DropdownMenu end>
                <SwitchAccountMenu />
            </DropdownMenu>
        </UncontrolledDropdown>
    );
}

export default AsideUserInfo;