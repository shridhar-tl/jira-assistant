import { Dialog } from '@dialogs';

import config from '@/customize';

import { inject } from '@services';

import { Checkbox, Dropdown } from '@components';

const intervalList = [
    { value: 5, label: 'Every 5 minutes' },
    { value: 10, label: 'Every 10 minutes' },
    { value: 15, label: 'Every 15 minutes' },
    { value: 20, label: 'Every 20 minutes' },
    { value: 30, label: 'Every 30 minutes' },
    { value: 45, label: 'Every 45 minutes' },
    { value: 60, label: 'Every 60 minutes' },
];

const notificationList = [
    { value: 0, label: 'Disable notification' },
    { value: 1, label: 'Before 1 minute' },
    { value: 2, label: 'Before 2 minutes' },
    { value: 3, label: 'Before 3 minutes' },
    { value: 4, label: 'Before 4 minutes' },
    { value: 5, label: 'Before 5 minutes' },
    { value: 10, label: 'Before 10 minutes' },
    { value: 15, label: 'Before 15 minutes' },
];

const launchList = [
    { value: 0, label: 'Never launch' },
    { value: 1, label: 'Before 1 minute' },
    { value: 2, label: 'Before 2 minutes' },
    { value: 3, label: 'Before 3 minutes' },
    { value: 4, label: 'Before 4 minutes' },
    { value: 5, label: 'Before 5 minutes' },
    { value: 10, label: 'Before 10 minutes' },
];

const showGoogleCalendar = config.features.integrations.googleCalendar;
const showOutlookCalendar = config.features.integrations.outlookCalendar;

interface MeetingsTabProps {
    settings: Record<string, any>;
    userId: number;
    removedIntg?: boolean;
    onSave: (value: any, field: string) => void;
    onChange: (field: string, value: any) => void;
    intgStatusChanged: (removed: boolean) => void;
}

