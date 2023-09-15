import React from 'react';
import BaseDialog from '../../dialogs/BaseDialog';
import { Button } from '../../controls';
import JQLEditor from '../../jira-controls/JQLEditor';

class SettingsDialog extends BaseDialog {
    constructor(props) {
        super(props, "Gadget configurations");
        this.className = "no-padding";

        const { pageSettings } = props;
        this.state = { showDialog: true, pageSettings: { ...pageSettings } };
    }

    getFooter() {
        return <Button icon="fa fa-save" label="Done" onClick={this.onDone} />;
    }

    onDone = () => {
        this.onHide(this.state.pageSettings);
    };

    onChange = (jql) => {
        let { pageSettings } = this.state;
        pageSettings = { ...pageSettings, jql };
        this.setState({ pageSettings });
    };

    render() {
        const { pageSettings: { jql } } = this.state;

        return super.renderBase(
            <div>
                <JQLEditor jql={jql} onChange={this.onChange} />
            </div>
        );
    }
}

export default SettingsDialog;