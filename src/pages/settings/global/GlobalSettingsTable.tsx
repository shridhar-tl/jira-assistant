import classNames from 'classnames';

import { isPluginBuild } from '@/constants/build-info';
import { SystemUserId } from '@/constants/common';
import config from '@/customize';

import { Checkbox, TextInput } from '@components';

import { getHostFromUrl } from '@utils/helpers';

import { defaultSettings } from '@constants/settings';

const allowJiraUpdates = config.features?.header?.jiraUpdates !== false;
const allowWebVersion = config.features.common.allowWebVersion !== false;
const allowAnalytics = config.features.common.analytics !== false;
const showDevUpdates = config.features.header.devUpdates !== false;

interface UserSettings {
    id: number;
    userId: string;
    jiraUrl: string;
    email: string;
    lastLogin: Date;
    deleted?: boolean;
    openTicketsJQL?: string;
    suggestionJQL?: string;
    disableJiraUpdates?: boolean;
    jiraUpdatesJQL?: string;
    useWebVersion?: boolean;
    enableAnalyticsLogging?: boolean;
    enableExceptionLogging?: boolean;
    disableDevNotification?: boolean;
    [key: string]: any;
}

interface GlobalSettingsTableProps {
    users: UserSettings[];
    intgUsers: UserSettings[];
    formatDate: (date: Date) => string;
    setValue: (value: any, field: string, user: UserSettings) => void;
    toggleDelete: (user: UserSettings) => void;
}

export type { UserSettings };