export default function MeetingsTab({ settings, userId, removedIntg, onSave, onChange, intgStatusChanged }: MeetingsTabProps) {
    const { $calendar, $analytics, $message, $session, $outlook, $settings, $jaBrowserExtn } = inject(
        'CalendarService',
        'AnalyticsService',
        'MessageService',
        'SessionService',
        'OutlookService',
        'SettingsService',
        'AppBrowserService',
    );

    const enableIntegration = async (key: string, val: boolean) => {
        if (val) {
            const result = await $jaBrowserExtn.requestPermission(['identity']);
            if (result) {
                onSave(val, key);
            } else {
                $message.warning(
                    'Permission was not granted to enable this integration. Please grant permission to enable it.',
                    'Permission not granted',
                );
            }
        } else {
            onSave(val, key);
        }
    };

    const enableGIntegration = (val: boolean) => enableIntegration('googleIntegration', val);
    const enableOIntegration = (val: boolean) => onSave(val, 'outlookIntegration');

    const googleSignIn = async () => {
        try {
            await $calendar.authenticate(true);
            onSave(true, 'hasGoogleCredentials');
            $session.CurrentUser.hasGoogleCredentials = true;
            $analytics.trackEvent('Signedin to Google Calendar', 'Integration');
            $message.success('Successfully integrated with google account.');
        } catch (err) {
            $message.warning('Unable to integrate with Google Calendar!');
            console.error('Unable to integrate with Google Calendar!', err);
        }
    };

    const outlookSignIn = async () => {
        try {
            await $outlook.authenticate();
            $session.CurrentUser.hasOutlookCredentials = true;
            $analytics.trackEvent('Signedin to Outlook Calendar', 'Integration');
            $message.success('Successfully integrated with outlook account.');
            onChange('hasOutlookCredentials', true);
        } catch (err) {
            console.error('Outlook integration failed with error:', err);
            $message.warning('Unable to integrate with Outlook Calendar!');
        }
    };

    const removeIntegration = () => {
        onSave(false, 'hasGoogleCredentials');
        intgStatusChanged(true);
    };

    const undoSignout = () => {
        onSave(true, 'hasGoogleCredentials');
        intgStatusChanged(false);
    };

    const removeOutlookIntegration = () => {
        Dialog.confirmDelete(
            <>
                Are you sure to remove Outlook Integration?
                <br />
                <br />
                To use it again, you will have to reintegrate with MS Outlook.
            </>,
            'Remove Integration',
        ).then(async () => {
            await $settings.saveGeneralSetting(userId, 'OLBT', null);
            await $settings.saveGeneralSetting(userId, 'OLRT', null);
            onSave(false, 'hasOutlookCredentials');
        });
    };

    return (
        <div className="space-y-6">
            <p className="text-sm text-[--text-secondary]">
                Integrate external calendars to automatically create worklogs from meeting events
            </p>

            {showOutlookCalendar && (
                <div className="border border-[--border-primary] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="fa fa-microsoft text-blue-500" />
                        <h4 className="text-base font-semibold text-[--text-primary]">Outlook Calendar</h4>
                    </div>

                    <div className="divide-y divide-[--border-primary]">
                        <div className="pb-4">
                            <Checkbox
                                checked={settings.outlookIntegration}
                                onChange={(e) => enableOIntegration(e.value)}
                                label="Enable Outlook calendar integration"
                            />
                            <p className="text-xs text-[--text-secondary] mt-1 ml-6">
                                View and log work from your Outlook calendar meetings
                            </p>
                        </div>

                        <div className="pt-4">
                            <div className="text-xs font-medium text-[--text-secondary] mb-2">Integration Status</div>
                            {!settings.hasOutlookCredentials ? (
                                <button
                                    onClick={outlookSignIn}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer hover:underline"
                                >
                                    Sign in with your Microsoft account
                                </button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        Connected
                                    </span>
                                    <button
                                        onClick={removeOutlookIntegration}
                                        className="text-xs text-red-500 hover:text-red-600 cursor-pointer hover:underline"
                                    >
                                        Remove integration
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showGoogleCalendar && (
                <div className="border border-[--border-primary] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="fa fa-google text-red-500" />
                        <h4 className="text-base font-semibold text-[--text-primary]">Google Calendar</h4>
                    </div>

                    <div className="divide-y divide-[--border-primary]">
                        <div className="pb-4">
                            <Checkbox
                                checked={settings.googleIntegration}
                                onChange={(e) => enableGIntegration(e.value)}
                                label="Enable Google calendar integration"
                            />
                            <p className="text-xs text-[--text-secondary] mt-1 ml-6">
                                View and log work from your Google calendar meetings
                            </p>
                        </div>

                        <div className="pt-4">
                            <div className="text-xs font-medium text-[--text-secondary] mb-2">Integration Status</div>
                            {!settings.hasGoogleCredentials && !removedIntg && (
                                <button
                                    onClick={googleSignIn}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer hover:underline"
                                >
                                    Sign in with your Google account
                                </button>
                            )}
                            {settings.hasGoogleCredentials && !removedIntg && (
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        Connected
                                    </span>
                                    <button
                                        onClick={removeIntegration}
                                        className="text-xs text-red-500 hover:text-red-600 cursor-pointer hover:underline"
                                    >
                                        Remove integration
                                    </button>
                                </div>
                            )}
                            {removedIntg && (
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        Pending sign-out
                                    </span>
                                    <button
                                        onClick={undoSignout}
                                        className="text-xs text-primary-600 hover:text-primary-700 cursor-pointer hover:underline"
                                    >
                                        Undo sign-out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showGoogleCalendar && <div className="border border-[--border-primary] rounded-lg p-4">
                <h4 className="text-base font-semibold text-[--text-primary] mb-4">Notification & Launch Settings</h4>

                <div className="divide-y divide-[--border-primary]">
                    <div className="pb-4">
                        <div className="text-sm font-semibold text-[--text-primary] mb-1">Check for Updates</div>
                        <p className="text-xs text-[--text-secondary] mb-3">How often to refresh meeting invites for notifications</p>
                        <Dropdown
                            className="w-48"
                            value={settings.checkUpdates}
                            options={intervalList}
                            onChange={(e) => onSave(e.value, 'checkUpdates')}
                        />
                    </div>

                    <div className="py-4">
                        <div className="text-sm font-semibold text-[--text-primary] mb-1">Meeting Notification</div>
                        <p className="text-xs text-[--text-secondary] mb-3">Get notified before upcoming meetings</p>
                        <Dropdown
                            className="w-48"
                            value={settings.notifyBefore}
                            options={notificationList}
                            onChange={(e) => onSave(e.value, 'notifyBefore')}
                        />
                    </div>

                    <div className="pt-4">
                        <div className="text-sm font-semibold text-[--text-primary] mb-1">Auto Launch Meeting</div>
                        <p className="text-xs text-[--text-secondary] mb-3">Automatically open meeting URL before the scheduled time</p>
                        <Dropdown
                            className="w-48"
                            value={settings.autoLaunch}
                            options={launchList}
                            onChange={(e) => onSave(e.value, 'autoLaunch')}
                        />
                    </div>
                </div>
            </div>}
        </div>
    );
}
