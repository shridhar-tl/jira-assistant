import React from 'react';
import TabControlBase from './TabControlBase';
import { Checkbox, SelectBox } from '../../../controls';
import { inject } from '../../../services/injector-service';
import { executeService } from '../../../common/proxy';
import { InputMask } from 'primereact/inputmask';
import { InputNumber } from 'primereact/inputnumber';
import { isPluginBuild, isWebBuild } from '../../../constants/build-info';

const isExtnIntg = !isPluginBuild && (!isWebBuild || localStorage.getItem('authType') === '1');

const defaultMinTimeToTrack = '00:05';
const defaultAttachDelay = 2;
const roundList = [
    { value: '5', label: '5 Minutes' },
    { value: '10', label: '10 Minutes' },
    { value: '15', label: '15 Minutes' },
    { value: '30', label: '30 Minutes' },
    { value: '60', label: '1 Hour' }
];
const roundOperation = [
    { value: '', label: 'No Rounding' },
    { value: 'round', label: 'Closest value' },
    { value: 'ceil', label: 'Upper bound' },
    { value: 'floor', label: 'Lower bound' }
];

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
        const TR_MinTime = await this.$settings.get('TR_MinTime');
        const TR_RoundTime = await this.$settings.get('TR_RoundTime');
        const TR_RoundOpr = await this.$settings.get('TR_RoundOpr');

        let TR_AttachCS = await this.$settings.get('TR_AttachCS');
        let TR_ShowTimer = await this.$settings.get('TR_ShowTimer');
        if (TR_AttachCS !== false) { TR_AttachCS = true; }
        if (TR_ShowTimer !== false) { TR_ShowTimer = true; }

        const TR_CSDelay = await this.$settings.get('TR_CSDelay');

        this.setState({ TR_PauseOnLock, TR_PauseOnIdle, TR_MinTime, TR_RoundTime, TR_RoundOpr, TR_AttachCS, TR_CSDelay, TR_ShowTimer });
    }

    saveSettingAndReload = async (value, field) => {
        await this.saveSetting(value, field);

        try {
            await executeService('SELF', 'RELOAD', [], this.$message);
        } catch (err) {
            this.$message.error('This settings would work only with JA extension v2.41 or above.', 'Unsupported Settings');
            console.log(err);
        }
    };

    saveSetting = async (value, field) => {
        this.setState({ [field]: value });
        await this.$settings.set(field, value);
    };

    render() {
        const {
            TR_PauseOnLock, TR_PauseOnIdle, TR_MinTime,
            TR_RoundTime, TR_RoundOpr,
            TR_AttachCS, TR_CSDelay, TR_ShowTimer
        } = this.state;

        return (
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Minimum time spent (HH:MM)</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <InputMask mask="99:99" value={TR_MinTime} onChange={(e) => this.saveSetting(e.value, 'TR_MinTime')}
                            placeholder={defaultMinTimeToTrack} maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                        <span className="help-block">Minimum time required to generate worklog. Tracker stopped with time lesser than this setting would be ignored</span>
                    </div>
                </div>
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Round tracked time</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <SelectBox className="form-control select" dataset={roundOperation} value={TR_RoundOpr || ''}
                            field="TR_RoundOpr" onChange={this.saveSetting}
                            style={{ width: '150px', display: 'inline-block' }} />
                        <SelectBox className="form-control select" dataset={roundList} value={TR_RoundTime || '5'}
                            field="TR_RoundTime" onChange={this.saveSetting}
                            style={{ width: '150px', display: 'inline-block' }} />
                        <span className="help-block">Round the tracked time to x minute as selected</span>
                    </div>
                </div>
                {isExtnIntg && <>
                    <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                        <strong>System Events</strong>
                    </div>
                    <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                        <div className="form-group">
                            <Checkbox checked={TR_PauseOnLock} field="TR_PauseOnLock" onChange={this.saveSettingAndReload} label="Pause time tracker when system is locked" />
                            <span className="help-block">Timer will be paused when system is locked and it would be resumed when unlocked</span>
                        </div>
                        <div className="form-group">
                            <Checkbox checked={TR_PauseOnIdle} field="TR_PauseOnIdle" onChange={this.saveSettingAndReload} label="Pause time tracker when system is idle" />
                            <span className="help-block">Timer will be paused when system goes to idle state and resumed when active</span>
                        </div>
                    </div>
                    <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                        <strong>Show tracker functionality within Jira</strong>
                    </div>
                    <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                        <div className="form-group">
                            <Checkbox checked={TR_AttachCS} field="TR_AttachCS" onChange={this.saveSettingAndReload} onClick={this.requestPermission} label="Attach tracker functionality within Jira" />
                            <span className="help-block">Enabling this would inject tracking functionality in some pages of Jira from where you can control time tracking</span>
                        </div>
                        <div className="form-group">
                            <Checkbox checked={TR_ShowTimer} disabled={!TR_AttachCS} field="TR_ShowTimer" onChange={this.saveSetting} label="Show timer in Jira" />
                            <span className="help-block">Enabling this would show running timer in Jira</span>
                        </div>
                        <div className="form-group">
                            Delay attaching functionality for
                            <InputNumber maxFractionDigits={0} value={TR_CSDelay} onChange={(e) => this.saveSetting(e.value, 'TR_CSDelay')}
                                placeholder={defaultAttachDelay} min={1} max={20} step={1} allowEmpty={false}
                                style={{ 'width': '35px', 'display': 'inline-block', marginLeft: '3px' }} />
                            seconds
                            <span className="help-block">Increase it if your JIRA response time is slow and you do not see tracker functionality in any pages</span>
                        </div>
                    </div>
                </>}
            </div>
        );
    }
}

export default GlobalTab;