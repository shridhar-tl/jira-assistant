import React, { PureComponent } from 'react';
import { Button, AutoComplete, SelectBox } from '../../controls';
import { inject } from '../../services';
import { getUserName } from '../../common/utils';
import UserRow from './UserRow';
import GroupNameComponent from './GroupNameComponent';

class GroupRow extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService");
        const { group: { users = [], timeZone } } = props;
        this.state = { selectedUsers: [], users, timeZone: timeZone || "" };
    }

    usersSelected = (users) => this.setState({ selectedUsers: users, users: this.props.group.users });
    clearSelection = () => this.usersSelected([]);

    searchUsers = (query) => this.$jira.searchUsers(query);

    addUsersToGroup() {
        const {
            props: { group },
            state: { selectedUsers }
        } = this;
        const { users } = group;

        const existingUsers = users.map(u => getUserName(u, true));
        selectedUsers.removeAll(u => existingUsers.indexOf(getUserName(u, true)) > -1);
        users.addRange(selectedUsers);
        group.users = users.orderBy(u => u.displayName);
        this.clearSelection();
    }

    removeUser = (index) => {
        const { group } = this.props;
        let { users } = group;
        users.splice(index, 1);
        users = [...users];
        group.users = users;
        this.setState({ users });
    };

    usernameEntered = (username) => {
        let { selectedUsers } = this.state;

        if (!selectedUsers || !username || selectedUsers.some(u => getUserName(u, true) === username.toLowerCase())) { return; }

        this.$jira.getUserDetails(username).then((user) => {
            selectedUsers = [...selectedUsers];
            selectedUsers.push(user);
            this.setState({ selectedUsers });
        }, () => { /* Nothing to do */ });
    };

    onRemove = () => {
        this.props.onRemove(this.props.index);
    };

    setTimezone = (timeZone) => {
        this.props.group.timeZone = timeZone;
        this.setState({ timeZone });
    };

    render() {
        const {
            onRemove, setTimezone,

            props: { group, groupTimezones, userTimezones, hasGroupWithName },
            state: { selectedUsers, users, timeZone }
        } = this;

        return <>
            <tr>
                <td>
                    <GroupNameComponent group={group} hasGroupWithName={hasGroupWithName} />
                </td>
                {!group.isJiraGroup && <td colSpan={2}>
                    <AutoComplete value={selectedUsers} onChange={this.usersSelected}
                        displayField="displayName" multiple={true} minLength={2} forceselection={true}
                        placeholder="Add one or more users" onCustomValue={this.usernameEntered}
                        dataset={this.searchUsers} style={{ 'width': '80%' }} />
                    <Button type="danger" icon="fa fa-close" onClick={this.clearSelection} />
                    <Button type="success" icon="fa fa-user-plus" onClick={() => this.addUsersToGroup(group)} />
                </td>}
                {!!group.isJiraGroup && <td colSpan={2}>
                    (Users pulled from Jira)
                </td>}
                <td>
                    <SelectBox dataset={groupTimezones} displayField="label" valueField="value" value={timeZone || ''}
                        onChange={setTimezone} className="width-perc-100" filter={true} /></td>
                <td></td>
                <td><Button type="danger" icon="fa fa-trash" label={group.isJiraGroup ? "Remove Group" : "Delete group"} onClick={onRemove} /></td>
            </tr>

            {(!users || users.length === 0) && <tr><td colSpan={5}>No users were available under this group</td></tr >}

            {users && users.map((user, i) => <UserRow key={getUserName(user)} user={user} index={i} userTimezones={userTimezones} onRemove={this.removeUser} />)}
        </>;
    }
}

export default GroupRow;