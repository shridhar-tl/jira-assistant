import { useCallback, useMemo, useRef, useState } from 'react';

import type { ComponentEvent, ListItem } from 'fluxo-ui';

import type { PokerUserPicker, UserPickerProps } from 'planning-poker/contracts';
import type { PokerUserRef } from 'planning-poker/shared/types/poker';

import { inject } from '@services';

import { AutocompleteMulti } from '@components';

import type { JiraUser } from '@/types';

import { jiraAvatarUrl } from './avatar-url';

interface UserSuggestion extends ListItem {
    label: string;
    value: string;
    user: PokerUserRef;
}

const searchResultLimit = 10;

function toUserRef(user: JiraUser): PokerUserRef {
    return {
        id: user.accountId,
        name: user.displayName || user.emailAddress || user.accountId,
        email: user.emailAddress || undefined,
        avatarUrl: jiraAvatarUrl(user.avatarUrls?.['48x48'] ?? user.avatarUrl),
    };
}

function toSuggestion(user: PokerUserRef): UserSuggestion {
    return { label: user.name, value: user.id, user };
}

function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
}

function UserOption({ user }: { user: PokerUserRef }) {
    const [imageFailed, setImageFailed] = useState(false);
    const showsImage = Boolean(user.avatarUrl) && !imageFailed;

    return (
        <div className="flex min-w-0 items-center gap-3 py-0.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--bg-secondary) text-xs font-semibold text-(--text-secondary)">
                {showsImage ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
                ) : (
                    initialsOf(user.name)
                )}
            </span>
            <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-(--text-primary)">{user.name}</span>
                {user.email && <span className="truncate text-xs text-(--text-secondary)">{user.email}</span>}
            </span>
        </div>
    );
}

function renderUserOption(item: ListItem) {
    return <UserOption user={(item as UserSuggestion).user} />;
}

function JiraUserPicker({ excludeIds, selected, onChange, disabled }: UserPickerProps) {
    const { $jira } = inject('JiraService');
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const known = useRef<Record<string, PokerUserRef>>({});
    const latestSearch = useRef(0);

    const items = useMemo(() => {
        const chosen = selected.map(toSuggestion);
        const extra = suggestions.filter((suggestion) => !selected.some((user) => user.id === suggestion.value));
        return [...chosen, ...extra];
    }, [selected, suggestions]);

    const handleFilter = useCallback(
        async (query: string) => {
            const request = ++latestSearch.current;
            try {
                const results: JiraUser[] = (await $jira.searchUsers(query, searchResultLimit)) || [];
                if (request !== latestSearch.current) {
                    return;
                }
                const people = results
                    .filter((user) => user.accountId && user.active !== false && !excludeIds.includes(user.accountId))
                    .map(toUserRef);
                people.forEach((user) => {
                    known.current[user.id] = user;
                });
                setSuggestions(people.map(toSuggestion));
            } catch (error) {
                console.error('Poker user search failed', error);
                if (request === latestSearch.current) {
                    setSuggestions([]);
                }
            }
        },
        [$jira, excludeIds],
    );

    const handleChange = useCallback(
        (event: ComponentEvent<string[]>) => {
            selected.forEach((user) => {
                known.current[user.id] = user;
            });
            const users = event.value.map((id) => known.current[id]).filter((user): user is PokerUserRef => Boolean(user));
            onChange(users);
        },
        [onChange, selected],
    );

    return (
        <AutocompleteMulti
            items={items}
            value={selected.map((user) => user.id)}
            onChange={handleChange}
            onFilter={handleFilter}
            renderItem={renderUserOption}
            placeholder="Search people by name or email..."
            className="w-full"
            size="sm"
            disabled={disabled}
        />
    );
}

const jiraUserPicker: PokerUserPicker = JiraUserPicker;

export default jiraUserPicker;
