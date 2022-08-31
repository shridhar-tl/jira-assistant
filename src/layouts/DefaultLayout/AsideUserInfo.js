import React, { PureComponent } from 'react';
import { inject } from '../../services';
import { AppSidebarHeader } from '@coreui/react';
import { UncontrolledDropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import SwitchAccountMenu from './SwitchAccountMenu';

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
        const { name, emailAddress, imageUrl, login } = this.state;

        return (
            <AppSidebarHeader>
                <UncontrolledDropdown direction="down">
                    <DropdownToggle tag="div" style={{ cursor: "pointer" }}>
                        <div className="user-panel">
                            <div className="pull-left image">
                                <img className="img-circle" src={imageUrl} alt="" title={`${emailAddress}(${login})`} />
                            </div>
                            <div className="pull-left info">
                                <div>{name}</div>
                                <div>{emailAddress}</div>
                            </div>
                        </div>
                    </DropdownToggle>
                    <DropdownMenu end>
                        <SwitchAccountMenu />
                    </DropdownMenu>
                </UncontrolledDropdown>
            </AppSidebarHeader>
        );
    }
}

export default AsideUserInfo;