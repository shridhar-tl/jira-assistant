import React, { PureComponent } from 'react';
import { TextBox, Button, AutoComplete, SelectBox } from '../controls';
import { ScrollableTable, TBody, THead, NoDataRow } from './ScrollableTable';
import moment from 'moment';
import { inject } from '../services';
import { EventCategory } from '../_constants';
import { getUserName } from '../common/utils';

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

    addNewGroup = (groupName) => {
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
            this.setState({ groups: groups.concat({ name: groupName, timeZone: '', users: [] }) });
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
                <td colSpan={2}>
                    <AutoComplete value={selectedUsers} onChange={this.usersSelected}
                        displayField="displayName" multiple={true} minLength={2} forceselection={true}
                        placeholder="Add one or more users" onCustomValue={this.usernameEntered}
                        dataset={this.searchUsers} style={{ 'width': '80%' }} />
                    <Button type="danger" icon="fa fa-close" onClick={this.clearSelection} />
                    <Button type="success" icon="fa fa-user-plus" onClick={() => this.addUsersToGroup(group)} />
                </td>
                <td>
                    <SelectBox dataset={groupTimezones} displayField="label" valueField="value" value={timeZone || ''}
                        onChange={setTimezone} className="width-perc-100" filter={true} /></td>
                <td></td>
                <td><Button type="danger" icon="fa fa-trash" label="Delete group" onClick={onRemove} /></td>
            </tr>

            {(!users || users.length === 0) && <tr><td colSpan={5}>No users were available under this group</td></tr >}

            {users && users.map((user, i) => <UserRow key={getUserName(user)} user={user} index={i} userTimezones={userTimezones} onRemove={this.removeUser} />)}
        </>;
    }
}

class UserRow extends PureComponent {
    constructor(props) {
        super(props);
        const { user: { timeZone, costPerHour = 0 } } = props;
        this.state = { timeZone: timeZone || "", costPerHour };
    }

    timeZoneChanged = (timeZone) => {
        const { user } = this.props;
        user.timeZone = timeZone;
        this.setState({ timeZone });
    };

    costChanged = (costPerHour) => {
        const { user } = this.props;
        user.costPerHour = costPerHour || 0;
        this.setState({ costPerHour });
    };

    onRemove = () => {
        this.props.onRemove(this.props.index);
    };

    render() {
        const {
            timeZoneChanged, costChanged, onRemove,
            props: { user, userTimezones }
        } = this;

        return (<tr>
            <td>
                <div className="group-user">
                    <img src={user.avatarUrls['32x32'] || user.avatarUrls['48x48']} alt="" height={32} width={32} className="pull-left" />
                    <a href={user.self} target="_blank" rel="noopener noreferrer" className="link">{user.displayName}</a>
                </div>
            </td>
            <td>{user.emailAddress}</td>
            <td>{getUserName(user)}</td>
            <td><SelectBox dataset={userTimezones} value={user.timeZone} displayField="label" valueField="value"
                onChange={timeZoneChanged} className="width-perc-100" filter={true} /></td>
            <td><TextBox value={user.costPerHour} onChange={costChanged} keyfilter="num" /></td>
            <td><Button type="danger" icon="fa fa-times" onClick={onRemove} style={{ marginTop: 0 }} /></td>
        </tr>
        );
    }
}

class GroupFooter extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }

    addNewGroup = () => {
        if (this.props.addNewGroup(this.state.groupName)) {
            this.endAdd();
        }
    };

    setGroupName = (groupName) => this.setState({ groupName });

    setAddMode = (editMode) => this.setState({ editMode, groupName: '' });
    beginAdd = () => this.setAddMode(true);
    endAdd = () => this.setAddMode(false);

    render() {
        const {
            endAdd, addNewGroup, setGroupName,
            props: { isPlugged, saveGroups, onDone },
            state: { editMode, groupName }
        } = this;

        return (
            <tfoot>
                <tr>
                    <td colSpan={6}>
                        <div style={{ height: 30, paddingTop: 4 }}>
                            <div className="pull-left">
                                <div className="ui-inputgroup" hidden={editMode}>
                                    <Button type="success" icon="fa fa-plus" label="Add group" onClick={this.beginAdd} />
                                </div>
                                <div className="ui-inputgroup" hidden={!editMode}>
                                    <TextBox value={groupName} onChange={setGroupName} maxLength={40} placeholder="Name of new group"
                                        onKey_Enter={addNewGroup} />
                                    <Button type="success" icon="fa fa-check" disabled={!groupName} onClick={addNewGroup} />
                                    <Button type="danger" icon="fa fa-close" onClick={endAdd} />
                                </div>
                            </div>
                            <div className="pull-right">
                                {isPlugged && <span>Note: To permanently save the changes, go to Settings -&gt; User groups from menu.</span>}
                                {!isPlugged && <Button type="success" icon="fa fa-save" label="Save Changes" onClick={saveGroups} />}
                                {isPlugged && <Button icon="fa fa-save" label="Done" onClick={onDone} />}
                            </div>
                        </div>
                    </td>
                </tr>
            </tfoot >
        );
    }
}

class GroupNameComponent extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "MessageService");
        this.state = { editMode: false };
    }

    setEditMode = (editMode) => this.setState({ editMode, groupName: this.props.group.name });
    beginEdit = () => this.setEditMode(true);
    endEdit = () => this.setEditMode(false);

    setGroupName = (groupName) => this.setState({ groupName });

    updateGroupName = () => {
        const {
            props: { group, hasGroupWithName }
        } = this;

        let { groupName } = this.state;

        groupName = groupName.trim();
        if (hasGroupWithName(groupName, group)) {
            this.$message.warning(`The group with the name '${groupName}' already exists!`, "Group already exists");
            return;
        }

        this.props.group.name = groupName;
        this.endEdit();
    };

    render() {
        const {
            beginEdit, endEdit, setGroupName, updateGroupName,
            state: { editMode, groupName },
            props: { group }
        } = this;

        if (!editMode) {
            return <div onClick={beginEdit}>
                <span style={{ fontWeight: 600, fontSize: 17 }}>{group.name} </span>
                ({group.users.length} users) <i className="fa fa-edit" />
            </div>;
        }
        else {
            return <div className="ui-inputgroup">
                <TextBox value={groupName} maxLength={40} onChange={setGroupName} />
                <Button type="success" icon="fa fa-check" onClick={updateGroupName} />
                <Button type="danger" icon="fa fa-undo" onClick={endEdit} />
            </div>;
        }
    }
}