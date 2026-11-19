import type { MouseEvent } from 'react';

import classNames from 'classnames';

import type { EstimateUnit, SprintCapacity } from '../../../shared/capacity';
import CapacityBar from '../../../shared/components/CapacityBar';
import { formatDateRange, formatNumber, getUnitLabel } from '../../../shared/format';
import type { PlannerSprint } from '../../../shared/types';

interface ColumnHeaderProps {
    title: string;
    sprint: PlannerSprint | null;
    capacity: SprintCapacity | null;
    unit: EstimateUnit;
    healthScore: number | null;
    onHealthClick?: () => void;
    showBoth: boolean;
    issueCount: number;
    totalEstimate: number;
    unestimatedCount: number;
    derivedDates: boolean;
    onCollapse: () => void;
    onMenu?: (event: MouseEvent) => void;
}

const stateClassNames: Record<PlannerSprint['state'], string> = {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    future: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export default function ColumnHeader({
    title,
    sprint,
    capacity,
    unit,
    showBoth,
    issueCount,
    totalEstimate,
    unestimatedCount,
    derivedDates,
    healthScore,
    onHealthClick,
    onCollapse,
    onMenu,
}: ColumnHeaderProps) {
    const committed = capacity ? (unit === 'hours' ? capacity.committedHours : capacity.committedPoints) : 0;
    const available = capacity ? (unit === 'hours' ? capacity.capacityHours : capacity.capacityPoints) : 0;

    return (
        <div className="flex w-full min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-(--text-primary)" title={title}>
                    {title}
                </span>
                {sprint && <span className={classNames('shrink-0 rounded px-1.5 text-[10px] font-medium uppercase', stateClassNames[sprint.state])}>{sprint.state}</span>}
                <span className="flex-1" />
                {healthScore !== null && (
                    <button
                        type="button"
                        className={classNames('shrink-0 cursor-pointer rounded-full px-1.5 text-[10px] font-bold', {
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300': healthScore >= 80,
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300': healthScore >= 60 && healthScore < 80,
                            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300': healthScore < 60,
                        })}
                        title="Sprint health. Open the health view for the details."
                        onClick={onHealthClick}
                    >
                        <i className="fa fa-heartbeat me-0.5" />
                        {healthScore}
                    </button>
                )}
                {onMenu && (
                    <button type="button" className="cursor-pointer rounded px-1 text-(--text-tertiary) hover:bg-(--bg-hover)" onClick={onMenu} aria-label={`Actions for ${title}`} title="Actions">
                        <i className="fa fa-ellipsis-v" />
                    </button>
                )}
                <button type="button" className="cursor-pointer rounded px-1 text-(--text-tertiary) hover:bg-(--bg-hover)" onClick={onCollapse} aria-label={`Collapse ${title}`} title="Collapse">
                    <i className="fa fa-angle-double-left" />
                </button>
            </div>

            {sprint && (
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-(--text-secondary)">
                    <span className={classNames({ italic: derivedDates })} title={derivedDates ? 'Dates are not set in Jira. Estimated from the previous sprint.' : undefined}>
                        <i className="fa fa-calendar me-1" />
                        {formatDateRange(capacity?.range?.start || sprint.startDate, capacity?.range?.end || sprint.endDate)}
                    </span>
                    {capacity && capacity.overridePercent !== 100 && <span title="Capacity override for this sprint">@{capacity.overridePercent}%</span>}
                </div>
            )}

            {sprint?.goal && (
                <div className="truncate text-[11px] text-(--text-secondary)" title={sprint.goal}>
                    <i className="fa fa-bullseye me-1" />
                    {sprint.goal}
                </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-(--text-secondary)">
                <span>{issueCount} issues</span>
                <span>
                    {formatNumber(totalEstimate)} {getUnitLabel(unit)}
                </span>
                {unestimatedCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400" title="Issues without an estimate">
                        <i className="fa fa-question-circle me-0.5" />
                        {unestimatedCount}
                    </span>
                )}
            </div>

            {capacity && (
                <>
                    <CapacityBar committed={committed} capacity={available} level={capacity.level} unit={getUnitLabel(unit)} label="Capacity" />
                    {showBoth && unit === 'points' && (
                        <div className="text-[11px] text-(--text-secondary)">
                            {formatNumber(capacity.committedHours)} / {formatNumber(capacity.capacityHours)} h
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
