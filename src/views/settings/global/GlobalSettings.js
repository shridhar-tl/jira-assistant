import React, { PureComponent } from 'react';
import { ScrollableTable, THead, TBody, TRow, Column } from '../../../components/ScrollableTable';
import { inject } from '../../../services';
import { getHostFromUrl } from '../../../common/utils';
import { TextBox, Button, Checkbox } from '../../../controls';
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

        if (typeof value === "string") {
            user[field] = value.trim() || undefined;
        }
        else {
            user[field] = value;
        }

        if (user[field] === undefined) {
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
                            {intgUsers.map(u => <Column key={u.id}>{getHostFromUrl(u.jiraUrl)}</Column>)}
                        </TRow>
                    </THead>
                    <TBody>
                        <TRow>
                            <td>Integrated on</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td key={u.id}>{u.lastLogin.format("dd-MMM-yyyy HH:mm:ss")}</td>)}
                        </TRow>
                        <TRow>
                            <td>Jira Server Url</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td key={u.id}>
                                <TextBox placeholder="e.g. https://jira.example.com" value={u.jiraUrl?.toString()} onChange={(val) => this.setValue(val, "jiraUrl", u)} />
                            </td>)}
                        </TRow>
                        <TRow>
                            <td>Jira User id</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td key={u.id}><TextBox placeholder="User id of Jira" value={u.userId} onChange={(val) => this.setValue(val, "userId", u)} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Email id</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td key={u.id}><TextBox placeholder="Email id of Jira" value={u.email} onChange={(val) => this.setValue(val, "email", u)} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Open tickets JQL</td>
                            {users.map(u => <td key={u.id}><TextBox multiline placeholder={defaultSettings.openTicketsJQL} readOnly={u.id === 1}
                                value={u.id === 1 ? defaultSettings.openTicketsJQL : (u.openTicketsJQL || "")}
                                onChange={(val) => this.setValue(val, "openTicketsJQL", u)} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Ticket suggestions JQL</td>
                            {users.map(u => <td key={u.id}><TextBox multiline placeholder={defaultSettings.openTicketsJQL} readOnly={u.id === 1}
                                value={u.id === 1 ? defaultSettings.openTicketsJQL : (u.suggestionJQL || "")}
                                onChange={(val) => this.setValue(val, "suggestionJQL", u)} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Disable Jira issue updates</td>
                            {users.map(u => <td key={u.id}><Checkbox checked={u.disableJiraUpdates}
                                onChange={(val) => this.setValue(val, "disableJiraUpdates", u)}
                                label="Disable Jira issue updates"
                                title="Do not show updates about changes for any issues happend in Jira" />
                            </td>)}
                        </TRow>
                        <TRow>
                            <td>Jira updates JQL (used to fetch updates from Jira)</td>
                            {users.map(u => <td key={u.id}><TextBox multiline placeholder={defaultSettings.jiraUpdatesJQL} readOnly={u.id === 1}
                                disabled={u.disableJiraUpdates}
                                value={u.id === 1 ? defaultSettings.jiraUpdatesJQL : (u.jiraUpdatesJQL || "")}
                                onChange={(val) => this.setValue(val, "jiraUpdatesJQL", u)} /></td>)}
                        </TRow>
                        {!!users[0] && <TRow>
                            <td>Enable tracking user actions (Anynmous, Google Analytics)</td>
                            <td colSpan={intgUsers.length + 1}><Checkbox checked={users[0].enableAnalyticsLogging !== false}
                                onChange={(val) => this.setValue(val, "enableAnalyticsLogging", users[0])}
                                label="Help developers to identify what features are being used much" />
                            </td>
                        </TRow>}
                        {!!users[0] && <TRow>
                            <td>Enable tracking exceptions (Anynmous)</td>
                            <td colSpan={intgUsers.length + 1}><Checkbox checked={users[0].enableExceptionLogging !== false}
                                onChange={(val) => this.setValue(val, "enableExceptionLogging", users[0])}
                                label="Help developers to identify what errors occur for users and would help in fixing it soon" />
                            </td>
                        </TRow>}
                        {!!users[0] && <TRow>
                            <td>Disable notifications from developer</td>
                            <td colSpan={intgUsers.length + 1}><Checkbox checked={users[0].disableDevNotification}
                                onChange={(val) => this.setValue(val, "disableDevNotification", users[0])}
                                label="Do not show important informations and bug notifications from developer" />
                            </td>
                        </TRow>}
                    </TBody>
                </ScrollableTable>
                <div className="footer">
                    <Button className="pull-right" icon="fa fa-save" label="Save settings" type="success" onClick={this.saveSettings} />
                    <strong>Note:</strong>
                    <br />Changing these settings may cause application stability issues or lose in data. Be cautious with the changes you make.
                    <br />Some settings would take effect only the next time when you revisit.
                </div>
            </div>
        );
    }
}

export default GlobalSettings;