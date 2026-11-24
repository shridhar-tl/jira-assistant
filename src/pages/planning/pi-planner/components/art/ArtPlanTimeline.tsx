import classNames from 'classnames';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

import { Button } from '@components';

import { parseDateKey } from '../../../shared/segments';
import { getPiStatus } from '../../pi-model';
import type { PiSummary } from '../../pi-types';

interface ArtPlanTimelineProps {
    plans: PiSummary[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

const statusClassNames = {
    past: 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
    current: 'bg-(--primary-color) text-white',
    future: 'bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-100',
};

/** The plans of an ART on one time line, so the cadence and the plan in progress are seen at a glance. */
export default function ArtPlanTimeline({ plans, selectedId, onSelect }: ArtPlanTimelineProps) {
    if (!plans.length) {
        return null;
    }
    const sorted = [...plans].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const start = parseDateKey(sorted[0].startDate);
    const end = parseDateKey(sorted.reduce((max, p) => (p.endDate > max ? p.endDate : max), sorted[0].endDate));
    const span = Math.max(1, differenceInCalendarDays(end, start) + 1);
    const today = startOfDay(new Date());
    const todayOffset = differenceInCalendarDays(today, start);
    const position = (date: string) => (differenceInCalendarDays(parseDateKey(date), start) * 100) / span;

    return (
        <div className="overflow-hidden rounded-lg bg-(--bg-secondary) p-2">
            <div className="relative flex flex-col gap-1" aria-label="Plans on a time line">
            {sorted.map((plan) => {
                const left = position(plan.startDate);
                const width = Math.max(4, ((differenceInCalendarDays(parseDateKey(plan.endDate), parseDateKey(plan.startDate)) + 1) * 100) / span);
                const status = getPiStatus(plan);
                return (
                    <div key={plan.id} className="relative h-7">
                        <Button
                            size="xs"
                            layout="rounded"
                            label={plan.name}
                            title={`${plan.name}: ${plan.startDate} to ${plan.endDate}`}
                            className={classNames('absolute top-0 h-7 justify-start truncate', statusClassNames[status], { 'ring-2 ring-(--text-primary) ring-offset-1': plan.id === selectedId })}
                            style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                            onClick={() => onSelect(plan.id)}
                        />
                    </div>
                );
            })}
            {todayOffset >= 0 && todayOffset <= span && (
                <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-red-500" style={{ left: `${(todayOffset * 100) / span}%` }} title="Today" />
            )}
            </div>
        </div>
    );
}
