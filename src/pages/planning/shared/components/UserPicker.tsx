import { useCallback, useEffect, useMemo, useState } from 'react';

import { inject } from '@services';

import { Autocomplete } from '@components';

import { toPlannerUser } from '../issue-mapper';
import type { RawJiraUser } from '../jira-api';
import type { PlannerUser } from '../types';

interface UserPickerProps {
    value: PlannerUser | null;
    onChange: (user: PlannerUser | null) => void;
    suggestions: PlannerUser[];
    placeholder?: string;
    allowUnassigned?: boolean;
}

const unassignedValue = '__unassigned__';
const minSearchLength = 2;

/** Picks a Jira user. Team members are suggested first and any other user can be found by searching Jira. */
export default function UserPicker({ value, onChange, suggestions, placeholder = 'Search people', allowUnassigned }: UserPickerProps) {
    const [query, setQuery] = useState(value?.displayName || '');
    const [found, setFound] = useState<PlannerUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        setQuery(value?.displayName || '');
    }, [value?.id, value?.displayName]);

    const search = useCallback(async (text: string) => {
        if (text.trim().length < minSearchLength) {
            setFound([]);
            return;
        }
        setIsSearching(true);
        try {
            const { $jira } = inject('JiraService');
            const users = (await $jira.searchUsers(text.trim(), 20)) as RawJiraUser[];
            setFound(users.map(toPlannerUser).filter((u): u is PlannerUser => !!u));
        } catch (err) {
            console.error('User search failed', err);
            setFound([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const all = useMemo(() => {
        const map = new Map<string, PlannerUser>();
        [...suggestions, ...found].forEach((u) => map.set(u.id, u));
        return [...map.values()];
    }, [suggestions, found]);

    const items = useMemo(() => {
        const text = query.trim().toLowerCase();
        const showAll = !text || text === value?.displayName.toLowerCase();
        const list = all.filter((u) => showAll || u.displayName.toLowerCase().includes(text) || u.email?.toLowerCase().includes(text));
        const result = list.slice(0, 50).map((u) => ({ label: u.displayName, value: u.id }));
        return allowUnassigned ? [{ label: 'Unassigned', value: unassignedValue }, ...result] : result;
    }, [all, query, value?.displayName, allowUnassigned]);

    return (
        <Autocomplete
            items={items}
            value={query}
            selectedValue={value?.id}
            onChange={(e) => {
                setQuery(e.value);
                if (!e.value && allowUnassigned) {
                    onChange(null);
                }
            }}
            onFilter={search}
            debounceMs={300}
            onSelect={(e) => onChange(e.value === unassignedValue ? null : all.find((u) => u.id === e.value) || null)}
            minLength={0}
            loading={isSearching}
            placeholder={placeholder}
            emptyMessage="No matching people"
        />
    );
}
