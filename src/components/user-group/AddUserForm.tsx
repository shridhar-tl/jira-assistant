import { useCallback, useState } from 'react';

import type { ComponentEvent } from 'fluxo-ui';

import type { JiraUser } from '@/types';

import { inject } from '@services';

import { AutocompleteMulti, Button } from '@components';

import { getUserName } from '@utils/helpers';

interface AddUserFormProps {
    onAddUsers: (users: JiraUser[]) => void;
}

interface UserSuggestion {
    label: string;
    value: string;
}

function toSuggestion(user: JiraUser): UserSuggestion | null {
    const value = getUserName(user);
    return value ? { label: user.displayName || value, value } : null;
}

function isExactUserMatch(user: JiraUser, text: string): boolean {
    const lowerText = text.toLowerCase();
    return [user.accountId, user.name, user.key, user.emailAddress].some((id) => id?.toLowerCase() === lowerText);
}

function mergeSuggestions(current: UserSuggestion[], additions: UserSuggestion[]): UserSuggestion[] {
    const newOnes = additions.filter((s) => !current.some((c) => c.value === s.value));
    return newOnes.length ? [...current, ...newOnes] : current;
}

function AddUserForm({ onAddUsers }: AddUserFormProps) {
    const { $jira } = inject('JiraService');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [userCache, setUserCache] = useState<Record<string, JiraUser>>({});

    const cacheUsers = useCallback((users: JiraUser[]) => {
        setUserCache((prev) => {
            const newCache: Record<string, JiraUser> = { ...prev };
            users.forEach((u) => {
                const key = getUserName(u);
                if (key) newCache[key] = u;
            });
            return newCache;
        });
    }, []);

    const searchUsers = useCallback(
        async (query: string) => {
            const results: JiraUser[] = (await $jira.searchUsers(query)) || [];
            cacheUsers(results);
            setSuggestions(results.map(toSuggestion).filter((s): s is UserSuggestion => !!s));
        },
        [$jira, cacheUsers],
    );

    const addCustomUser = useCallback(
        async (text: string) => {
            const searchResults: JiraUser[] = (await $jira.searchUsers(text).catch(() => null)) || [];
            const user: JiraUser | undefined =
                searchResults.find((u) => isExactUserMatch(u, text)) || (await $jira.getUserDetails(text).catch(() => undefined));
            const suggestion = user && toSuggestion(user);
            if (!user || !suggestion) return;

            cacheUsers([user]);
            setSuggestions((prev) => mergeSuggestions(prev, [suggestion]));
            setSelectedIds((prev) => (prev.includes(suggestion.value) ? prev : [...prev, suggestion.value]));
        },
        [$jira, cacheUsers],
    );

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
                onCustomValue={addCustomUser}
                minLength={2}
                placeholder="Search users, or type a username / email and press Enter"
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
