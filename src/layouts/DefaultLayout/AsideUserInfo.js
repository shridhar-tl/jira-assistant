import React, { PureComponent } from 'react';
import { inject } from '../../services';
import { AppSidebarHeader } from '@coreui/react';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import $ from "jquery";
import { AppContext } from '../../App';

class AsideUserInfo extends PureComponent {
    static contextType = AppContext;

    constructor(props) {
        super(props);
        inject(this, "SessionService", "UserService", "UserUtilsService");

        const { jiraUser: { displayName, emailAddress, key, avatarUrls } } = this.$session.CurrentUser;
        this.state = {
            name: displayName,
            login: key,
            profileUrl: this.$userutils.getProfileUrl(),
            emailAddress,
            imageUrl: avatarUrls["24x24"]
        };
    }

    UNSAFE_componentWillMount() {
        this.$user.getUsersList().then(users => this.setState({ users }));
    }

    getJiraServerName(url) {
        return new URL(url).host;
    }

    switchUser = (e) => {
        const el = $(e.currentTarget);
        const userId = parseInt(el.attr("user-id"));
        this.context.switchUser(userId);
    }

    render() {
        const { name, emailAddress, imageUrl, login, users, profileUrl } = this.state;

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
                    <DropdownMenu right>
                        {users && users.length > 0 && <>
                            <DropdownItem header tag="div" className="text-center"><strong>Switch Accounts</strong></DropdownItem>

                            {users.map(u => <DropdownItem key={u.id} tag="span" user-id={u.id} onClick={this.switchUser} title={u.email}>
                                <i className="fa fa-external-link icon-extl" />
                                <div className="inline">
                                    <div>{this.getJiraServerName(u.jiraUrl)}</div>
                                    <div>({u.userId})</div>
                                </div>
                            </DropdownItem>)}

                            <DropdownItem tag="a" href="/index.html#/integrate" title="Integrate with new instance of Jira"><i className="fa fa-plug"></i> Integrate</DropdownItem>
                            {/*<DropdownItem><i className="fa fa-envelope-o"></i> Messages<Badge color="success">42</Badge></DropdownItem>
                            <DropdownItem><i className="fa fa-tasks"></i> Tasks<Badge color="danger">42</Badge></DropdownItem>
                            <DropdownItem><i className="fa fa-comments"></i> Comments<Badge color="warning">42</Badge></DropdownItem>*/}
                        </>
                        }

                        <DropdownItem header tag="div" className="text-center"><strong>Settings</strong></DropdownItem>
                        <DropdownItem tag="a" href={profileUrl} target="_blank"><i className="fa fa-user"></i> Profile</DropdownItem>
                        {/*<DropdownItem><i className="fa fa-wrench"></i> Settings</DropdownItem>*/}

                        {/*<DropdownItem divider />*/}
                        <DropdownItem onClick={e => this.props.onLogout(e)}><i className="fa fa-lock"></i> Logout</DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
            </AppSidebarHeader>
        );
    }
}

export default AsideUserInfo;