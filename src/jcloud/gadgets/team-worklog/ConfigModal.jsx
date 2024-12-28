import { view } from '@forge/bridge';
import 'moment-timezone/builds/moment-timezone-with-data.min.js';
import withInitParams from "../../../layouts/initialization";
import withAuthInfo from '../../../layouts/authorization/simple-auth';
import Settings from '../../../gadgets/WorklogReport/settings/Settings';
import { useState } from 'react';
import { Button } from '../../../controls';
import { getFinalStateToSave } from '../../../gadgets/WorklogReport/settings/utils';

const ConfigModal = function ({ jiraContext: { extension: { modal: { settings } } } }) {
    const [state, setState] = useState({ modifiedSettings: {}, allSettings: settings });
    const onDone = () => {
        const { allSettings, modifiedSettings } = state;
        view.close(getFinalStateToSave(settings, modifiedSettings, allSettings));
    };

    const handleOnChange = (allSettings, modifiedSettings) => setState({ allSettings, modifiedSettings });

    return (<div className="pad-32" style={{ minHeight: '550px', backgroundColor: '#fff' }}>
        <h3>Report Configurations</h3>
        <br />
        <Settings settings={settings} onChange={handleOnChange} />
        <Button className="float-end" icon="fa fa-save" label="Done" onClick={onDone} />
    </div>);
};

export default withInitParams(withAuthInfo(ConfigModal));
