import { useState } from 'react';

import type { ComponentEvent, ListItem } from 'fluxo-ui';

import type { JiraUser } from '@/types';

import { inject } from '@services';

import { Dropdown, TextInput } from '@components';

interface UserRowProps {
    user: JiraUser;
    index: number;
    userTimezones: ListItem[];
    onRemove: (index: number) => void;
}

function UserRow({ user, index, userTimezones, onRemove }: UserRowProps) {
    const { $userutils } = inject('UserUtilsService');
    const [timeZone, setTimeZone] = useState(user.timeZone || '');
    const [costPerHour, setCostPerHour] = useState(String(user.costPerHour || 0));

    const isActive = user.active !== false;
    // Show login only when it's a distinct username (not just the email repeated)
    const showLogin = user.name && user.name !== user.emailAddress;

    const timeZoneChanged = (e: ComponentEvent<string>) => {
        user.timeZone = e.value;
        setTimeZone(e.value);
    };

    const costChanged = (e: ComponentEvent<string>) => {
        const numCost = parseFloat(e.value) || 0;
        user.costPerHour = numCost;
        setCostPerHour(e.value);
    };

    return (
        <div
            title={!isActive ? 'User is inactive' : ''}
            className={`relative bg-white dark:bg-white/5 rounded-xl p-2.5 shadow-sm border border-gray-100 dark:border-white/10 group hover:shadow-md transition-shadow ${!isActive ? 'opacity-60' : ''}`}
        >
            {/* Remove — appears on hover */}
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Remove user"
            >
                <i className="fa fa-times text-[10px]" />
            </button>

            {/* Identity */}
            <div className="flex items-start gap-2 mb-2.5 pr-5">
                <img
                    src={user.avatarUrls?.['32x32'] || user.avatarUrls?.['48x48'] || ''}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full shrink-0 object-cover mt-0.5"
                />
                <div className="min-w-0 flex-1">
                    <a
                        href={$userutils.getProfileUrl(user)}
                        className={`text-xs font-semibold block truncate leading-snug ${isActive ? 'text-blue-600 dark:text-blue-400 hover:underline' : 'line-through text-gray-400'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {user.displayName}
                    </a>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-snug">{user.emailAddress}</div>
                    {showLogin && <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-snug">{user.name}</div>}
                </div>
            </div>

            {/* Timezone + Cost per hour — side by side */}
            <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Timezone</span>
                    <Dropdown options={userTimezones} value={timeZone} onChange={timeZoneChanged} searchable size="sm" className="w-full" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Cost / hr</span>
                    <TextInput value={costPerHour} onChange={costChanged} size="sm" className="w-full" />
                </div>
            </div>
        </div>
    );
}

export default UserRow;
