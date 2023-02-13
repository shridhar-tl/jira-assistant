import React from 'react';
import { Modal, view } from '@forge/bridge';
import { Button } from '../../../controls';
import { getSettingsObj, connect } from '../../../gadgets/WorklogReport/datastore';
import CustomActions from '../../../gadgets/WorklogReport/settings/CustomActions';
import { setStateValue } from '../../../gadgets/WorklogReport/actions';
import { getSprintsList } from "../../../gadgets/WorklogReport/datastore";

const EditConfig = function ({ settings, setStateValue }) {
    const saveSettings = async () => {
        const toSave = { ...getSettingsObj(settings), userGroups: settings.userGroups };
        await view.submit(toSave);
    };

    const showReportSettings = () => {
        new Modal({
            onClose: (settings) => setStateValue({ ...settings, ...getSprintsList(settings) }),
            size: 'large',
            context: { modalId: 'ja-dlg-wl-report-config', settings }
        }).open();
    };

    const showUserGroups = () => {
        new Modal({
            onClose: (settings) => setStateValue(settings),
            size: 'max',
            context: { modalId: 'ja-dlg-user-groups', groups: settings?.groups }
        }).open();
    };

    return (<div style={{ height: '450px', padding: '25px' }}>
        <CustomActions showGroupsPopup={showUserGroups} />
        <Button icon="fa fa-cogs" onClick={showReportSettings} />
        <Button icon="fa fa-save" label="Done" onClick={saveSettings} />
    </div>);
};

export default connect(EditConfig, (settings) => ({ settings }), { setStateValue });