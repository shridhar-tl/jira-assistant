import React, { PureComponent } from 'react';
import { ScrollableTable, TBody, THead, NoDataRow } from '../ScrollableTable';
import moment from 'moment';
import { inject } from '../../services';
import { EventCategory } from '../../_constants';
import GroupRow from './GroupRow';
import GroupFooter from './GroupFooter';

class UserGroup extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "SessionService", "MessageService", "UserGroupService", "JiraService", "AnalyticsService");
        const { groups } = props;

        const timezones = moment.tz.names().map(t => { return { label: t, value: t }; });
        this.groupTimezones = [{ label: 'My local time zone', value: '' }].union([timezones]);
        this.userTimezones = [{ label: 'My local time zone', value: '' }, { label: "Use group's time zone", value: 'GRP_TZ' }].union([timezones]);
        this.state = { groups };
    }

    UNSAFE_componentWillMount() {
        if (!this.state.groups) {
            this.$usergroup.getUserGroups().then(groups => this.setState({ groups }));
        }
    }

    addNewGroup = async (groupName, groupId) => {
        groupName = groupName.trim();
        if (!groupName) {
            return;
        }
        const { groups } = this.state;

        if (this.hasGroupWithName(groupName)) {
            this.$message.warning(`The group with the name '${groupName}' already exists!`, "Group already exists");
            return false;
        }
        else {
            const newGroup = { name: groupName, timeZone: '', isJiraGroup: !!groupId, id: groupId };
            await this.$usergroup.fillJiraGroupMembers([newGroup]);
            this.setState({ groups: groups.concat(newGroup) });
            return true;
        }
    };

    hasGroupWithName = (groupName, group) => {
        groupName = groupName.toLowerCase();
        return this.state.groups.some(g => g.name.toLowerCase() === groupName && g !== group);
    };

    deleteGroup = (index) => {
        let { groups } = this.state;
        groups.splice(index, 1);
        groups = [...groups];
        this.setState({ groups });
    };

    saveGroups = () => {
        this.setState({ saveInProg: true });
        //this.state.groups.forEach(g => delete g.editMode);
        this.$usergroup.saveUserGroups(this.state.groups).then(u => {
            this.setState({ saveInProg: false });
            this.$analytics.trackEvent("User groups saved", EventCategory.UserActions);
            this.$message.success("Changes saved successfully!", "Group saved");
        });
    };

    done = () => {
        if (this.props.onDone) {
            this.$analytics.trackEvent("User groups modified", EventCategory.UserActions);
            this.props.onDone(this.state.groups);
        }
    };

    render() {
        const {
            userTimezones,
            props: { isPlugged },
            state: { groups }
        } = this;

        return (<ScrollableTable dataset={groups}>
            <caption>User groups</caption>
            <THead>
                <tr>
                    <th style={{ minWidth: 215 }}>Group / User Name</th>
                    <th>User Email</th>
                    <th>User Login</th>
                    <th>Timezone</th>
                    <th>Cost per hour</th>
                    <th style={{ width: 150 }}>Options</th>
                </tr>
            </THead>
            <TBody>
                {(group, grpIdx) => <GroupRow key={group.name} group={group} index={grpIdx} hasGroupWithName={this.hasGroupWithName}
                    groupTimezones={this.groupTimezones} userTimezones={userTimezones}
                    onRemove={this.deleteGroup} />}
            </TBody>
            <NoDataRow span={5}>No groups available</NoDataRow>
            <GroupFooter isPlugged={isPlugged} saveGroups={this.saveGroups} onDone={this.done} addNewGroup={this.addNewGroup} />
        </ScrollableTable>
        );
    }
}

export default UserGroup;
