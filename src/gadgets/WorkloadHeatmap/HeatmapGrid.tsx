import { format } from 'date-fns';
import classNames from 'classnames';

import HeatmapCell from './HeatmapCell';
import SummaryCell from './SummaryCell';
import type { GroupLoadRow, HeatmapDay, HeatmapModel } from './types';
import UserCell from './UserCell';

interface HeatmapGridProps {
    model: HeatmapModel;
}

const stickyHeadClass = 'sticky top-0 z-2 border-b border-r border-(--border-primary) bg-(--bg-secondary) px-1 py-1.5';

function DayHeader({ day }: { day: HeatmapDay }) {
    return (
        <th
            className={classNames(stickyHeadClass, 'min-w-16 text-center font-medium', {
                'heat-today': day.isToday,
                'text-(--text-tertiary)': !day.isWorkingDay || day.isPast,
                'text-(--text-secondary)': day.isWorkingDay && !day.isPast,
            })}
        >
            <div className="text-[11px] uppercase">{day.isToday ? 'Today' : format(day.date, 'EEE')}</div>
            <div className="text-xs font-semibold text-(--text-primary)">{format(day.date, 'dd MMM')}</div>
        </th>
    );
}

function GroupRows({ group, days }: { group: GroupLoadRow; days: HeatmapDay[] }) {
    return (
        <>
            <tr>
                <td className="sticky left-0 z-1 border-b border-r border-(--border-primary) bg-(--bg-secondary) px-2 py-1">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-(--text-primary)">
                        <span className="fa fa-users text-xs text-(--primary-color)" />
                        <span className="truncate" title={group.name}>
                            {group.name}
                        </span>
                        <span className="shrink-0 text-[11px] font-normal text-(--text-secondary)">({group.users.length})</span>
                    </div>
                </td>
                {days.map((day) => (
                    <SummaryCell
                        key={day.key}
                        summary={group.days[day.key]}
                        isToday={day.isToday}
                        isPast={day.isPast}
                        isWorkingDay={day.isWorkingDay}
                    />
                ))}
                <SummaryCell summary={group.total} emphasis />
            </tr>
            {group.users.map((row) => (
                <tr key={row.user.id} className="hover:bg-(--bg-hover)">
                    <UserCell row={row} />
                    {days.map((day) => (
                        <HeatmapCell key={day.key} day={day} load={row.days[day.key]} userName={row.user.displayName} />
                    ))}
                    <SummaryCell summary={row.total} emphasis />
                </tr>
            ))}
        </>
    );
}

export default function HeatmapGrid({ model }: HeatmapGridProps) {
    const { days, groups, summary, total } = model;

    return (
        <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-separate border-spacing-0 text-xs">
                <thead>
                    <tr>
                        <th
                            className={classNames(
                                stickyHeadClass,
                                'left-0 z-3 min-w-36 text-left text-[13px] font-semibold text-(--text-primary)',
                            )}
                        >
                            Team member
                        </th>
                        {days.map((day) => (
                            <DayHeader key={day.key} day={day} />
                        ))}
                        <th className={classNames(stickyHeadClass, 'min-w-16 text-center text-xs font-semibold text-(--text-primary)')}>
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map((group) => (
                        <GroupRows key={group.name} group={group} days={days} />
                    ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-2 bg-(--bg-secondary)">
                    <tr>
                        <td className="sticky left-0 z-3 border-t border-r border-(--border-primary) bg-(--bg-secondary) px-2 py-1 text-[13px] font-semibold text-(--text-primary)">
                            Team total
                        </td>
                        {days.map((day) => (
                            <SummaryCell
                                key={day.key}
                                summary={summary[day.key]}
                                isToday={day.isToday}
                                isPast={day.isPast}
                                isWorkingDay={day.isWorkingDay}
                                emphasis
                            />
                        ))}
                        <SummaryCell summary={total} emphasis />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
