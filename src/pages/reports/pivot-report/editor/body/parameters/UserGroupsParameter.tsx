import { useCallback, useState } from 'react';

import GroupEditor from '@/dialogs/GroupEditor';

import { Button } from '@components';

import { getUserName } from '@utils/helpers';

import type { JiraUser, UserGroup } from '@types';

interface UserGroupsParameterProps {
    value: UserGroup[];
    onChange: (groups: UserGroup[]) => void;
}

export default function UserGroupsParameter({ value, onChange }: UserGroupsParameterProps) {
    const [showEditor, setShowEditor] = useState(false);
    const userCount = value.reduce((count, { users }) => count + users.length, 0);

    const handleEditorClose = useCallback(
        (groups?: UserGroup[]) => {
            setShowEditor(false);
            if (groups) {
                onChange(groups.filter(({ users }) => users?.length));
            }
        },
        [onChange],
    );

    const removeGroup = (index: number) => onChange(value.filter((_, i) => i !== index));

    const removeUser = (user: JiraUser) => {
        const userName = getUserName(user);
        onChange(
            value
                .map((group) => ({ ...group, users: group.users.filter((u) => getUserName(u) !== userName) }))
                .filter(({ users }) => users.length),
        );
    };

    return (
        <div className="flex min-w-0 flex-col gap-2 rounded-md border border-(--border-primary) bg-(--bg-primary) p-2">
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-(--text-secondary)">
                    {value.length ? `${userCount} user(s) from ${value.length} group(s)` : 'No users selected'}
                </span>
                <Button
                    layout="plain"
                    size="sm"
                    leftIcon={<span className="fa fa-users" />}
                    label={value.length ? 'Edit' : 'Select users'}
                    onClick={() => setShowEditor(true)}
                />
            </div>
            {value.length > 0 && (
                <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                    {value.map((group, index) => (
                        <GroupUsers
                            key={`${group.name}-${index}`}
                            group={group}
                            onRemove={() => removeGroup(index)}
                            onRemoveUser={removeUser}
                        />
                    ))}
                </div>
            )}
            {showEditor && <GroupEditor groups={value.length ? value : undefined} onHide={handleEditorClose} />}
        </div>
    );
}

interface GroupUsersProps {
    group: UserGroup;
    onRemove: () => void;
    onRemoveUser: (user: JiraUser) => void;
}

function GroupUsers({ group: { name, users }, onRemove, onRemoveUser }: GroupUsersProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-(--text-primary)">
                <span className="fa fa-users text-(--text-secondary)" />
                <span className="min-w-0 truncate">{name}</span>
                <span className="text-(--text-secondary)">({users.length})</span>
                <button
                    type="button"
                    className="ml-auto cursor-pointer text-(--text-secondary) hover:text-(--color-error)"
                    title={`Remove the group "${name}"`}
                    onClick={onRemove}
                >
                    <span className="fa fa-times" />
                </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {users.map((user, index) => (
                    <span
                        key={`${getUserName(user)}-${index}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-full bg-(--bg-secondary) py-0.5 pl-1 pr-2 text-xs text-(--text-primary)"
                    >
                        {user.avatarUrls?.['24x24'] && <img src={user.avatarUrls['24x24']} alt="" className="h-4 w-4 shrink-0 rounded-full" />}
                        <span className="truncate">{user.displayName || getUserName(user)}</span>
                        <button
                            type="button"
                            className="cursor-pointer text-(--text-secondary) hover:text-(--color-error)"
                            title={`Remove ${user.displayName || 'user'}`}
                            onClick={() => onRemoveUser(user)}
                        >
                            <span className="fa fa-times" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}
