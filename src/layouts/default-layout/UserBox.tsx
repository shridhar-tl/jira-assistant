import { memo, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

import { BrightSunIcon, NightLightIcon } from 'fluxo-ui/icons';

import { AppContext } from '@/common/context';
import { isWebBuild } from '@/constants/build-info';
import { EventCategory } from '@/constants/settings';
import { Link } from '@/controls';

import { inject } from '@services';

import { SelectButton, type ComponentEvent } from '@components';

import { getHostFromUrl } from '@utils/helpers';

import type { ThemePreference } from '@types';

import { useTheme } from '@hooks';

import BackupImporter from './BackupImporter';
import ExportSettings from './ExportSettings';

const menuItemClassName =
    'w-full cursor-pointer flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-md transition-colors text-left text-(--text-primary) hover:bg-(--bg-hover) no-underline';

const themeOptions: { value: ThemePreference; label: string }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
];

interface UserBoxProps {
    onLogout: (e: React.MouseEvent) => void;
    showThemeToggle: boolean;
}

function UserBox({ onLogout, showThemeToggle }: UserBoxProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [showPanel, setShowPanel] = useState(false);
    const [showSettingPopup, setShowSettings] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getUsers().then(setUsers);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setShowPanel(false);
            }
        };

        if (showPanel) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPanel]);

    const showSettings = useCallback(() => setShowSettings(true), []);
    const hideSettings = useCallback(() => setShowSettings(false), []);

    const user = getUserProfileDetails();
    const { name, instanceUrl, imageUrl } = user;

    const togglePanel = useCallback(() => setShowPanel((prev) => !prev), []);

    return (
        <>
            <li className="nav-item list-none">
                <button
                    className={`flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-full transition-all text-primary border border-transparent hover:bg-(--bg-hover) hover:border-(--border-primary) ${showPanel ? 'bg-(--bg-hover) border-(--border-primary)' : ''}`}
                    onClick={togglePanel}
                    title={`${name}\n${instanceUrl}`}
                >
                    <figure className="w-8 h-8 rounded-full overflow-hidden bg-(--bg-secondary) flex items-center justify-center ring-1 ring-(--border-primary) shrink-0">
                        {imageUrl ? (
                            <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span className="text-[11px] font-semibold text-(--text-secondary) uppercase">{getInitials(name)}</span>
                        )}
                    </figure>
                    <div className="hidden md:flex flex-col items-start leading-[1.15] pr-1 gap-px">
                        <span className="text-[13px] font-semibold max-w-40 truncate text-(--text-primary)">{name}</span>
                        <span className="text-[12px] max-w-40 truncate text-(--text-secondary)">{instanceUrl}</span>
                    </div>
                    <i className="hidden md:inline-block fa fa-chevron-down text-[10px] text-(--text-tertiary) pr-0.5" />
                </button>
            </li>

            {showSettingPopup && <ExportSettings onHide={hideSettings} />}

            {showPanel && (
                <div
                    ref={panelRef}
                    className="absolute right-2 top-full mt-2 w-[min(20rem,calc(100vw-1rem))] max-h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden rounded-xl z-50 bg-(--bg-primary) border border-(--border-primary) shadow-(--shadow-xl)"
                >
                    <BackupImporter>
                        {(importSettings) => (
                            <ProfileOptions
                                users={users}
                                user={user}
                                showSettings={showSettings}
                                importSettings={importSettings}
                                onLogout={onLogout}
                                showThemeToggle={showThemeToggle}
                            />
                        )}
                    </BackupImporter>
                </div>
            )}
        </>
    );
}

export default memo(UserBox);

interface UserProfile {
    name: string;
    instanceUrl: string;
    login: string;
    emailAddress: string;
    profileUrl: string;
    imageUrl: string;
    image_x48: string;
}

interface ProfileOptionsProps {
    user: UserProfile;
    users: any[];
    showSettings: () => void;
    importSettings: () => void;
    onLogout: (e: React.MouseEvent) => void;
    showThemeToggle: boolean;
}

