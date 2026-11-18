import { useEffect, useMemo, useState } from 'react';

import type { ComponentEvent } from 'fluxo-ui';

import { inject } from '@services';

import { AutocompleteMulti } from '@components';

export interface Sprint {
    id: number;
    name: string;
    rapidId: number;
    state: string;
    stateAppended?: boolean;
}

interface RapidView {
    id: number;
    name: string;
}

interface SprintListProps {
    rapidViews: RapidView | RapidView[] | null;
    value: Sprint[];
    onChange: (value: Sprint[]) => void;
    placeholder?: string;
}

function toRapidViewArray(views: RapidView | RapidView[] | null): RapidView[] {
    if (!views) return [];
    return Array.isArray(views) ? views : [views];
}

export default function SprintList({ rapidViews, value, onChange, placeholder }: SprintListProps) {
    const [sprints, setSprints] = useState<Sprint[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        const viewsArray = toRapidViewArray(rapidViews);

        if (viewsArray.length === 0) {
            setSprints(null);
            onChange([]);
            return;
        }

        const selectedRapidIds = viewsArray.map((r) => r.id);

        if (value && value.length > 0) {
            const filteredValue = value.filter((s) => selectedRapidIds.includes(s.rapidId));
            if (filteredValue.length !== value.length) {
                onChange(filteredValue);
            }
        }

        const { $jira } = inject('JiraService');
        $jira.getRapidSprintList(selectedRapidIds).then((fetchedSprints) => {
            if (cancelled) return;
            const sprintsArray: Sprint[] = Array.isArray(fetchedSprints) ? fetchedSprints : Object.values(fetchedSprints).flat();
            const sortedSprints = [...sprintsArray]
                .sort((a, b) => b.id - a.id)
                .map((s) => (s.stateAppended ? s : { ...s, stateAppended: true, name: `${s.name} - (${s.state || ''})` }));
            setSprints(sortedSprints);
        });

        return () => {
            cancelled = true;
        };
    }, [rapidViews]);

    const items = useMemo(() => (sprints || []).map((s) => ({ label: s.name, value: s.id.toString() })), [sprints]);
    const selectedIds = useMemo(() => (value || []).map((s) => s.id.toString()), [value]);

    const handleChange = (e: ComponentEvent<string[]>) => {
        const available = [...(sprints || []), ...(value || [])];
        const selected = e.value
            .map((id) => available.find((s) => s.id.toString() === id))
            .filter((s): s is Sprint => !!s);
        onChange(selected);
    };

    return (
        <AutocompleteMulti
            items={items}
            value={selectedIds}
            onChange={handleChange}
            minLength={0}
            placeholder={placeholder || 'Start typing the sprint name here'}
            disabled={!sprints || sprints.length === 0}
        />
    );
}
