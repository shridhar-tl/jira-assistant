import { memo, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import { Checkbox, TextInput } from '@components';

import { formatSprintDates, getBoardSprints, getSprintState } from './sprint-utils';
import type { AgileSprint } from './types';

interface CustomSprintListProps {
    boardId: number;
    selected: Record<string, boolean>;
    sprintStates?: string;
    onToggle: (sprintId: number, selected: boolean) => void;
}

const searchThreshold = 8;

const stateClassNames: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    future: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    closed: 'bg-(--bg-tertiary) text-(--text-secondary)',
};

function CustomSprintList({ boardId, selected, sprintStates, onToggle }: CustomSprintListProps) {
    const [sprints, setSprints] = useState<AgileSprint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setHasError(false);

        getBoardSprints([boardId], sprintStates)
            .then((result) => !cancelled && setSprints(result[boardId] || []))
            .catch((err: unknown) => {
                console.error('Error pulling sprints for board:', boardId, err);
                if (!cancelled) {
                    setHasError(true);
                }
            })
            .finally(() => !cancelled && setIsLoading(false));

        return () => {
            cancelled = true;
        };
    }, [boardId, sprintStates]);

    const filteredSprints = useMemo(() => {
        const query = search.trim().toLowerCase();
        return query ? sprints.filter((s) => s.name.toLowerCase().includes(query) || String(s.id).startsWith(query)) : sprints;
    }, [sprints, search]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-3 text-sm text-(--text-secondary)">
                <i className="fa fa-spinner fa-spin" />
                <span>Loading sprints...</span>
            </div>
        );
    }

    if (hasError) {
        return <div className="py-3 text-sm text-(--color-error)">Unable to fetch the sprints of this board.</div>;
    }

    if (!sprints.length) {
        return <div className="py-3 text-sm text-(--text-secondary)">No sprints available in this board.</div>;
    }

    return (
        <div className="flex flex-col gap-2">
            {sprints.length > searchThreshold && (
                <TextInput
                    value={search}
                    onChange={(e) => setSearch(e.value)}
                    placeholder="Search sprints"
                    leftIcon={<i className="fa fa-search" />}
                    clearable
                    onClear={() => setSearch('')}
                />
            )}
            <ul className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pe-1">
                {filteredSprints.map((sprint) => {
                    const dates = formatSprintDates(sprint);
                    const isChecked = !!selected[sprint.id];
                    const state = getSprintState(sprint);
                    return (
                        <li
                            key={sprint.id}
                            className={classNames('flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-(--bg-hover)', {
                                'bg-(--primary-light)': isChecked,
                            })}
                        >
                            <Checkbox checked={isChecked} onChange={(e) => onToggle(sprint.id, e.value)} />
                            <button
                                type="button"
                                className="flex min-w-0 flex-1 cursor-pointer flex-col items-start text-left"
                                onClick={() => onToggle(sprint.id, !isChecked)}
                            >
                                <span className="flex w-full items-center gap-2">
                                    <span className="truncate text-sm text-(--text-primary)" title={sprint.name}>
                                        {sprint.name}
                                    </span>
                                    <span
                                        className={classNames(
                                            'ms-auto shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide',
                                            stateClassNames[state] || stateClassNames.closed,
                                        )}
                                    >
                                        {state}
                                    </span>
                                </span>
                                {dates && <span className="text-xs text-(--text-secondary)">{dates}</span>}
                            </button>
                        </li>
                    );
                })}
                {!filteredSprints.length && <li className="px-2 py-1.5 text-sm text-(--text-secondary)">No matching sprints</li>}
            </ul>
        </div>
    );
}

export default memo(CustomSprintList);
