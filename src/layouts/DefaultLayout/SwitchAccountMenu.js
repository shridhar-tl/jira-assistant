import React, { PureComponent } from 'react';
import { DropdownItem } from 'reactstrap';
import { inject } from '../../services';
import $ from "jquery";
import { AppContext } from '../../App';
import { getHostFromUrl } from "../../common/utils";
import { EventCategory } from '../../_constants';

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

    UNSAFE_componentWillMount() {
        this.$user.getUsersList().then(users => {
            this.setState({ users: users.filter(u => u.id !== this.currentUserId) });
        });
    }

    switchUser = (e) => {
        const el = $(e.currentTarget);
        const userId = parseInt(el.attr("user-id"));
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

                <DropdownItem tag="a" href="/index.html#/integrate" title="Integrate with new instance of Jira">
                    <i className="fa fa-plug"></i> Integrate</DropdownItem>
                {/*<DropdownItem><i className="fa fa-envelope-o"></i> Messages<Badge color="success">42</Badge></DropdownItem>
                        <DropdownItem><i className="fa fa-tasks"></i> Tasks<Badge color="danger">42</Badge></DropdownItem>
                        <DropdownItem><i className="fa fa-comments"></i> Comments<Badge color="warning">42</Badge></DropdownItem>*/}

                <DropdownItem header tag="div" className="text-center"><strong>Settings</strong></DropdownItem>
                <DropdownItem tag="a" href={profileUrl} target="_blank"><i className="fa fa-user"></i> Jira Profile</DropdownItem>
                {/*<DropdownItem><i className="fa fa-wrench"></i> Settings</DropdownItem>*/}

                {/*<DropdownItem divider />*/}
                <DropdownItem onClick={this.props.onLogout}><i className="fa fa-lock"></i> Logout</DropdownItem>
            </>
        );
    }
}

export default SwitchAccountMenu;