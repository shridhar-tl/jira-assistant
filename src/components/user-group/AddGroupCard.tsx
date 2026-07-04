import { useState } from 'react';

import type { ComponentEvent, ListItem } from 'fluxo-ui';

import { inject } from '@services';

import { Autocomplete, Button, Checkbox, TextInput } from '@components';

interface AddGroupCardProps {
    onAdd: (groupName: string, groupId?: string) => Promise<boolean | undefined>;
}

function AddGroupCard({ onAdd }: AddGroupCardProps) {
    const { $jira } = inject('JiraService');
    const [isEditing, setIsEditing] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [isJiraGroup, setIsJiraGroup] = useState(false);
    const [groupId, setGroupId] = useState<string | null>(null);
    const [groupSuggestions, setGroupSuggestions] = useState<ListItem[]>([]);

    const cancel = () => {
        setIsEditing(false);
        setGroupName('');
        setIsJiraGroup(false);
        setGroupId(null);
    };

    const handleAdd = async () => {
        const success = await onAdd(groupName, isJiraGroup && groupId ? groupId : undefined);
        if (success) cancel();
    };

    const toggleJiraGroup = (e: ComponentEvent<boolean>) => {
        setIsJiraGroup(e.value);
        setGroupId(null);
        setGroupName('');
    };

    const searchGroups = async (query: string) => {
        const results = await $jira.searchGroups(query);
        setGroupSuggestions((results || []).map((g: any) => ({ label: g.name, value: g.groupId })));
    };

    const groupSelected = (e: ComponentEvent<string>) => {
        const selected = e.value;
        if (!selected) return;
        setGroupId(selected);
        const match = groupSuggestions.find((g) => g.value === selected);
        if (match) setGroupName(String(match.label));
    };

    if (!isEditing) {
        return (
            <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-4 text-gray-400 dark:text-gray-500 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-500 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            >
                <i className="fa fa-plus-circle text-base" />
                <span className="font-medium text-sm">Add new group</span>
            </button>
        );
    }

    return (
        <div className="rounded-2xl shadow-sm ring-2 ring-blue-400/30 dark:ring-blue-500/30 bg-[--bg-primary] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-nowrap">
                {!isJiraGroup ? (
                    <TextInput
                        value={groupName}
                        onChange={(e: ComponentEvent<string>) => setGroupName(e.value)}
                        placeholder="Group name"
                        maxLength={40}
                        size="sm"
                        className="flex-1 min-w-0"
                    />
                ) : (
                    <Autocomplete
                        items={groupSuggestions}
                        value={groupName}
                        onChange={(e: ComponentEvent<string>) => setGroupName(e.value)}
                        onSelect={groupSelected}
                        onFilter={searchGroups}
                        placeholder="Search Jira group..."
                        size="sm"
                        className="flex-1 min-w-0"
                    />
                )}
                <Checkbox checked={isJiraGroup} onChange={toggleJiraGroup} label="From Jira" size="sm" />
                <Button
                    variant="success"
                    leftIcon={<i className="fa fa-check" />}
                    label="Create"
                    onClick={handleAdd}
                    disabled={!groupName}
                    size="sm"
                />
                <Button layout="plain" variant="danger" leftIcon={<i className="fa fa-times" />} onClick={cancel} size="sm" />
            </div>

            {isJiraGroup && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-xs text-amber-700 dark:text-amber-400">
                    <i className="fa fa-exclamation-triangle mt-0.5 shrink-0" />
                    <span>
                        Adding a Jira group requires the <strong>Browse Users</strong> global permission in Jira. Without this permission,
                        fetching the member list will fail with an authorization error.
                    </span>
                </div>
            )}
        </div>
    );
}

export default AddGroupCard;
