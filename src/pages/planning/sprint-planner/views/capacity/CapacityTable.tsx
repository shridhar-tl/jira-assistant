import classNames from 'classnames';

import type { CapacityLevel, SprintCapacity } from '../../../shared/capacity';
import UserAvatar from '../../../shared/components/UserAvatar';
import { formatDateRange, formatNumber } from '../../../shared/format';
import type { PlannerSprint, TeamMember } from '../../../shared/types';

interface CapacityTableProps {
    sprints: PlannerSprint[];
    capacities: Map<number, SprintCapacity>;
    members: TeamMember[];
    unit: 'points' | 'hours';
    showHours: boolean;
}

const levelClassNames: Record<CapacityLevel, string> = {
    none: '',
    under: 'text-emerald-700 dark:text-emerald-400',
    near: 'text-amber-700 dark:text-amber-400',
    over: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

/** Members × sprints with available, committed, remaining and utilisation, and team totals (CP-6). */
export default function CapacityTable({ sprints, capacities, members, unit, showHours }: CapacityTableProps) {
    const unitLabel = unit === 'hours' ? 'h' : 'pts';
    const value = (hours: number, points: number) => (unit === 'hours' ? hours : points);

    return (
        <div className="overflow-x-auto rounded-lg border border-(--border-primary)">
            <table className="exportable w-full border-collapse text-sm" data-export-sheet-name="Capacity">
                <thead>
                    <tr className="bg-(--bg-secondary) text-xs text-(--text-secondary)">
                        <th className="sticky left-0 z-1 min-w-44 bg-(--bg-secondary) px-2 py-1.5 text-left">Member</th>
                        {sprints.map((s) => (
                            <th key={s.id} className="min-w-40 border-l border-(--border-primary) px-2 py-1.5 text-left" colSpan={1}>
                                <div className="truncate font-semibold text-(--text-primary)">{s.name}</div>
                                <div className="font-normal">{formatDateRange(capacities.get(s.id)?.range?.start, capacities.get(s.id)?.range?.end)}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <tr key={member.id} className="border-t border-(--border-secondary)">
                            <td className="sticky left-0 z-1 bg-(--bg-primary) px-2 py-1">
                                <div className="flex items-center gap-1.5">
                                    <UserAvatar name={member.displayName} avatarUrl={member.avatarUrl} size="xs" />
                                    <span className="truncate">{member.displayName}</span>
                                    {member.allocation < 100 && <span className="text-[10px] text-(--text-tertiary)">{member.allocation}%</span>}
                                </div>
                            </td>
                            {sprints.map((s) => {
                                const row = capacities.get(s.id)?.members.find((m) => m.member.id === member.id);
                                if (!row) {
                                    return <td key={s.id} className="border-l border-(--border-primary) px-2 py-1" />;
                                }
                                const available = value(row.capacityHours, row.capacityPoints);
                                const committed = value(row.committedHours, row.committedPoints);
                                const utilisation = available > 0 ? Math.round((committed * 100) / available) : null;
                                return (
                                    <td key={s.id} className={classNames('border-l border-(--border-primary) px-2 py-1 text-xs', levelClassNames[row.level])}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span title="Committed / available" data-export-data={`${formatNumber(committed)} / ${formatNumber(available)} ${unitLabel}`}>
                                                <b>{formatNumber(committed)}</b> / {formatNumber(available)} {unitLabel}
                                            </span>
                                            <span title="Utilisation">{utilisation === null ? '–' : `${utilisation}%`}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-(--text-secondary)">
                                            <span title="Remaining">{formatNumber(available - committed)} left</span>
                                            {showHours && unit === 'points' && <span>{formatNumber(row.capacityHours)} h</span>}
                                            {row.availability.leaveDays > 0 && (
                                                <span className="text-sky-600 dark:text-sky-400" title="Leave days">
                                                    <i className="fa fa-plane me-0.5" />
                                                    {row.availability.leaveDays}
                                                </span>
                                            )}
                                            {row.availability.holidayDays > 0 && (
                                                <span className="text-violet-600 dark:text-violet-400" title="Holidays">
                                                    <i className="fa fa-flag me-0.5" />
                                                    {row.availability.holidayDays}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-(--border-primary) bg-(--bg-secondary) text-xs font-semibold">
                        <td className="sticky left-0 z-1 bg-(--bg-secondary) px-2 py-1.5">Team</td>
                        {sprints.map((s) => {
                            const capacity = capacities.get(s.id);
                            if (!capacity) {
                                return <td key={s.id} />;
                            }
                            const available = value(capacity.capacityHours, capacity.capacityPoints);
                            const committed = value(capacity.committedHours, capacity.committedPoints);
                            return (
                                <td key={s.id} className={classNames('border-l border-(--border-primary) px-2 py-1.5', levelClassNames[capacity.level])}>
                                    <div data-export-data={`${formatNumber(committed)} / ${formatNumber(available)} ${unitLabel}`}>
                                        {formatNumber(committed)} / {formatNumber(available)} {unitLabel} · {capacity.percent ?? '–'}%
                                    </div>
                                    <div className="font-normal text-(--text-secondary)">
                                        {formatNumber(available - committed)} left
                                        {capacity.overridePercent !== 100 && ` · override ${capacity.overridePercent}%`}
                                        {capacity.unassignedCount > 0 && ` · ${capacity.unassignedCount} unassigned`}
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
