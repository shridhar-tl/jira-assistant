import { Button, Multiselect, TextInput } from '@components';

import type { StatusCategory } from '../../shared/types';
import { emptyFilters, hasActiveFilters, usePlannerStore, type BoardFilters } from '../store';
import type { BoardModel } from '../useBoardModel';

interface FilterBarProps {
    model: BoardModel;
}

const statusOptions: { value: StatusCategory; label: string }[] = [
    { value: 'new', label: 'To do' },
    { value: 'indeterminate', label: 'In progress' },
    { value: 'done', label: 'Done' },
];

function setFilters(changes: Partial<BoardFilters>) {
    usePlannerStore.setState((s) => ({ filters: { ...s.filters, ...changes } }));
}

/** Quick search and filters applied across all columns and views (SP-15). */
export default function FilterBar({ model }: FilterBarProps) {
    const filters = usePlannerStore((s) => s.filters);
    const { filterOptions } = model;

    return (
        <div className="grid shrink-0 grid-cols-1 gap-2 border-b border-(--border-primary) bg-(--bg-primary) px-3 py-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <TextInput value={filters.text} onChange={(e) => setFilters({ text: e.value })} placeholder="Search key or summary" leftIcon={<i className="fa fa-search" />} clearable onClear={() => setFilters({ text: '' })} />
            </div>
            <Multiselect options={filterOptions.assignees} value={filters.assignees} onChange={(e) => setFilters({ assignees: e.value as string[] })} placeholder="Assignee" searchable />
            <Multiselect options={filterOptions.parents} value={filters.parents} onChange={(e) => setFilters({ parents: e.value as string[] })} placeholder="Parent / epic" searchable />
            <Multiselect options={filterOptions.labels} value={filters.labels} onChange={(e) => setFilters({ labels: e.value as string[] })} placeholder="Label" searchable />
            <Multiselect options={filterOptions.components} value={filters.components} onChange={(e) => setFilters({ components: e.value as string[] })} placeholder="Component" searchable />
            <Multiselect options={filterOptions.issueTypes} value={filters.issueTypes} onChange={(e) => setFilters({ issueTypes: e.value as string[] })} placeholder="Issue type" />
            <div className="flex items-center gap-2">
                <Multiselect
                    options={statusOptions}
                    value={filters.statusCategories}
                    onChange={(e) => setFilters({ statusCategories: e.value as StatusCategory[] })}
                    placeholder="Status"
                />
                {hasActiveFilters(filters) && (
                    <Button layout="plain" size="sm" leftIcon={<i className="fa fa-times" />} title="Clear filters" ariaLabel="Clear filters" onClick={() => usePlannerStore.setState({ filters: emptyFilters })} />
                )}
            </div>
        </div>
    );
}