function ProfileOptions({ user, users, showSettings, importSettings, onLogout, showThemeToggle }: ProfileOptionsProps) {
    const context = useContext(AppContext) as any;

    const switchUser = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            const userId = parseInt(e.currentTarget.getAttribute('data-user-id') || '0');
            context.switchUser(userId);
            const { $analytics } = inject('AnalyticsService');
            $analytics.trackEvent('Instance switched', EventCategory.Instance);
        },
        [context],
    );

    const { name, instanceUrl, image_x48, imageUrl, profileUrl } = user;

    const hasOtherUsers = users && users.length > 0;

    return (
        <div className="flex flex-col">
            <div className="px-4 pt-4 pb-3.5 bg-(--primary-light) border-b border-(--border-primary)">
                <div className="flex items-center gap-3">
                    <figure className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-(--bg-primary) flex items-center justify-center ring-2 ring-(--bg-primary) shadow-sm">
                        {image_x48 || imageUrl ? (
                            <img src={image_x48 || imageUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <span className="text-[14px] font-semibold text-(--text-secondary) uppercase">{getInitials(name)}</span>
                        )}
                    </figure>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold truncate text-(--text-primary)" title={name}>
                            {name}
                        </div>
                        <div className="text-[12px] truncate text-(--text-secondary)" title={instanceUrl}>
                            {instanceUrl}
                        </div>
                    </div>
                </div>
                <Link
                    href={profileUrl}
                    className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-md no-underline text-(--primary-color) bg-(--bg-primary) hover:bg-(--bg-hover) border border-(--border-primary) transition-colors"
                >
                    <span className="fa fa-user text-[10px]" />
                    <span>View Jira profile</span>
                    <span className="fa fa-external-link text-[9px] opacity-70" />
                </Link>
            </div>

            <div className="py-1.5">
                <SectionHeader>{hasOtherUsers ? 'Switch instance' : 'Instances'}</SectionHeader>
                <div className="px-1.5">
                    {hasOtherUsers &&
                        users.map((u) => (
                            <MenuItem
                                key={u.id}
                                icon="fa-exchange"
                                label={`${getHostFromUrl(u.jiraUrl)} (${u.userId})`}
                                title={u.email}
                                dataUserId={u.id}
                                onClick={switchUser}
                            />
                        ))}
                    <MenuItem
                        as="a"
                        icon="fa-plug"
                        label="Integrate with new instance"
                        href={isWebBuild ? '/integrate' : '/index.html#/integrate'}
                    />
                </div>
            </div>

            <div className="border-t border-(--border-primary) py-1.5">
                <SectionHeader>Settings</SectionHeader>
                <div className="px-1.5">
                    {showThemeToggle && <ThemeToggleItem />}
                    <MenuItem icon="fa-upload" label="Import Settings" onClick={importSettings} />
                    <MenuItem icon="fa-download" label="Export Settings" onClick={showSettings} />
                </div>
            </div>

            <div className="border-t border-(--border-primary) p-1.5">
                <button
                    className="w-full cursor-pointer flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 rounded-md transition-colors text-left hover:bg-red-500/10"
                    onClick={onLogout}
                >
                    <span className="fa fa-sign-out w-4 text-center text-[12px]" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <div className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary)">{children}</div>
    );
}

interface MenuItemProps {
    icon: string;
    label: string;
    title?: string;
    onClick?: (e: React.MouseEvent<any>) => void;
    href?: string;
    dataUserId?: number;
    as?: 'button' | 'a';
}

function ThemeToggleItem() {
    const { isDark, preference, setPreference } = useTheme();
    const labelId = useId();

    const changeTheme = useCallback((e: ComponentEvent<string>) => setPreference(e.value as ThemePreference), [setPreference]);

    return (
        <div className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] text-(--text-primary)">
            <span className="w-4 flex items-center justify-center shrink-0 text-(--text-tertiary)">
                {isDark ? <NightLightIcon className="size-3.5" /> : <BrightSunIcon className="size-3.5" />}
            </span>
            <span id={labelId} className="truncate flex-1">
                Theme
            </span>
            <SelectButton
                items={themeOptions}
                value={preference}
                onChange={changeTheme}
                variant="segmented"
                size="sm"
                required
                ariaLabelledBy={labelId}
            />
        </div>
    );
}

function MenuItem({ icon, label, title, onClick, href, dataUserId, as = 'button' }: MenuItemProps) {
    const inner = (
        <>
            <span className={`fa ${icon} w-4 text-center text-[12px] text-(--text-tertiary)`} />
            <span className="truncate flex-1">{label}</span>
        </>
    );

    if (as === 'a' && href) {
        return (
            <a className={menuItemClassName} href={href} title={title}>
                {inner}
            </a>
        );
    }

    return (
        <button className={menuItemClassName} data-user-id={dataUserId} onClick={onClick} title={title}>
            {inner}
        </button>
    );
}

function getUserProfileDetails(): UserProfile {
    const { $session, $userutils, $utils } = inject('SessionService', 'UserUtilsService', 'UtilsService');
    const user = $session.CurrentUser;
    const { jiraUrl, jiraUser } = user || {};
    const { displayName, emailAddress, key, avatarUrls } = jiraUser || {};
    const profileUrl = $userutils.getProfileUrl();

    return {
        name: $utils.cut(displayName || '', 27),
        instanceUrl: $utils.cut(jiraUrl ? getHostFromUrl(jiraUrl) : '', 32),
        login: key || '',
        emailAddress: emailAddress || '',
        profileUrl,
        imageUrl: (avatarUrls || {})['24x24'] || '',
        image_x48: (avatarUrls || {})['48x48'] || '',
    };
}

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

async function getUsers() {
    const { $session, $user } = inject('SessionService', 'UserService');
    const currentUserId = $session.CurrentUser?.userId;
    const users = await $user.getUsersList();
    return users.filter((u: any) => u.id !== currentUserId);
}