export default function GlobalSettingsTable({ users, intgUsers, formatDate, setValue, toggleDelete }: GlobalSettingsTableProps) {
    return (
        <div className="rounded-lg overflow-hidden bg-(--bg-primary) border border-(--border-primary) shadow-(--shadow-sm)">
            <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                    <thead>
                        <tr className="border-b border-(--border-primary) bg-(--bg-tertiary)">
                            <th className="text-left p-3 font-semibold min-w-58 text-primary">Setting</th>
                            <th className="text-left p-3 font-semibold min-w-65 max-w-70 text-primary">Default</th>
                            {intgUsers.map((u) => (
                                <th key={u.id} className="text-left p-3 font-semibold min-w-100 text-primary">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">{getHostFromUrl(u.jiraUrl)}</span>
                                        {!isPluginBuild && (
                                            <button
                                                className={classNames(
                                                    'shrink-0 w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors',
                                                    u.deleted ? 'text-blue-600 hover:bg-blue-50' : 'text-red-500 hover:bg-red-50',
                                                )}
                                                title={u.deleted ? 'Undo delete' : 'Delete this integration'}
                                                onClick={() => toggleDelete(u)}
                                            >
                                                <span className={classNames('fa text-[11px]', u.deleted ? 'fa-undo' : 'fa-trash')} />
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <SettingsRow label="Integrated on">
                            <td className="p-3 text-secondary">N/A</td>
                            {intgUsers.map((u) => (
                                <td key={u.id} className="p-3 text-secondary">
                                    {formatDate(u.lastLogin)}
                                </td>
                            ))}
                        </SettingsRow>

                        <SettingsRow label="Jira Server URL">
                            <td className="p-3 text-secondary">N/A</td>
                            {intgUsers.map((u) => (
                                <td key={u.id} className="p-3">
                                    <TextInput
                                        placeholder="e.g. https://jira.company.com"
                                        value={u.jiraUrl?.toString()}
                                        onChange={(e) => setValue(e.value, 'jiraUrl', u)}
                                        disabled={u.deleted}
                                        className="w-full"
                                    />
                                </td>
                            ))}
                        </SettingsRow>

                        <SettingsRow label="Jira User ID">
                            <td className="p-3 text-secondary">N/A</td>
                            {intgUsers.map((u) => (
                                <td key={u.id} className="p-3">
                                    <TextInput
                                        placeholder="User ID"
                                        value={u.userId}
                                        onChange={(e) => setValue(e.value, 'userId', u)}
                                        disabled={u.deleted}
                                        className="w-full"
                                    />
                                </td>
                            ))}
                        </SettingsRow>

                        <SettingsRow label="Email ID">
                            <td className="p-3 text-secondary">N/A</td>
                            {intgUsers.map((u) => (
                                <td key={u.id} className="p-3">
                                    <TextInput
                                        placeholder="Email"
                                        value={u.email}
                                        onChange={(e) => setValue(e.value, 'email', u)}
                                        disabled={u.deleted}
                                        className="w-full"
                                    />
                                </td>
                            ))}
                        </SettingsRow>

                        <SettingsRow label="Open tickets JQL">
                            {users.map((u) => (
                                <td key={u.id} className="p-3">
                                    {u.id === SystemUserId ? (
                                        <JqlDisplay value={defaultSettings.openTicketsJQL} />
                                    ) : (
                                        <JqlTextarea
                                            placeholder={defaultSettings.openTicketsJQL}
                                            value={u.openTicketsJQL || ''}
                                            onChange={(val) => setValue(val, 'openTicketsJQL', u)}
                                            disabled={u.deleted}
                                        />
                                    )}
                                </td>
                            ))}
                        </SettingsRow>

                        <SettingsRow label="Ticket suggestions JQL">
                            <td className="p-3 text-secondary">N/A</td>
                            {intgUsers.map((u) => (
                                <td key={u.id} className="p-3">
                                    <JqlTextarea
                                        placeholder="Provide custom JQL used to filter issues for picker"
                                        value={u.suggestionJQL || ''}
                                        onChange={(val) => setValue(val, 'suggestionJQL', u)}
                                        disabled={u.deleted}
                                    />
                                </td>
                            ))}
                        </SettingsRow>

                        {allowJiraUpdates && (
                            <SettingsRow label="Disable Jira issue updates">
                                {users.map((u) => (
                                    <td key={u.id} className="p-3">
                                        <Checkbox
                                            checked={u.disableJiraUpdates}
                                            onChange={(e) => setValue(e.value, 'disableJiraUpdates', u)}
                                            disabled={u.deleted}
                                            label="Disable updates"
                                        />
                                    </td>
                                ))}
                            </SettingsRow>
                        )}

                        {allowJiraUpdates && (
                            <SettingsRow label="Jira updates JQL">
                                {users.map((u) => (
                                    <td key={u.id} className="p-3">
                                        {u.id === SystemUserId ? (
                                            <JqlDisplay value={defaultSettings.jiraUpdatesJQL} />
                                        ) : (
                                            <JqlTextarea
                                                placeholder={defaultSettings.jiraUpdatesJQL}
                                                value={u.jiraUpdatesJQL || ''}
                                                onChange={(val) => setValue(val, 'jiraUpdatesJQL', u)}
                                                disabled={u.disableJiraUpdates || u.deleted}
                                            />
                                        )}
                                    </td>
                                ))}
                            </SettingsRow>
                        )}

                        {allowWebVersion && !!users[0] && (
                            <SettingsRow label="Use Jira Assistant Web version">
                                <td colSpan={intgUsers.length + 1} className="p-3">
                                    <Checkbox
                                        checked={users[0].useWebVersion}
                                        onChange={(e) => setValue(e.value, 'useWebVersion', users[0])}
                                        label="Always use web build with latest updates and fixes"
                                    />
                                </td>
                            </SettingsRow>
                        )}

                        {allowAnalytics && !!users[0] && (
                            <SettingsRow label="Enable usage tracking">
                                <td colSpan={intgUsers.length + 1} className="p-3">
                                    <Checkbox
                                        checked={users[0].enableAnalyticsLogging !== false}
                                        onChange={(e) => setValue(e.value, 'enableAnalyticsLogging', users[0])}
                                        label="Help identify which features are used most (anonymous, Google Analytics)"
                                    />
                                </td>
                            </SettingsRow>
                        )}

                        {allowAnalytics && !!users[0] && (
                            <SettingsRow label="Enable exception tracking">
                                <td colSpan={intgUsers.length + 1} className="p-3">
                                    <Checkbox
                                        checked={users[0].enableExceptionLogging !== false}
                                        onChange={(e) => setValue(e.value, 'enableExceptionLogging', users[0])}
                                        label="Help identify and fix errors (anonymous)"
                                    />
                                </td>
                            </SettingsRow>
                        )}

                        {showDevUpdates && !!users[0] && (
                            <SettingsRow label="Developer notifications">
                                <td colSpan={intgUsers.length + 1} className="p-3">
                                    <Checkbox
                                        checked={users[0].disableDevNotification}
                                        onChange={(e) => setValue(e.value, 'disableDevNotification', users[0])}
                                        label="Disable important notifications from the developer"
                                    />
                                </td>
                            </SettingsRow>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <tr className="transition-colors border-b border-(--border-primary) hover:bg-(--bg-hover)">
            <td className="p-3 font-medium align-top text-[13px] text-primary">{label}</td>
            {children}
        </tr>
    );
}

function JqlDisplay({ value }: { value: string }) {
    return (
        <div
            className="text-[11px] font-mono leading-relaxed text-secondary bg-(--bg-secondary) border border-(--border-primary) rounded px-2 py-1.5 wrap-break-word select-all cursor-default overflow-hidden"
            title="Default value (read-only)"
        >
            {value}
        </div>
    );
}

interface JqlTextareaProps {
    value: string;
    placeholder: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}

function JqlTextarea({ value, placeholder, onChange, disabled }: JqlTextareaProps) {
    return (
        <textarea
            className={classNames(
                'w-full text-[12px] font-mono leading-relaxed rounded border px-2 py-1.5 resize-y min-h-[56px] outline-none transition-colors',
                'bg-(--bg-primary) text-primary border-(--border-primary)',
                'focus:border-(--border-focus) focus:ring-1 focus:ring-(--border-focus)',
                disabled && 'opacity-50 cursor-not-allowed bg-(--bg-secondary)',
            )}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={2}
        />
    );
}
