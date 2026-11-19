import { useEffect, useMemo, useState } from 'react';

import { inject } from '@services';

import { Autocomplete, AutocompleteMulti } from '@components';

export interface RapidView {
    id: number;
    name: string;
}

interface RapidViewListProps {
    value: RapidView | RapidView[] | null;
    onChange: (value: RapidView | RapidView[] | null) => void;
    multiple?: boolean;
    placeholder?: string;
}

export default function RapidViewList({ value, onChange, multiple = false, placeholder }: RapidViewListProps) {
    const [rapidViews, setRapidViews] = useState<RapidView[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const jiraService = inject('JiraService');

        jiraService.$jira.getRapidViews().then((views: any[]) => {
            const sortedViews = views.sort((a, b) => a.name.localeCompare(b.name)).map((d) => ({ name: d.name, id: d.id }));

            setRapidViews(sortedViews);
            setIsLoading(false);

            if (value && Array.isArray(value) && value.length) {
                const valIds = value.map((v) => v.id);
                const filteredValue = sortedViews.filter((r) => valIds.includes(r.id));
                onChange(filteredValue);
            }
        });
    }, []);

    if (multiple) {
        return (
            <MultiRapidViewSelect
                rapidViews={rapidViews}
                value={(value as RapidView[]) || []}
                onChange={onChange}
                placeholder={placeholder}
                disabled={isLoading || rapidViews.length === 0}
            />
        );
    }

    return (
        <SingleRapidViewSelect
            rapidViews={rapidViews}
            value={value as RapidView | null}
            onChange={onChange}
            placeholder={placeholder}
            disabled={isLoading || rapidViews.length === 0}
        />
    );
}

const maxSuggestions = 50;

function filterRapidViews(rapidViews: RapidView[], query: string): RapidView[] {
    const search = query.trim().toLowerCase();
    return search ? rapidViews.filter((r) => r.name.toLowerCase().includes(search) || r.id.toString().startsWith(search)) : rapidViews;
}

interface MultiRapidViewSelectProps {
    rapidViews: RapidView[];
    value: RapidView[];
    onChange: (value: RapidView[]) => void;
    placeholder?: string;
    disabled: boolean;
}

function MultiRapidViewSelect({ rapidViews, value, onChange, placeholder, disabled }: MultiRapidViewSelectProps) {
    const [query, setQuery] = useState('');

    const items = useMemo(
        () => filterRapidViews(rapidViews, query).map((r) => ({ label: r.name, value: r.id })),
        [rapidViews, query],
    );

    return (
        <AutocompleteMulti
            items={items}
            value={value.map((v) => v.id)}
            onChange={(e) => {
                const selectedIds = e.value as number[];
                onChange(rapidViews.filter((r) => selectedIds.includes(r.id)));
            }}
            onFilter={setQuery}
            minLength={0}
            placeholder={placeholder || 'Start typing the board name here'}
            readonly={disabled}
        />
    );
}

interface SingleRapidViewSelectProps {
    rapidViews: RapidView[];
    value: RapidView | null;
    onChange: (value: RapidView | null) => void;
    placeholder?: string;
    disabled: boolean;
}

function SingleRapidViewSelect({ rapidViews, value, onChange, placeholder, disabled }: SingleRapidViewSelectProps) {
    const [query, setQuery] = useState(value?.name || '');

    useEffect(() => {
        setQuery(value?.name || '');
    }, [value?.id, value?.name]);

    const items = useMemo(() => {
        const matches = query === value?.name ? rapidViews : filterRapidViews(rapidViews, query);
        return matches.slice(0, maxSuggestions).map((r) => ({ label: r.name, value: r.id }));
    }, [rapidViews, query, value?.name]);

    return (
        <Autocomplete
            items={items}
            value={query}
            selectedValue={value?.id}
            onChange={(e) => {
                setQuery(e.value);
                if (!e.value) {
                    onChange(null);
                }
            }}
            onSelect={(e) => onChange(rapidViews.find((r) => r.id === e.value) || null)}
            minLength={0}
            placeholder={placeholder || 'Start typing the board name here'}
            readonly={disabled}
            emptyMessage="No matching boards"
        />
    );
}
