import React from 'react';
import { convertToStorableValue } from '../../common/storage-helpers';
import { saveStringAs } from '../../common/utils';
import { ScrollableTable, THead, TBody, TRow } from '../../components/ScrollableTable';
import { SystemUserId } from '../../constants/common';
import { EventCategory } from '../../constants/settings';
import { Button, Checkbox } from '../../controls';
import BaseDialog from '../../dialogs/BaseDialog';
import { inject } from '../../services/injector-service';

class ExportSettings extends BaseDialog {
    constructor(props) {
        super(props, 'Export Settings');
        inject(this, 'UserService', 'BackupService');
        this.state.settings = {};
        this.state.exportAll = true;
        this.init();
    }

    async init() {
        const users = await this.$user.getAllUsers();
        this.setState({ users });
    }

    setValue = (value, field, user) => {
        let { settings } = this.state;
        settings = { ...settings };
        const us = { ...settings[user.id] };
        if (value) {
            us[field] = value;
        } else {
            delete us[field];
        }
        if (Object.keys(us).length) {
            settings[user.id] = us;
        } else {
            delete settings[user.id];
        }

        const hasSelection = Object.keys(settings).length > 0;
        this.setState({ settings, hasSelection });
    };

    export = async () => {
        const { settings, exportAll } = this.state;
        const data = await this.$backup.exportBackup(exportAll || settings);

        const json = convertToStorableValue(data);
        const fileName = `JA_Backup_${new Date().format('yyyyMMdd')}.jab`;
        saveStringAs(json, "jab", fileName);
        this.$analytics.trackEvent("Settings exported", EventCategory.UserActions);
        this.onHide();
    };

    toggleAll = (exportAll) => this.setState({ exportAll });

    getFooter() {
        const { hasSelection, exportAll } = this.state;

        return (<>
            <Checkbox checked={exportAll} onChange={this.toggleAll} label="Export all settings" className="float-start" />
            <Button text icon="fa fa-times" label="Cancel" onClick={this.onHide} />
            <Button type="success" icon="fa fa-download" label="Export" onClick={this.export} disabled={!exportAll && !hasSelection} />
        </>);
    }

    render() {
        const { users, settings, exportAll } = this.state;
        if (!users) {
            return super.renderBase(<span>Loading...</span>);
        }

        return super.renderBase(<ScrollableTable>
            <THead>
                <TRow>
                    <th>Instance</th>
                    <th>Reports</th>
                    <th>User Groups</th>
                    <th>Settings</th>
                </TRow>
            </THead>
            <TBody>
                {users.map((u, i) => (<TRow key={i}>
                    <td>{(u.id === SystemUserId) ? 'General' : u.jiraUrl}</td>
                    <td>{u.id > SystemUserId && <Checkbox checked={exportAll || settings[u.id]?.reports || false} field="reports" args={u} onChange={this.setValue} disabled={exportAll} />}</td>
                    <td>{u.id > SystemUserId && <Checkbox checked={exportAll || settings[u.id]?.groups || false} field="groups" args={u} onChange={this.setValue} disabled={exportAll || u.id === SystemUserId} />}</td>
                    <td><Checkbox checked={exportAll || settings[u.id]?.settings || false} field="settings" args={u} onChange={this.setValue} disabled={exportAll} /></td>
                </TRow>))}
            </TBody>
        </ScrollableTable>);
    }
}

export default ExportSettings;
