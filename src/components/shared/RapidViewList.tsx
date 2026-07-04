import { useEffect, useState } from 'react';

import { inject } from '@services';

import { AutocompleteMulti, SelectButton } from '@components';

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
        const selectedIds = (value as RapidView[] || []).map((v) => v.id);

        return (
            <AutocompleteMulti
                items={rapidViews.map((r) => ({ label: r.name, value: r.id }))}
                value={selectedIds}
                onChange={(e) => {
                    const selectedViews = rapidViews.filter((r) => (e.value as number[]).includes(r.id));
                    onChange(selectedViews);
                }}
                placeholder={placeholder || 'Start typing the board name here'}
                readonly={isLoading || rapidViews.length === 0}
            />
        );
    }

    return (
        <SelectButton
            items={rapidViews.map((r) => ({ label: r.name, value: r.id.toString() }))}
            value={(value as RapidView)?.id.toString() || ''}
            onChange={(e: any) => {
                const selected = rapidViews.find((r) => r.id.toString() === e);
                onChange(selected || null);
            }}
            disabled={isLoading || rapidViews.length === 0}
        />
    );
}
