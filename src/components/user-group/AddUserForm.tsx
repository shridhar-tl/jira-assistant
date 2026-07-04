import { useState } from 'react';

import type { ComponentEvent } from 'fluxo-ui';

import type { JiraUser } from '@/types';

import { inject } from '@services';

import { AutocompleteMulti, Button } from '@components';

interface AddUserFormProps {
    onAddUsers: (users: JiraUser[]) => void;
}

interface UserSuggestion {
    label: string;
    value: string;
}

function AddUserForm({ onAddUsers }: AddUserFormProps) {
    const { $jira } = inject('JiraService');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [userCache, setUserCache] = useState<Record<string, JiraUser>>({});

    const searchUsers = async (query: string) => {
        const results: JiraUser[] = (await $jira.searchUsers(query)) || [];
        const newCache: Record<string, JiraUser> = { ...userCache };
        results.forEach((u) => {
            if (u.accountId) newCache[u.accountId] = u;
        });
        setUserCache(newCache);
        setSuggestions(
            results.map((u) => ({
                label: u.displayName || u.emailAddress || u.accountId || '',
                value: u.accountId || '',
            })),
        );
    };

    const handleAdd = () => {
        if (selectedIds.length === 0) return;
        const users = selectedIds.map((id) => userCache[id]).filter(Boolean);
        onAddUsers(users);
        setSelectedIds([]);
    };

    return (
        <div className="flex items-center gap-2">
            <AutocompleteMulti
                items={suggestions}
                value={selectedIds}
                onChange={(e: ComponentEvent<string[]>) => setSelectedIds(e.value)}
                onFilter={searchUsers}
                placeholder="Search and add users..."
                className="flex-1"
                size="sm"
            />
            <Button
                variant="success"
                leftIcon={<i className="fa fa-user-plus" />}
                label="Add"
                onClick={handleAdd}
                disabled={selectedIds.length === 0}
                size="sm"
            />
        </div>
    );
}

export default AddUserForm;
