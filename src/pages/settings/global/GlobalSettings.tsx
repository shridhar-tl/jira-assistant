import { useCallback, useEffect, useState } from 'react';

import { Dialog } from '@dialogs';

import { inject } from '@services';

import { Button } from '@components';

import { formatDate } from '@utils/date-utils';

import { useSettingsStore } from '@stores';

import { SettingsCategory } from '@constants/settings';

import GlobalSettingsTable, { type UserSettings } from './GlobalSettingsTable';

export default function GlobalSettings() {
    const [users, setUsers] = useState<UserSettings[]>([]);
    const [intgUsers, setIntgUsers] = useState<UserSettings[]>([]);

    const { generalSettings } = useSettingsStore();
    const dateFormat = generalSettings.dateFormat || 'dd-MMM-yyyy';

    const { $user, $settings, $message } = inject('UserService', 'SettingsService', 'MessageService');

    const loadSettings = useCallback(async () => {
        let allUsers = await $user.getAllUsers();
        allUsers = await Promise.all(
            allUsers.map(async (u: any) => {
                const { id, userId, jiraUrl, email, lastLogin } = u;
                const advSett = await $settings.getAllSettings(u.id, SettingsCategory.Advanced);
                return { id, userId, jiraUrl, email, lastLogin, ...advSett };
            }),
        );

        allUsers[0].useWebVersion = await $settings.get('useWebVersion');

        setUsers(allUsers);
        setIntgUsers(allUsers.slice(1));
    }, [$user, $settings]);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const setValue = useCallback((value: any, field: string, user: UserSettings) => {
        const applyChange = (prev: UserSettings[]): UserSettings[] => {
            const updated = [...prev];
            const index = updated.findIndex((u) => u.id === user.id);
            if (index === -1) return prev;

            const updatedUser = { ...updated[index] };
            let newValue = value;

            if (typeof newValue === 'string') {
                if (field === 'jiraUrl') {
                    newValue = newValue.trim().replace(/\/+$/, '');
                } else {
                    newValue = newValue.trim() || undefined;
                }
            }

            if (newValue === undefined) {
                delete updatedUser[field];
            } else {
                updatedUser[field] = newValue;
            }

            updated[index] = updatedUser;
            return updated;
        };

        setUsers(applyChange);
        setIntgUsers(applyChange);
    }, []);

    const saveSettings = async () => {
        try {
            await $user.saveGlobalSettings(users);
            await loadSettings();
            $message.success('Settings saved successfully. Some changes will reflect only after you refresh the page.');
        } catch {
            $message.error('Failed to save settings. Please try again.');
        }
    };

    const toggleDelete = (user: UserSettings) => {
        if (!user.deleted) {
            Dialog.confirmDelete(
                <>
                    Are you sure you want to delete this integration?
                    <br />
                    <br />
                    This will also delete all associated data including local worklogs, custom reports, etc.
                </>,
                'Confirm delete integration',
            ).then(() => setValue(true, 'deleted', user));
        } else {
            setValue(false, 'deleted', user);
        }
    };

    const formatLastLogin = (date: Date) => {
        if (!date) return 'N/A';
        try {
            return formatDate(new Date(date), `${dateFormat} HH:mm:ss`);
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="min-h-full p-4 md:p-5 lg:p-6 bg-(--bg-secondary)">
            <div className="max-w-6xl mx-auto">
                <div className="mb-4">
                    <h1 className="text-xl font-semibold text-primary">Advanced Settings</h1>
                    <p className="text-[12px] mt-0.5 text-secondary">Manage integration-specific settings and advanced configuration</p>
                </div>

                <GlobalSettingsTable
                    users={users}
                    intgUsers={intgUsers}
                    formatDate={formatLastLogin}
                    setValue={setValue}
                    toggleDelete={toggleDelete}
                />

                <div className="mt-3 p-3 rounded-lg border border-(--border-primary) bg-(--bg-primary) shadow-(--shadow-sm)">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="text-[11px] space-y-1 max-w-2xl text-secondary">
                            <p className="font-semibold text-primary">Important Notes:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>
                                    The Default column shows read-only defaults. Modify settings per integration from the second column
                                    onward.
                                </li>
                                <li>Changes may affect application stability or data integrity. Proceed with caution.</li>
                                <li>Some settings require a page refresh or reopening Jira Assistant to take effect.</li>
                            </ul>
                        </div>
                        <Button variant="primary" onClick={saveSettings} leftIcon={<span className="fa fa-save" />}>
                            Save settings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
