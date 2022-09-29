import React, { PureComponent } from 'react';
import { DropdownItem, DropdownMenu, DropdownToggle, Nav, UncontrolledDropdown } from 'reactstrap';
import { inject } from '../../services';
import { getHostFromUrl } from "../../common/utils";
import { AppContext } from '../../common/context';
import { EventCategory } from '../../constants/settings';
import ExportSettings from './ExportSettings';
import { isWebBuild } from '../../constants/build-info';

class SwitchAccountMenu extends PureComponent {
    static contextType = AppContext;

    constructor(props) {
        super(props);
        inject(this, "SessionService", "UserService", "UserUtilsService", "AnalyticsService");
        this.currentUserId = this.$session.CurrentUser.userId;
        this.state = {
            profileUrl: this.$userutils.getProfileUrl()
        };
    }

    async componentDidMount() {
        const users = await this.$user.getUsersList();
        this.setState({ users: users.filter(u => u.id !== this.currentUserId) });
    }

    switchUser = (e) => {
        const userId = parseInt(e.currentTarget.attributes['user-id'].value);
        this.context.switchUser(userId);
        this.$analytics.trackEvent("Instance switched", EventCategory.Instance);
    };

    render() {
        const { users, profileUrl } = this.state;

        return (
            <>
                <DropdownItem header tag="div" className="text-center"><strong>Switch Instance</strong></DropdownItem>
                {users && users.length > 0 && users.map(u => <DropdownItem key={u.id} tag="span" user-id={u.id} onClick={this.switchUser} title={u.email}>
                    <i className="fa fa-external-link icon-extl" />
                    <div className="inline pointer">
                        <div>{getHostFromUrl(u.jiraUrl)}</div>
                        <div>({u.userId})</div>
                    </div>
                </DropdownItem>)}

                <DropdownItem tag="a" href={isWebBuild ? '/integrate' : '/index.html#/integrate'} title="Integrate with new instance of Jira">
                    <i className="fa fa-plug"></i> Integrate</DropdownItem>
                {/*<DropdownItem><i className="fa fa-envelope-o"></i> Messages<Badge color="success">42</Badge></DropdownItem>
                        <DropdownItem><i className="fa fa-tasks"></i> Tasks<Badge color="danger">42</Badge></DropdownItem>
                        <DropdownItem><i className="fa fa-comments"></i> Comments<Badge color="warning">42</Badge></DropdownItem>*/}

                <DropdownItem header tag="div" className="text-center"><strong>Settings</strong></DropdownItem>
                <DropdownItem tag="span" onClick={this.props.showSettings} className="pointer"><i className="fa fa-download"></i> Export Settings</DropdownItem>
                <DropdownItem tag="span" className="pointer" onClick={this.props.onImport}><i className="fa fa-upload"></i> Import Settings</DropdownItem>
                <DropdownItem tag="a" href={profileUrl} target="_blank"><i className="fa fa-user"></i> Jira Profile</DropdownItem>
                {/*<DropdownItem><i className="fa fa-wrench"></i> Settings</DropdownItem>*/}

                {/*<DropdownItem divider />*/}
                <DropdownItem onClick={this.props.onLogout}><i className="fa fa-lock"></i> Logout</DropdownItem>
            </>
        );
    }
}

class SwitchAccountOption extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }

    showSettings = () => this.setState({ showSettingPopup: true });
    hideSettings = () => this.setState({ showSettingPopup: true });

    render() {
        const { showSettingPopup } = this.state;

        return (<>
            <Nav className="d-md-down-none margin-r-5" navbar>
                <UncontrolledDropdown nav direction="down">
                    <DropdownToggle nav>
                        <span className="nav-link pointer" title={`Currently connected to ${this.props.instance}. Click to see more options.`}> <span className="fa fa-exchange" /> <strong>{this.props.instance}</strong></span>
                    </DropdownToggle>
                    <DropdownMenu left>
                        <SwitchAccountMenu onLogout={this.props.onLogout} onImport={this.props.onImport} showSettings={this.showSettings} />
                    </DropdownMenu>
                </UncontrolledDropdown>
            </Nav>
            {showSettingPopup && <ExportSettings onDone={this.hideSettings} onHide={this.hideSettings} />}
        </>
        );
    }
}

export default SwitchAccountOption;
