import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { ScrollableTable, THead, TBody, TRow, Column } from '../../../components/ScrollableTable';
import { inject } from '../../../services';
import { getHostFromUrl } from '../../../common/utils';
import { TextBox, Button, Checkbox } from '../../../controls';
import { defaultSettings, SettingsCategory, SystemUserId } from '../../../_constants';
import Dialog from '../../../dialogs';
import './GlobalSettings.scss';

class GlobalSettings extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, 'UserService', 'SettingsService', 'MessageService');
        this.state = { users: [], intgUsers: [] };
    }

    async UNSAFE_componentWillMount() {
        let users = await this.$user.getAllUsers();
        users = await Promise.all(users.map(async u => {
            const { id, userId, jiraUrl, email, lastLogin } = u;

            const advSett = await this.$settings.getAllSettings(u.id, SettingsCategory.Advanced);

            return { id, userId, jiraUrl, email, lastLogin, ...advSett };
        }));

        this.setState({ users, intgUsers: users.slice(1) });
    }

    setValue = (value, field, user) => {
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
            value = value.trim() || undefined;
        }

        user[field] = value;

        if (user[field] === undefined) {
            delete user[field];
        }

        /*if (value || value === false) {
            this.$settings.saveSetting(user.id, SettingsCategory.Advanced, field, value);
        } else {
            this.$settings.deleteSetting(user.id, SettingsCategory.Advanced, field);
        }*/

        this.setState({ users, intgUsers });
    };

    saveSettings = () => {
        const { users } = this.state;
        this.$user.saveGlobalSettings(users).then(() => {
            this.UNSAFE_componentWillMount();
            this.$message.success("Settings saved successfully. Some changes will reflect only after you refresh the page.");
        });
    };

    toggleDelete = (user) => {
        if (!user.deleted) {
            Dialog.confirmDelete(
                <>
                    Are you sure to delete the selected integration? <br /><br />
                    This would also delete all the associated data like local Worklogs, Custom Reports, etc.
                </>,
                "Confirm delete integration", undefined, { waitFor: 8 })
                .then(() => this.setValue(true, 'deleted', user));
        } else {
            this.setValue(false, 'deleted', user);
        }
    };

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
                            {intgUsers.map(u => <Column key={u.id}>
                                {getHostFromUrl(u.jiraUrl)}
                                <span className={classNames('fa pull-right delete-account', u.deleted ? 'fa-undo' : 'fa-trash')}
                                    title={u.deleted ? 'Undo delete' : 'Delete this integration'}
                                    onClick={() => this.toggleDelete(u)} />
                            </Column>)}
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
                                <TextBox placeholder="e.g. https://jira.companysite.com" value={u.jiraUrl?.toString()}
                                    args={u} field="jiraUrl" onChange={this.setValue} disabled={u.deleted} />
                            </td>)}
                        </TRow>
                        <TRow>
                            <td>Jira User id</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td key={u.id}><TextBox placeholder="User id of Jira" value={u.userId}
                                args={u} field="userId" onChange={this.setValue} disabled={u.deleted} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Email id</td>
                            <td>N/A</td>
                            {intgUsers.map(u => <td key={u.id}><TextBox placeholder="Email id of Jira" value={u.email}
                                args={u} field="email" onChange={this.setValue} disabled={u.deleted} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Open tickets JQL</td>
                            {users.map(u => <td key={u.id}><TextBox multiline placeholder={defaultSettings.openTicketsJQL} readOnly={u.id === SystemUserId}
                                value={u.id === SystemUserId ? defaultSettings.openTicketsJQL : (u.openTicketsJQL || "")}
                                args={u} field="openTicketsJQL" onChange={this.setValue} disabled={u.deleted} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Ticket suggestions JQL</td>
                            {users.map(u => <td key={u.id}><TextBox multiline placeholder={defaultSettings.openTicketsJQL} readOnly={u.id === SystemUserId}
                                value={u.id === SystemUserId ? defaultSettings.openTicketsJQL : (u.suggestionJQL || "")}
                                args={u} field="suggestionJQL" onChange={this.setValue} disabled={u.deleted} /></td>)}
                        </TRow>
                        <TRow>
                            <td>Disable Jira issue updates</td>
                            {users.map(u => <td key={u.id}><Checkbox checked={u.disableJiraUpdates}
                                args={u} field="disableJiraUpdates" onChange={this.setValue} disabled={u.deleted}
                                label="Disable Jira issue updates"
                                title="Do not show updates about changes for any issues happend in Jira" />
                            </td>)}
                        </TRow>
                        <TRow>
                            <td>Jira updates JQL (used to fetch updates from Jira)</td>
                            {users.map(u => <td key={u.id}><TextBox multiline placeholder={defaultSettings.jiraUpdatesJQL} readOnly={u.id === SystemUserId}
                                disabled={u.disableJiraUpdates || u.deleted}
                                value={u.id === SystemUserId ? defaultSettings.jiraUpdatesJQL : (u.jiraUpdatesJQL || "")}
                                args={u} field="jiraUpdatesJQL" onChange={this.setValue} /></td>)}
                        </TRow>
                        {!!users[0] && <TRow>
                            <td>Enable tracking user actions (Anynmous, Google Analytics)</td>
                            <td colSpan={intgUsers.length + 1}><Checkbox checked={users[0].enableAnalyticsLogging !== false}
                                args={users[0]} field="enableAnalyticsLogging" onChange={this.setValue}
                                label="Help developers to identify what features are being used much" />
                            </td>
                        </TRow>}
                        {!!users[0] && <TRow>
                            <td>Enable tracking exceptions (Anynmous)</td>
                            <td colSpan={intgUsers.length + 1}><Checkbox checked={users[0].enableExceptionLogging !== false}
                                args={users[0]} field="enableExceptionLogging" onChange={this.setValue}
                                label="Help developers to identify what errors occur for users and would help in fixing it soon" />
                            </td>
                        </TRow>}
                        {!!users[0] && <TRow>
                            <td>Disable notifications from developer</td>
                            <td colSpan={intgUsers.length + 1}><Checkbox checked={users[0].disableDevNotification}
                                args={users[0]} field="disableDevNotification" onChange={this.setValue}
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