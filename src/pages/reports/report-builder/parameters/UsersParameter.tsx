import { useCallback, useMemo, useState } from 'react';

import { inject } from '@services';

import { AutocompleteMulti } from '@components';

import type { ParameterRuntimeUIProps } from '@components/report-builder';

export interface ParameterUser {
    accountId?: string;
    name?: string;
    displayName: string;
    emailAddress?: string;
}

interface RawUser {
    accountId?: string;
    name?: string;
    key?: string;
    displayName?: string;
    emailAddress?: string;
}

const minSearchLength = 2;

function userId(u: ParameterUser | RawUser): string {
    return u.accountId || u.name || u.emailAddress || '';
}

function toUsers(value: unknown): ParameterUser[] {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return list.filter((u): u is ParameterUser => !!u && typeof u === 'object' && !!userId(u as ParameterUser));
}

function toParameterUser(u: RawUser): ParameterUser {
    return {
        accountId: u.accountId,
        name: u.name,
        displayName: u.displayName || u.name || u.emailAddress || '',
        emailAddress: u.emailAddress,
    };
}

export default function UsersParameter({ id, value, onChange, allowMultiple, disabled }: ParameterRuntimeUIProps) {
    const selected = useMemo(() => toUsers(value), [value]);
    const [found, setFound] = useState<ParameterUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const search = useCallback(async (text: string) => {
        if (text.trim().length < minSearchLength) {
            setFound([]);
            return;
        }
        setIsSearching(true);
        try {
            const { $jira } = inject('JiraService');
            const users = (await $jira.searchUsers(text.trim(), 20)) as RawUser[];
            setFound(users.map(toParameterUser).filter((u) => !!userId(u)));
        } catch {
            setFound([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const items = useMemo(
        () => found.map((u) => ({ value: userId(u), label: u.emailAddress ? `${u.displayName} (${u.emailAddress})` : u.displayName })),
        [found],
    );
    const selectedItems = useMemo(() => selected.map((u) => ({ value: userId(u), label: u.displayName })), [selected]);

    const handleChange = useCallback(
        (ids: string[]) => {
            const known = new Map([...selected, ...found].map((u) => [userId(u), u]));
            const next = ids.map((uid) => known.get(uid)).filter((u): u is ParameterUser => !!u);
            const limited = allowMultiple ? next : next.slice(-1);
            onChange(limited.length ? limited : undefined);
        },
        [selected, found, allowMultiple, onChange],
    );

    return (
        <AutocompleteMulti
            id={id}
            items={items}
            selectedItems={selectedItems}
            value={selected.map(userId)}
            onChange={(e) => handleChange((e.value ?? []) as string[])}
            onFilter={search}
            minLength={minSearchLength}
            loading={isSearching}
            disabled={disabled}
            maxSelectedItems={allowMultiple ? undefined : 1}
            placeholder="Search Jira users"
        />
    );
}
