import React from 'react';
import TabControlBase from './TabControlBase';
import { Checkbox } from '../../../controls';
import { inject } from '../../../services/injector-service';
import { executeService } from '../../../common/proxy';

class GlobalTab extends TabControlBase {
    constructor(props) {
        super(props);
        inject(this, 'SettingsService', 'AppBrowserService', 'MessageService');
        this.state = {};
        this.loadSettings();
    }

    async loadSettings() {
        const TR_PauseOnLock = await this.$settings.get('TR_PauseOnLock');
        const TR_PauseOnIdle = await this.$settings.get('TR_PauseOnIdle');

        this.setState({ TR_PauseOnLock, TR_PauseOnIdle });
    }

    lockChanged = async (value, field) => {
        if (value) {
            const granted = await this.$jaBrowserExtn.requestPermission(['idle']);
            if (!granted) {
                this.$message.error('Permission denied for JA to track system state.', 'Permission denied');
                return;
            }
        }

        await this.$settings.set(field, value || null);
        this.setState({ [field]: value });

        try {
            await executeService('SELF', 'RELOAD', [], this.$message);
        } catch (err) {
            this.$message.error('This settings would work only with JA extension v2.41 or above.', 'Unsupported Settings');
            console.log(err);
        }
    };

    render() {
        const { state: { TR_PauseOnLock, TR_PauseOnIdle } } = this;

        return (
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Time Tracker</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={TR_PauseOnLock} field="TR_PauseOnLock" onChange={this.lockChanged} label="Pause time tracker when system is locked" />
                        <span className="help-block">Timer will be paused when system is locked and it would be resumed when unlocked</span>
                    </div>
                    <div className="form-group">
                        <Checkbox checked={TR_PauseOnIdle} field="TR_PauseOnIdle" onChange={this.lockChanged} label="Pause time tracker when system is idle" />
                        <span className="help-block">Timer will be paused when system goes to idle state and resumed when active</span>
                    </div>
                </div>
            </div>
        );
    }
}

export default GlobalTab;