import React, { PureComponent } from 'react';
import { inject } from '../../services';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import Avatar, { AvatarItem } from '@atlaskit/avatar';
import { SwitchAccountMenu } from './SwitchAccountMenu';

class AsideUserInfo extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "SessionService");

        const { jiraUser: { displayName, emailAddress, key, avatarUrls } = {} } = this.$session.CurrentUser;
        this.state = {
            name: displayName,
            login: key,
            emailAddress,
            imageUrl: (avatarUrls || {})["24x24"]
        };
    }

    render() {
        const { name, emailAddress, imageUrl } = this.state;

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
}

export default AsideUserInfo;