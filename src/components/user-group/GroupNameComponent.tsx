import { useState } from 'react';

import type { ComponentEvent } from 'fluxo-ui';

import type { UserGroup } from '@/types';

import { inject } from '@services';

import { Button, TextInput } from '@components';

interface GroupNameComponentProps {
    group: UserGroup;
    hasGroupWithName: (name: string, group?: UserGroup) => boolean;
}

function GroupNameComponent({ group, hasGroupWithName }: GroupNameComponentProps) {
    const { $message } = inject('MessageService');
    const [editMode, setEditMode] = useState(false);
    const [groupName, setGroupName] = useState(group.name);

    const beginEdit = () => {
        if (group.isJiraGroup) return;
        setEditMode(true);
        setGroupName(group.name);
    };

    const endEdit = () => setEditMode(false);

    const updateGroupName = () => {
        const trimmedName = groupName.trim();
        if (!trimmedName) return;
        if (hasGroupWithName(trimmedName, group)) {
            $message.warning(`The group with the name '${trimmedName}' already exists!`, 'Group already exists');
            return;
        }
        group.name = trimmedName;
        endEdit();
    };

    if (!editMode) {
        return (
            <div className="flex items-center gap-2 min-w-0 group/name">
                <span
                    onClick={beginEdit}
                    className={`font-semibold text-sm truncate ${!group.isJiraGroup ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''}`}
                >
                    {group.name}
                </span>
                {group.isJiraGroup && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 font-medium">
                        Jira
                    </span>
                )}
                {!group.isJiraGroup && (
                    <i
                        onClick={beginEdit}
                        className="fa fa-pencil text-xs text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0 cursor-pointer"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex gap-1.5 items-center">
            <TextInput
                value={groupName}
                maxLength={40}
                onChange={(e: ComponentEvent<string>) => setGroupName(e.value)}
                size="sm"
                className="w-40"
            />
            <Button variant="success" leftIcon={<i className="fa fa-check" />} onClick={updateGroupName} size="xs" />
            <Button variant="danger" leftIcon={<i className="fa fa-undo" />} onClick={endEdit} size="xs" />
        </div>
    );
}

export default GroupNameComponent;
