import { memo, useEffect, useMemo, useState } from 'react';

import { Dropdown, formatSprintDates, getSprintState, type AgileSprint } from '@components';

import { activeSprintValue } from './constants';
import { getOpenSprints } from './date-range';
import type { HeatmapDateRange } from './types';

interface SprintSwitcherProps {
    boardId: number;
    sprintId: number | null;
    range: HeatmapDateRange | null;
    onChange: (sprintId: number | null) => void;
}

function toOptionLabel(sprint: AgileSprint): string {
    const dates = formatSprintDates(sprint);
    return `${sprint.name} (${getSprintState(sprint)}${dates ? `: ${dates}` : ''})`;
}

function SprintSwitcher({ boardId, sprintId, range, onChange }: SprintSwitcherProps) {
    const [sprints, setSprints] = useState<AgileSprint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);

        getOpenSprints(boardId)
            .then((result) => !cancelled && setSprints(result))
            .catch((err: unknown) => console.error('Failed to load the sprints of the board:', err))
            .finally(() => !cancelled && setIsLoading(false));

        return () => {
            cancelled = true;
        };
    }, [boardId]);

    const options = useMemo(
        () => [
            { value: activeSprintValue, label: 'Active sprint' },
            ...sprints.map((s) => ({ value: String(s.id), label: toOptionLabel(s) })),
        ],
        [sprints],
    );

    const isOpenSprint = !!sprintId && (isLoading || sprints.some((s) => s.id === sprintId));

    return (
        <div className="w-44 sm:w-56" title={range ? [range.sprintName, range.label].filter(Boolean).join(' · ') : undefined}>
            <Dropdown
                options={options}
                value={isOpenSprint ? String(sprintId) : activeSprintValue}
                onChange={(e) => onChange(e.value && e.value !== activeSprintValue ? Number(e.value) : null)}
                loading={isLoading}
                searchable={sprints.length > 8}
                className="w-full"
            />
        </div>
    );
}

export default memo(SprintSwitcher);
