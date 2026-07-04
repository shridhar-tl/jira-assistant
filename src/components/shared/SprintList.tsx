import { useEffect, useState } from 'react';

import { inject } from '@services';

import { Autocomplete } from '@components';

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

export default function SprintList({ rapidViews, value, onChange, placeholder }: SprintListProps) {
    const [sprints, setSprints] = useState<Sprint[] | null>(null);

    useEffect(() => {
        pullSprintList(rapidViews);
    }, [rapidViews]);

    const pullSprintList = async (views: RapidView | RapidView[] | null) => {
        const viewsArray = views ? (Array.isArray(views) ? views : [views]) : [];

        if (!viewsArray || viewsArray.length === 0) {
            setSprints(null);
            onChange([]);
            return;
        }

        const selectedRapidIds = viewsArray.map((r) => r.id);

        if (value && value.length > 0) {
            const filteredValue = value.filter((s) => selectedRapidIds.includes(s.rapidId));
            onChange(filteredValue);
        }

        const jiraService = inject('JiraService');

        const fetchedSprints = await jiraService.$jira.getRapidSprintList(selectedRapidIds);
        const sprintsArray = Array.isArray(fetchedSprints) ? fetchedSprints : Object.values(fetchedSprints).flat();
        const sortedSprints = sprintsArray
            .sort((a: Sprint, b: Sprint) => b.id - a.id)
            .map((s: Sprint) => {
                if (!s.stateAppended) {
                    s.stateAppended = true;
                    s.name += ` - (${s.state || ''})`;
                }
                return s;
            });

        setSprints(sortedSprints);
    };

    const searchSprints = (query: string) => {
        const lowerQuery = (query || '').toLowerCase();
        const sprintIds = value?.map((v) => v.id) || [];

        return (sprints || []).filter(
            (r) => (r.name.toLowerCase().includes(lowerQuery) || r.id.toString().startsWith(query)) && !sprintIds.includes(r.id),
        );
    };

    return (
        <Autocomplete
            items={(sprints || []).map((s) => ({ label: s.name, value: s.id.toString() }))}
            value={value?.[0]?.name || ''}
            onChange={(e: any) => {}}
            placeholder={placeholder || 'Start typing the sprint name here'}
            readonly={!sprints || sprints.length === 0}
        />
    );
}
