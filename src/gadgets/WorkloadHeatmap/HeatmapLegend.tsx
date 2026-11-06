import classNames from 'classnames';

import { loadLevelClassNames, loadLevelLegend } from './constants';
import { formatHours } from './format-utils';

interface HeatmapLegendProps {
    capacityPerDay: number;
}

export default function HeatmapLegend({ capacityPerDay }: HeatmapLegendProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-(--text-secondary)">
            {loadLevelLegend.map(({ level, label }) => (
                <span key={level} className="inline-flex items-center gap-1.5">
                    <span
                        className={classNames(
                            'heat-swatch h-3 w-3 rounded-sm border border-(--border-primary)',
                            loadLevelClassNames[level],
                            {
                                'bg-(--bg-primary)': level === 'none',
                            },
                        )}
                    />
                    {label}
                </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
                <span className="heat-today inline-block h-3 w-3 rounded-sm" />
                Today
            </span>
            <span className="ms-auto">Daily capacity: {formatHours(capacityPerDay)} per person</span>
        </div>
    );
}
