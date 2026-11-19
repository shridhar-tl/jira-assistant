import { useState } from 'react';

import type { ComponentEvent, ListItem } from 'fluxo-ui';

import type { JiraUser, UserGroup } from '@/types';

import { Button, Dropdown } from '@components';
import { getUserName } from '@utils/helpers';

import AddUserForm from './AddUserForm';
import GroupNameComponent from './GroupNameComponent';
import UserRow from './UserRow';

interface GroupRowProps {
    group: UserGroup;
    index: number;
    groupTimezones: ListItem[];
    userTimezones: ListItem[];
    hasGroupWithName: (name: string, group?: UserGroup) => boolean;
    onRemove: (index: number) => void;
    onChange: (index: number, changes: Partial<UserGroup>) => void;
}

function GroupRow({ group, index, groupTimezones, userTimezones, hasGroupWithName, onRemove, onChange }: GroupRowProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const users = group.users || [];

    const handleAddUsers = (newUsers: JiraUser[]) => {
        const existingNames = users.map((u) => getUserName(u, true));
        const toAdd = newUsers.filter((u) => !existingNames.includes(getUserName(u, true)));
        const merged = [...users, ...toAdd].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        onChange(index, { users: merged });
    };

    const removeUser = (idx: number) => {
        onChange(index, { users: users.filter((_, i) => i !== idx) });
    };

    const updateUser = (idx: number, changes: Partial<JiraUser>) => {
        onChange(index, { users: users.map((u, i) => (i === idx ? { ...u, ...changes } : u)) });
    };

    const handleTimezoneChange = (e: ComponentEvent<string>) => {
        onChange(index, { timeZone: e.value });
    };

    return (
        <div
            data-testid="user-group"
            className="rounded-2xl shadow-sm bg-(--bg-primary) overflow-hidden border-l-[3px] border-blue-500 dark:border-blue-400"
        >
            {/* Group header */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/5">
                <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
                >
                    <i className={`fa fa-chevron-${isExpanded ? 'down' : 'right'} text-xs`} />
                </button>

                <div className="flex-1 min-w-0">
                    <GroupNameComponent group={group} hasGroupWithName={hasGroupWithName} onRename={(name) => onChange(index, { name })} />
                </div>

                <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-white/10 text-gray-500 dark:text-gray-400 shrink-0 font-medium shadow-sm">
                    {users.length} {users.length === 1 ? 'user' : 'users'}
                </span>

                <div className="shrink-0 w-44">
                    <Dropdown
                        options={groupTimezones}
                        value={group.timeZone || ''}
                        onChange={handleTimezoneChange}
                        searchable
                        size="sm"
                        className="w-full"
                    />
                </div>

                <Button
                    variant="danger"
                    layout="plain"
                    leftIcon={<i className="fa fa-trash" />}
                    title={group.isJiraGroup ? 'Remove Group' : 'Delete group'}
                    onClick={() => onRemove(index)}
                    size="sm"
                />
            </div>

            {/* Group body */}
            {isExpanded && (
                <div>
                    {/* Add users / Jira notice */}
                    <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/10">
                        {!group.isJiraGroup ? (
                            <AddUserForm onAddUsers={handleAddUsers} />
                        ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">Members are pulled from Jira</p>
                        )}
                    </div>

                    {/* User list */}
                    {users.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-center text-gray-400 dark:text-gray-500">
                            No users in this group.{!group.isJiraGroup && ' Search and add users above.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3">
                            {users.map((user, i) => (
                                <UserRow
                                    key={user.accountId || user.name || String(i)}
                                    user={user}
                                    index={i}
                                    userTimezones={userTimezones}
                                    onRemove={removeUser}
                                    onChange={updateUser}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default GroupRow;
