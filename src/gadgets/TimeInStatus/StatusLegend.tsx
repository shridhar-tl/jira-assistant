import { memo } from 'react';

import type { StatusInfo } from './types';

interface StatusLegendProps {
    statuses: StatusInfo[];
    statusColors: Record<string, string>;
}

function StatusLegend({ statuses, statusColors }: StatusLegendProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-(--text-secondary)">
            {statuses.map((status) => (
                <span key={status.id} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: statusColors[status.id] }} />
                    {status.name}
                </span>
            ))}
        </div>
    );
}

export default memo(StatusLegend);
