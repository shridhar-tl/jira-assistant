import { Button } from '@components';

import type { WorkloadHeatmapSettings } from './types';

interface FilterSummaryProps {
    settings: WorkloadHeatmapSettings;
    onClear: () => void;
}

export default function FilterSummary({ settings, onClear }: FilterSummaryProps) {
    const { projects, issueTypes, includeSubtasks } = settings;

    const parts: string[] = [];
    if (projects.length) {
        parts.push(`Projects: ${projects.join(', ')}`);
    }
    if (issueTypes.length) {
        parts.push(`Issue types: ${issueTypes.join(', ')}`);
    }
    if (!includeSubtasks) {
        parts.push('Subtasks excluded');
    }

    if (!parts.length) {
        return null;
    }

    return (
        <div className="flex shrink-0 flex-wrap items-center gap-x-2 border-b border-(--border-primary) px-3 py-1 text-xs text-(--text-secondary)">
            <i className="fa fa-filter" />
            <span>{parts.join(' · ')}</span>
            <Button layout="plain" size="xs" label="Clear filters" onClick={onClear} />
        </div>
    );
}
