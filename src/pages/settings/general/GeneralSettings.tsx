import { useCallback, useEffect, useState } from 'react';

import { isPluginBuild, isWebBuild } from '@/constants/build-info';
import config from '@/customize';

import { inject } from '@services';

import { TabPage, TabView } from '@components';

import DefaultValuesTab from './DefaultValuesTab';
import GeneralTab from './GeneralTab';
import HolidaysTab from './HolidaysTab';
import MeetingsTab from './MeetingsTab';
import MenuOptionsTab from './MenuOptionsTab';
import TimeTrackerTab from './TimeTrackerTab';
import WorklogTab from './WorklogTab';

const showMeetingsTab = config.features.integrations.googleCalendar || config.features.integrations.outlookCalendar;

export default function GeneralSettings() {
    const { $settings, $session } = inject('SettingsService', 'SessionService');

    const userId = $session.userId;
    const noDonations = ($session.CurrentUser as any)?.noDonations;
    const isAtlasCloud = ($session.CurrentUser as any)?.isAtlasCloud;
    const isExtnConnected = isWebBuild ? localStorage.getItem('authType') === '1' : false;
    const showMenuOptionsTab = (!isWebBuild || isExtnConnected) && !isPluginBuild;

    const [settings, setSettings] = useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = useState(0);
    const [removedIntg, setRemovedIntg] = useState(false);

    useEffect(() => {
        if (!userId) {
            return;
        }
        $settings.getGeneralSettings(userId).then((data: any) => {
            setSettings({
                autoLaunch: 0,
                notifyBefore: 0,
                checkUpdates: 15,
                ...data,
            });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const saveSetting = useCallback(
        (value: any, field: string) => {
            const currentUserId = $session.userId;
            if (!currentUserId) {
                return;
            }
            setSettings((prev) => ({ ...prev, [field]: value }));
            $settings.saveGeneralSetting(currentUserId, field, value);

            const cUser = $session.CurrentUser;
            if (cUser) {
                (cUser as any)[field] = value;
            }
        },
        [$settings, $session],
    );

    const stateChanged = useCallback((field: string, value: any) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
    }, []);

    return (
        <div className="min-h-full p-4 md:p-5 lg:p-6 bg-(--bg-secondary)">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                    <h1 className="text-xl font-semibold text-primary">Settings</h1>
                    <p className="text-[12px] mt-0.5 text-secondary">Configure your preferences for Jira Assistant</p>
                </div>

                <div className="rounded-lg overflow-hidden bg-(--bg-primary) border border-(--border-primary) shadow-(--shadow-sm)">
                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                        <TabPage header="General">
                            <div className="p-4">
                                <GeneralTab settings={settings} userId={userId!} noDonations={noDonations} onSave={saveSetting} />
                            </div>
                        </TabPage>
                        <TabPage header="Time Tracker">
                            <div className="p-4">
                                <TimeTrackerTab onSave={saveSetting} />
                            </div>
                        </TabPage>
                        <TabPage header="Worklog">
                            <div className="p-4">
                                <WorklogTab settings={settings} isAtlasCloud={isAtlasCloud} onSave={saveSetting} />
                            </div>
                        </TabPage>
                        <TabPage header="Holidays">
                            <div className="p-4">
                                <HolidaysTab settings={settings} onSave={saveSetting} />
                            </div>
                        </TabPage>
                        <TabPage header="Default Values">
                            <div className="p-4">
                                <DefaultValuesTab settings={settings} onSave={saveSetting} />
                            </div>
                        </TabPage>
                        {showMeetingsTab && (
                            <TabPage header="Meetings">
                                <div className="p-4">
                                    <MeetingsTab
                                        settings={settings}
                                        userId={userId!}
                                        removedIntg={removedIntg}
                                        onSave={saveSetting}
                                        onChange={stateChanged}
                                        intgStatusChanged={setRemovedIntg}
                                    />
                                </div>
                            </TabPage>
                        )}
                        {showMenuOptionsTab && (
                            <TabPage header="Menu Options">
                                <div className="p-4">
                                    <MenuOptionsTab settings={settings} onSave={saveSetting} />
                                </div>
                            </TabPage>
                        )}
                    </TabView>
                </div>
            </div>
        </div>
    );
}
