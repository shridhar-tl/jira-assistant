import { useEffect, useState } from 'react';

import { executeService } from '@/common/proxy';

import { inject } from '@services';

import { Checkbox, Dropdown, TextInput } from '@components';

import { isPluginBuild, isWebBuild } from '@constants';

const defaultMinTimeToTrack = '00:05';
const defaultAttachDelay = 2;

const roundList = [
    { value: '5', label: '5 Minutes' },
    { value: '10', label: '10 Minutes' },
    { value: '15', label: '15 Minutes' },
    { value: '30', label: '30 Minutes' },
    { value: '60', label: '1 Hour' },
];

const roundOperation = [
    { value: '', label: 'No Rounding' },
    { value: 'round', label: 'Closest value' },
    { value: 'ceil', label: 'Upper bound' },
    { value: 'floor', label: 'Lower bound' },
];

interface TimeTrackerTabProps {
    onSave: (value: any, field: string) => void;
}

export default function TimeTrackerTab({ onSave }: TimeTrackerTabProps) {
    const { $settings, $message } = inject('SettingsService', 'MessageService');

    const [trPauseOnLock, setTrPauseOnLock] = useState<boolean>(false);
    const [trPauseOnIdle, setTrPauseOnIdle] = useState<boolean>(false);
    const [trMinTime, setTrMinTime] = useState<string>('');
    const [trRoundTime, setTrRoundTime] = useState<string>('5');
    const [trRoundOpr, setTrRoundOpr] = useState<string>('');
    const [trAttachCs, setTrAttachCs] = useState<boolean>(true);
    const [trCsDelay, setTrCsDelay] = useState<number>(defaultAttachDelay);
    const [trShowTimer, setTrShowTimer] = useState<boolean>(true);

    const isExtnIntg = !isPluginBuild && (!isWebBuild || localStorage.getItem('authType') === '1');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const TR_PauseOnLock = await $settings.get('TR_PauseOnLock');
        const TR_PauseOnIdle = await $settings.get('TR_PauseOnIdle');
        const TR_MinTime = await $settings.get('TR_MinTime');
        const TR_RoundTime = await $settings.get('TR_RoundTime');
        const TR_RoundOpr = await $settings.get('TR_RoundOpr');

        let TR_AttachCS = await $settings.get('TR_AttachCS');
        let TR_ShowTimer = await $settings.get('TR_ShowTimer');
        if (TR_AttachCS !== false) {
            TR_AttachCS = true;
        }
        if (TR_ShowTimer !== false) {
            TR_ShowTimer = true;
        }

        const TR_CSDelay = await $settings.get('TR_CSDelay');

        setTrPauseOnLock(TR_PauseOnLock);
        setTrPauseOnIdle(TR_PauseOnIdle);
        setTrMinTime(TR_MinTime);
        setTrRoundTime(TR_RoundTime || '5');
        setTrRoundOpr(TR_RoundOpr || '');
        setTrAttachCs(TR_AttachCS);
        setTrCsDelay(TR_CSDelay || defaultAttachDelay);
        setTrShowTimer(TR_ShowTimer);
    };

    const saveSettingAndReload = async (value: any, field: string) => {
        await saveSetting(value, field);

        try {
            await executeService('SELF', 'RELOAD', [], $message);
        } catch (err) {
            $message.error('This settings would work only with JA extension v2.41 or above.', 'Unsupported Settings');
            console.error('Error reloading settings:', err);
        }
    };

    const saveSetting = async (value: any, field: string) => {
        switch (field) {
            case 'TR_PauseOnLock':
                setTrPauseOnLock(value);
                break;
            case 'TR_PauseOnIdle':
                setTrPauseOnIdle(value);
                break;
            case 'TR_MinTime':
                setTrMinTime(value);
                break;
            case 'TR_RoundTime':
                setTrRoundTime(value);
                break;
            case 'TR_RoundOpr':
                setTrRoundOpr(value);
                break;
            case 'TR_AttachCS':
                setTrAttachCs(value);
                break;
            case 'TR_CSDelay':
                setTrCsDelay(value);
                break;
            case 'TR_ShowTimer':
                setTrShowTimer(value);
                break;
        }
        await $settings.set(field, value);
    };

    return (
        <div className="divide-y divide-[--border-primary]">
            <div className="pb-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Minimum Time Spent</div>
                <p className="text-xs text-[--text-secondary] mb-3">
                    Tracked sessions shorter than this duration will be ignored (HH:MM format)
                </p>
                <TextInput
                    value={trMinTime}
                    onChange={(e) => saveSetting(e.value, 'TR_MinTime')}
                    placeholder={defaultMinTimeToTrack}
                    maxLength={5}
                    className="w-28"
                />
            </div>

            <div className="py-5">
                <div className="text-sm font-semibold text-[--text-primary] mb-1">Round Tracked Time</div>
                <p className="text-xs text-[--text-secondary] mb-3">Automatically round tracked time to the nearest interval</p>
                <div className="flex gap-3 items-start flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Rounding mode</label>
                        <Dropdown
                            className="w-44"
                            options={roundOperation}
                            value={trRoundOpr}
                            onChange={(e) => saveSetting(e.value, 'TR_RoundOpr')}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">Round to</label>
                        <Dropdown
                            className="w-36"
                            options={roundList}
                            value={trRoundTime}
                            onChange={(e) => saveSetting(e.value, 'TR_RoundTime')}
                        />
                    </div>
                </div>
            </div>

            {isExtnIntg && (
                <>
                    <div className="py-5">
                        <div className="text-sm font-semibold text-[--text-primary] mb-1">System Events</div>
                        <p className="text-xs text-[--text-secondary] mb-3">
                            Automatically pause and resume the tracker based on system state
                        </p>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg border border-[--border-primary]">
                                <Checkbox
                                    checked={trPauseOnLock}
                                    onChange={(e) => saveSettingAndReload(e.value, 'TR_PauseOnLock')}
                                    label="Pause when system is locked"
                                />
                                <p className="text-xs text-[--text-secondary] mt-1 ml-6">Timer pauses on lock and resumes on unlock</p>
                            </div>
                            <div className="p-3 rounded-lg border border-[--border-primary]">
                                <Checkbox
                                    checked={trPauseOnIdle}
                                    onChange={(e) => saveSettingAndReload(e.value, 'TR_PauseOnIdle')}
                                    label="Pause when system is idle"
                                />
                                <p className="text-xs text-[--text-secondary] mt-1 ml-6">
                                    Timer pauses during idle state and resumes on activity
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-5">
                        <div className="text-sm font-semibold text-[--text-primary] mb-1">Jira Integration</div>
                        <p className="text-xs text-[--text-secondary] mb-3">Embed time tracking controls directly within Jira pages</p>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg border border-[--border-primary]">
                                <Checkbox
                                    checked={trAttachCs}
                                    onChange={(e) => saveSettingAndReload(e.value, 'TR_AttachCS')}
                                    label="Attach tracker within Jira"
                                />
                                <p className="text-xs text-[--text-secondary] mt-1 ml-6">Inject tracking functionality into Jira pages</p>
                            </div>
                            <div className="p-3 rounded-lg border border-[--border-primary]">
                                <Checkbox
                                    checked={trShowTimer}
                                    disabled={!trAttachCs}
                                    onChange={(e) => saveSetting(e.value, 'TR_ShowTimer')}
                                    label="Show running timer in Jira"
                                />
                                <p className="text-xs text-[--text-secondary] mt-1 ml-6">Display the active timer within Jira interface</p>
                            </div>
                            <div className="flex items-center gap-2 pl-3">
                                <span className="text-sm text-[--text-primary]">Injection delay:</span>
                                <TextInput
                                    value={String(trCsDelay)}
                                    onChange={(e) => saveSetting(Number(e.value), 'TR_CSDelay')}
                                    placeholder={defaultAttachDelay.toString()}
                                    type="number"
                                    min={1}
                                    max={20}
                                    step={1}
                                    className="w-16"
                                />
                                <span className="text-sm text-[--text-secondary]">seconds</span>
                            </div>
                            <p className="text-xs text-[--text-tertiary] pl-3 italic">
                                Increase if Jira is slow and tracker controls don't appear
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
