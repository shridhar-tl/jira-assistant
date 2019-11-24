import React, { PureComponent } from 'react';
import { ScrollableTable, THead, TBody, TRow, Column } from '../../../components/ScrollableTable';
import { inject } from '../../../services';
import { getHostFromUrl } from '../../../common/utils';
import { TextBox, Button } from '../../../controls';
import { defaultSettings } from '../../../_constants';
import './GlobalSettings.scss';

class GlobalSettings extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "UserService", "SessionService", "MessageService");
        this.state = { users: [], intgUsers: [] };
    }

    UNSAFE_componentWillMount() {
        this.$user.getAllUsers().then(users => {
            this.setState({ users, intgUsers: users.slice(1) });
        });
    }

    setValue(value, field, user) {
        let { users, intgUsers } = this.state;
        users = [...users];
        const index = users.indexOf(user);
        user = { ...user };
        users[index] = user;

        if (index > 0) {
            intgUsers = [...intgUsers];
            intgUsers[index - 1] = user;
        }

        if (value) {
            user[field] = value.trim();
        }
        else {
            delete user[field];
        }

        this.setState({ users, intgUsers });
    }

    saveSettings = () => {
        const { users } = this.state;
        this.$user.saveGlobalSettings(users).then(() => {
            this.$message.success("Settings saved successfully. Some changes will reflect only after you refresh the page.");
        });
    }

    render() {
        const { state: { users, intgUsers } } = this;

        return (
            <div className="global-settings">
                <ScrollableTable>
                    <caption>Advanced settings</caption>
                    <THead>
                        <TRow>
                            <Column rowSpan={2}>Settings</Column>
                            <Column colSpan={users.length}>Instances</Column>
                        </TRow>
                        <TRow>
                            <Column>Default</Column>
                            {intgUsers.map(u => <Column>{getHostFromUrl(u.jiraUrl)}</Column>)}
                        </TRow>
                    </THead>
                    <TBody>
                        <TRow>
                            <td>Integrated on</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td>{u.lastLogin.format("dd-MMM-yyyy HH:mm:ss")}</td>)}
                        </TRow>
                        <TRow>
                            <td>Jira Server Url</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td>
                                <TextBox placeholder={defaultSettings.openTicketsJQL} value={u.jiraUrl} onChange={(val) => this.setValue(val, "jiraUrl", u)} />
                            </td>)}
                        </TRow>
                        <TRow>
                            <td>Jira User id</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td><TextBox placeholder="User id of Jira" value={u.userId} onChange={(val) => this.setValue(val, "userId", u)} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Email id</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td><TextBox placeholder="User id of Jira" value={u.email} onChange={(val) => this.setValue(val, "email", u)} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Open tickets JQL</td>
                            {users.map(u => <td><TextBox multiline placeholder={defaultSettings.openTicketsJQL} readOnly={u.id === 1}
                                value={u.id === 1 ? defaultSettings.openTicketsJQL : (u.openTicketsJQL || "")}
                                onChange={(val) => this.setValue(val, "openTicketsJQL", u)} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Ticket suggestions JQL</td>
                            {users.map(u => <td><TextBox multiline placeholder={defaultSettings.openTicketsJQL} readOnly={u.id === 1}
                                value={u.id === 1 ? defaultSettings.openTicketsJQL : (u.suggestionJQL || "")}
                                onChange={(val) => this.setValue(val, "suggestionJQL", u)} /></td>)}
                        </TRow>
                    </TBody>
                </ScrollableTable>
                <div className="footer">
                    <strong>Note:</strong> Changing these settings may cause application stability issues or lose in data. Be cautious with the changes you make.
                    <Button className="pull-right" icon="fa fa-save" label="Save settings" type="success" onClick={this.saveSettings} />
                </div>
            </div>
        );
    }
}

export default GlobalSettings;