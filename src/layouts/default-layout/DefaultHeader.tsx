import { useState, useEffect, useCallback } from 'react';

import { NavLink } from 'react-router';

import { Dialog } from '@dialogs';
import classNames from 'classnames';


import { isWebBuild } from '@/constants/build-info';
import { AppVersionNo } from '@/constants/common';
import type { MenuSection } from '@/constants/navigation';
import { SettingsCategory } from '@/constants/settings';
import config from '@/customize';

import { inject } from '@services';

import { Button } from '@components';

import HeaderBrand from './HeaderBrand';
import HeaderMenu from './HeaderMenu';
import HeaderRight from './HeaderRight';
import TimerControl from './TimerControl';
import UpdatesInfo from './UpdatesInfo';

const contributeEnabled = !!config.modules.contribute;

interface DefaultHeaderProps {
    onLogout: (e: React.MouseEvent) => void;
    isQuickView?: boolean;
    menus?: MenuSection[];
}

export default function DefaultHeader({ onLogout, isQuickView, menus }: DefaultHeaderProps) {
    const { $session, $noti, $settings } = inject('SessionService', 'NotificationService', 'SettingsService');

    const cUser = $session.CurrentUser;
    const userId = cUser?.userId ?? 0;
    const disableNotification = !config.features?.header?.devUpdates || !!cUser?.disableDevNotification;
    const disableJiraUpdates = config.features?.header?.jiraUpdates === false || !!cUser?.disableJiraUpdates;
    const showDonateButton = contributeEnabled && !cUser?.hideDonateMenu;
    const versionNumber = isWebBuild ? 'WEB' : `v ${AppVersionNo}`;

    const [notifications, setNotifications] = useState<any>(null);

    useEffect(() => {
        if (!disableNotification) {
            $noti.getNotifications().then(
                (n: any) => setNotifications(n),
                (err: any) => console.error('Error fetching notifications: ', err),
            );
        }
    }, [disableNotification, $noti]);

    useEffect(() => {
        if (cUser?.hideDonateMenu) {
            document.body.classList.add('no-donation');
        }

        if (userId) {
            validateTimezone($session, $settings, userId);
        }
    }, [cUser, $session, $settings, userId]);

    const showVersionInfo = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            const updates = notifications?.updates_info;
            if (!updates) return;

            Dialog.alert(
                <UpdatesInfo updates={updates} />,
                'Updates info',
                { width: '90vw', maxWidth: '1000px' },
                { acceptLabel: 'Close' },
            ).then();
        },
        [notifications],
    );

    return (
        <header className="fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-4 bg-(--header-bg) border-b border-(--header-border) shadow-(--header-shadow)">
            <div className={classNames('flex items-center gap-3', { 'min-w-0 flex-1': !!menus })}>
                <HeaderBrand showVersionInfo={showVersionInfo} versionNumber={versionNumber} />

                {showDonateButton && (
                    <NavLink
                        to={`/${userId}/contribute`}
                        className="btn-donate hidden md:inline-flex items-center"
                        title="Would you like to contribute / compensate us for the effort we put in development of this tool? Click to know more"
                    >
                        <img
                            src="/assets/donate.png"
                            width="130"
                            className="opacity-90 hover:opacity-100 transition-opacity"
                            alt="Donate us"
                        />
                    </NavLink>
                )}

                {menus && <HeaderMenu menus={menus} />}
            </div>

            <div className={classNames('flex items-center gap-1', { 'shrink-0': !!menus })}>
                <TimerControl />

                <HeaderRight
                    notifications={notifications}
                    onLogout={onLogout}
                    showVersionInfo={showVersionInfo}
                    disableJiraUpdates={disableJiraUpdates}
                    disableNotification={disableNotification}
                    isQuickView={isQuickView}
                />
            </div>
        </header>
    );
}

async function validateTimezone($session: any, $settings: any, userId: number) {
    if (!userId) return;

    const ignoreTimezone = await $settings.getSetting(userId, SettingsCategory.General, 'ignoreTimezone');
    if (ignoreTimezone) return;

    try {
        const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const jiraTimeZone = $session.CurrentUser?.jiraUser?.timeZone;

        if (!jiraTimeZone || !systemTimezone) return;

        const now = new Date();
        const systemOffset = getTimezoneOffsetMinutes(systemTimezone, now);
        const jiraOffset = getTimezoneOffsetMinutes(jiraTimeZone, now);

        if (systemOffset !== jiraOffset) {
            const getOffsetForDisplay = (value: number) => {
                const isNegative = value > 0;
                const absValue = Math.abs(value);
                if (!absValue) return 'GMT';
                const hours = parseFloat((absValue / 60).toFixed(2));
                return `GMT ${isNegative ? '-' : '+'} ${hours} hours`;
            };

            const footer = (confirm: () => void, cancel: () => void) => (
                <>
                    <Button variant="danger" onClick={confirm} leftIcon={<i className="fa fa-times" />}>
                        Ok, Do not check again
                    </Button>
                    <Button variant="primary" onClick={cancel} leftIcon={<i className="fa fa-check" />}>
                        Ok, I will update Jira profile
                    </Button>
                </>
            );

            Dialog.custom(
                <span>
                    Your system timezone mismatches with Jira profile timezone. This would cause differences in date or time while worklog
                    is being pulled. Ensure you update your Jira profile to match with your local timezone.
                    <br />
                    <br />
                    <strong>
                        Jira Profile Timezone: {jiraTimeZone} ({getOffsetForDisplay(jiraOffset)})
                        <br />
                        Your System Timezone: {systemTimezone} ({getOffsetForDisplay(systemOffset)})
                    </strong>
                    <br />
                    <br />
                    Any worklogs you already added directly from within Jira would continue to remain same and new worklogs would start
                    using new timezone.
                    <br />
                    <br />
                </span>,
                'Timezone mismatch',
                footer,
                { maxWidth: '80vw', width: '700px' },
                'dlgTimezoneDiff',
            ).then(() => $settings.saveSetting(userId, SettingsCategory.General, 'ignoreTimezone', true));
        }
    } catch {
        // Timezone validation is best-effort
    }
}

function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
    try {
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
        return (utcDate.getTime() - tzDate.getTime()) / 60000;
    } catch {
        return 0;
    }
}
