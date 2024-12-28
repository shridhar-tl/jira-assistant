import React from 'react';
import { inject } from '../../../services';
import { Button } from '../../../controls';
import BaseDialog from '../../../dialogs/BaseDialog';
import { connect, getSettingsObj } from '../datastore';
import { fillSprintList, setStateValue } from '../actions';
import { getFinalStateToSave } from './utils';
import Settings from './Settings';
import './Settings.scss';

class SettingsDialog extends BaseDialog {
    constructor(props) {
        super(props, "Report configurations");
        this.style = { width: "85vw", maxWidth: '900px' };
        inject(this, "ConfigService");
        this.className = "no-padding";
        this.state = { showDialog: true, modifiedSettings: {}, allSettings: props.settings };
    }

    getFooter() {
        return <Button icon="fa fa-save" label="Done" onClick={this.onDone} />;
    }

    onDone = async () => {
        const { modifiedSettings, allSettings } = this.state;
        const settings = getSettingsObj(getFinalStateToSave(this.props.settings, modifiedSettings, allSettings));
        this.props.setStateValue(modifiedSettings);
        await this.$config.saveSettings('reports_WorklogReport', settings);
        this.props.fillSprintList();
        this.onHide(settings);
    };

    handleOnChange = (allSettings, modifiedSettings) => {
        this.setState({ allSettings, modifiedSettings });
    };

    render() {
        return super.renderBase(
            <Settings settings={this.props.settings} onChange={this.handleOnChange} />
        );
    }
}

export default connect(SettingsDialog, (settings) => ({ settings }), { fillSprintList, setStateValue });