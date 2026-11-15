import classNames from 'classnames';

import type { SprintCapacity } from '../../../shared/capacity';
import CapacityBar from '../../../shared/components/CapacityBar';
import UserAvatar from '../../../shared/components/UserAvatar';
import { formatNumber, getUnitLabel } from '../../../shared/format';

interface AssigneeBreakdownProps {
    capacity: SprintCapacity;
    unit: 'points' | 'hours';
    onSelectMember?: (memberId: string) => void;
}

/** Committed vs individual capacity of each member in the sprint. Over-allocated people are highlighted. */
export default function AssigneeBreakdown({ capacity, unit, onSelectMember }: AssigneeBreakdownProps) {
    const unitLabel = getUnitLabel(unit);
    const rows = [...capacity.members]
        .filter((m) => m.capacityHours > 0 || m.committedHours > 0 || m.committedPoints > 0)
        .sort((a, b) => a.member.displayName.localeCompare(b.member.displayName));

    return (
        <div className="flex flex-col gap-1.5 py-1">
            {rows.map((row) => {
                const committed = unit === 'hours' ? row.committedHours : row.committedPoints;
                const available = unit === 'hours' ? row.capacityHours : row.capacityPoints;
                return (
                    <button
                        type="button"
                        key={row.member.id}
                        className={classNames('flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-(--bg-hover)', {
                            'bg-red-50 dark:bg-red-900/20': row.level === 'over',
                        })}
                        onClick={() => onSelectMember?.(row.member.id)}
                        title={`${row.member.displayName}: ${row.availability.leaveDays} leave days, ${row.availability.holidayDays} holidays`}
                    >
                        <UserAvatar name={row.member.displayName} avatarUrl={row.member.avatarUrl} size="xs" />
                        <CapacityBar
                            className="flex-1"
                            committed={committed}
                            capacity={available}
                            level={row.level}
                            unit={unitLabel}
                            label={row.member.displayName}
                        />
                        {row.availability.leaveDays > 0 && <i className="fa fa-plane text-[10px] text-sky-500" title={`${row.availability.leaveDays} days of leave`} />}
                    </button>
                );
            })}
            {capacity.unassignedCount > 0 && (
                <div className="px-1 text-[11px] text-amber-600 dark:text-amber-400">
                    Unassigned: {capacity.unassignedCount} issues ·{' '}
                    {formatNumber(unit === 'hours' ? capacity.unassignedHours : capacity.unassignedPoints)} {unitLabel}
                </div>
            )}
            {!rows.length && !capacity.unassignedCount && <div className="px-1 text-[11px] text-(--text-tertiary)">No team members with capacity in this sprint.</div>}
        </div>
    );
}
