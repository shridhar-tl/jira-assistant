import { useEffect, useState } from 'react';

import { convertToStorableValue } from '@/common/storage-helpers';
import BackupImporter from '@/layouts/default-layout/BackupImporter';
import type { UserGroup as UserGroupType } from '@/types';
import { saveStringAs } from '@/utils/helpers';

import { inject } from '@services';

import { Button } from '@components';

import AddGroupCard from './AddGroupCard';
import GroupFooter from './GroupFooter';
import GroupRow from './GroupRow';

interface UserGroupProps {
    groups?: UserGroupType[];
    isPlugged?: boolean;
    onDone?: (groups: UserGroupType[]) => void;
}

interface TimezoneOption {
    label: string;
    value: string;
}

const groupTimezones: TimezoneOption[] = [
    { label: 'My local time zone', value: '' },
    ...Intl.supportedValuesOf('timeZone').map((t) => ({ label: t, value: t })),
];

const userTimezones: TimezoneOption[] = [
    { label: 'My local time zone', value: '' },
    { label: "Use group's time zone", value: 'GRP_TZ' },
    ...Intl.supportedValuesOf('timeZone').map((t) => ({ label: t, value: t })),
];

function UserGroup({ groups: initialGroups, isPlugged = false, onDone }: UserGroupProps) {
    const { $session, $message, $usergroup, $analytics, $backup } = inject(
        'SessionService',
        'MessageService',
        'UserGroupService',
        'AnalyticsService',
        'BackupService',
    );

    const [groups, setGroups] = useState<UserGroupType[]>(initialGroups || []);

    useEffect(() => {
        if (!initialGroups) {
            loadGroups();
        }
    }, []);

    const loadGroups = async () => {
        const loadedGroups = await $usergroup.getUserGroups();
        setGroups(loadedGroups);
    };

    const addNewGroup = async (groupName: string, groupId?: string) => {
        groupName = groupName?.trim();
        if (!groupName) return;

        if (hasGroupWithName(groupName)) {
            $message.warning(`The group with the name '${groupName}' already exists!`, 'Group already exists');
            return false;
        }

        const newGroup: UserGroupType = {
            name: groupName,
            timeZone: '',
            users: [],
            isJiraGroup: !!groupId,
            id: groupId,
        };

        if (newGroup.isJiraGroup) {
            try {
                await $usergroup.fillJiraGroupMembers([newGroup]);
            } catch (err: any) {
                console.error('Error fetching user list from group:', err);
                if (err.status === 403) {
                    $message.error('You do not have required privilege to pull user list from group', 'Unauthorized Access');
                } else {
                    const message =
                        err.error?.errorMessages?.[0] || 'Unable to pull user list from group. Look at console log for more details';
                    $message.error(message, 'Unknown error');
                }
                return;
            }
        } else {
            delete newGroup.isJiraGroup;
            delete newGroup.id;
        }

        setGroups([...groups, newGroup]);
        return true;
    };

    const hasGroupWithName = (groupName: string, group?: UserGroupType) => {
        groupName = groupName.toLowerCase();
        return groups.some((g) => g.name.toLowerCase() === groupName && g !== group);
    };

    const deleteGroup = (index: number) => {
        const newGroups = [...groups];
        newGroups.splice(index, 1);
        setGroups(newGroups);
    };

    const saveGroups = async () => {
        await $usergroup.saveUserGroups(groups);
        $analytics.trackEvent('User groups saved', 'UserActions');
        $message.success('Changes saved successfully!', 'Group saved');
    };

    const done = () => {
        if (onDone) {
            $analytics.trackEvent('User groups modified', 'UserActions');
            onDone(groups);
        }
    };

    const exportGroups = async () => {
        try {
            const data = await $backup.exportBackup({ [$session.userId!]: { groups: true } });
            const json = convertToStorableValue(data);
            const fileName = `JA_Groups_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.jab`;
            saveStringAs(json, 'jab', fileName);
            $analytics.trackEvent('Groups exported', 'UserActions');
        } catch (err: any) {
            $message.error(err.message);
        }
    };

    const groupsList = (
        <div className="flex flex-col gap-3">
            {groups.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
                    No groups yet. Create your first group below.
                </div>
            )}
            {groups.map((group, i) => (
                <GroupRow
                    key={group.name}
                    group={group}
                    index={i}
                    hasGroupWithName={hasGroupWithName}
                    groupTimezones={groupTimezones}
                    userTimezones={userTimezones}
                    onRemove={deleteGroup}
                />
            ))}
            <AddGroupCard onAdd={addNewGroup} />
        </div>
    );

    const footer = <GroupFooter isPlugged={isPlugged} saveGroups={saveGroups} onDone={done} onReset={loadGroups} />;

    if (isPlugged) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3">{groupsList}</div>
                {footer}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">User Groups</h2>
                <div className="flex gap-1">
                    <Button
                        layout="plain"
                        leftIcon={<i className="fa fa-download" />}
                        title="Export groups"
                        onClick={exportGroups}
                        size="sm"
                    />
                    <BackupImporter onImport={loadGroups}>
                        {(chooseFile) => (
                            <Button
                                layout="plain"
                                leftIcon={<i className="fa fa-upload" />}
                                title="Import groups"
                                onClick={chooseFile}
                                size="sm"
                            />
                        )}
                    </BackupImporter>
                </div>
            </div>
            {groupsList}
            {footer}
        </div>
    );
}

export default UserGroup;
