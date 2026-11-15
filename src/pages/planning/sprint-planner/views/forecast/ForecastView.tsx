import { useMemo, useState } from 'react';

import { addDays, differenceInCalendarDays } from 'date-fns';

import { Button, Checkbox, ProgressBar } from '@components';

import { backlogColumnId } from '../../../shared/board-loader';
import { getCapacityLevel, getIssueHours, getIssuePoints, isIssueEstimated } from '../../../shared/capacity';
import CapacityBar from '../../../shared/components/CapacityBar';
import { forecastBacklog, getNextSprintName, unplacedReasonLabels, type ForecastItem, type ForecastSprint } from '../../../shared/forecast';
import { formatDateRange, formatNumber, getDisplayUnit, getUnitLabel } from '../../../shared/format';
import { acceptForecast, type ForecastAcceptGroup, type ForecastAcceptResult } from '../../actions';
import { usePlannerStore } from '../../store';
import type { BoardModel } from '../../useBoardModel';

interface ForecastViewProps {
    model: BoardModel;
}

interface VirtualSprintInfo {
    name: string;
    startDate: Date;
    endDate: Date;
}

/** Projects the ranked backlog into the upcoming sprints by capacity (FC-1 to FC-4). Nothing is written until the forecast is accepted. */
export default function ForecastView({ model }: ForecastViewProps) {
    const { data, openSprints, capacities, blocking, velocity } = model;
    const settings = usePlannerStore((s) => s.settings);
    const permissions = data.permissions;
    const unit = getDisplayUnit(data.team.planningUnit, data.estimateUnit);
    const [excluded, setExcluded] = useState<Set<string>>(new Set());
    const [progress, setProgress] = useState<number | null>(null);
    const [results, setResults] = useState<ForecastAcceptResult[] | null>(null);

    const { forecast, virtualSprints } = useMemo(() => {
        const future = openSprints.filter((s) => s.state === 'future').slice(0, settings.forecastSprintCount);
        const sprints: ForecastSprint[] = future.map((s) => {
            const capacity = capacities.get(s.id);
            return {
                id: String(s.id),
                name: s.name,
                capacity: capacity ? (unit === 'hours' ? capacity.capacityHours : capacity.capacityPoints) : 0,
                committed: capacity ? (unit === 'hours' ? capacity.committedHours : capacity.committedPoints) : 0,
                isVirtual: false,
                sprintId: s.id,
            };
        });

        const virtual = new Map<string, VirtualSprintInfo>();
        const lastSprint = openSprints[openSprints.length - 1];
        const lastRange = lastSprint ? data.sprintRanges.get(lastSprint.id) : undefined;
        const typicalCapacity =
            unit === 'points' && velocity?.selected
                ? velocity.selected
                : sprints.length
                  ? sprints.reduce((sum, s) => sum + s.capacity, 0) / sprints.length
                  : lastSprint
                    ? (unit === 'hours' ? capacities.get(lastSprint.id)?.capacityHours : capacities.get(lastSprint.id)?.capacityPoints) || 0
                    : 0;

        if (lastRange && typicalCapacity > 0) {
            const length = Math.max(1, differenceInCalendarDays(lastRange.end, lastRange.start) + 1);
            for (let i = sprints.length; i < settings.forecastSprintCount; i++) {
                const offset = i - sprints.length + 1;
                const startDate = addDays(lastRange.end, 1 + (offset - 1) * length);
                const info = { name: getNextSprintName(lastSprint?.name, offset, data.board.name), startDate, endDate: addDays(startDate, length - 1) };
                const id = `virtual-${offset}`;
                virtual.set(id, info);
                sprints.push({ id, name: info.name, capacity: typicalCapacity, committed: 0, isVirtual: true, sprintId: null });
            }
        }

        const items: ForecastItem[] = (data.columns[backlogColumnId] || [])
            .map((key) => data.issues[key])
            .filter((issue) => issue && issue.statusCategory !== 'done' && !excluded.has(issue.key))
            .map((issue) => ({
                key: issue.key,
                size: isIssueEstimated(issue, data.estimateUnit) ? (unit === 'hours' ? getIssueHours(issue) : getIssuePoints(issue, data.estimateUnit)) : null,
            }));

        const existingSprintOf = (key: string) => {
            const issue = data.issues[key];
            return issue?.currentSprintId ? String(issue.currentSprintId) : null;
        };

        return {
            forecast: forecastBacklog(items, sprints, blocking, existingSprintOf, settings.dependencyAwareForecast),
            virtualSprints: virtual,
        };
    }, [openSprints, capacities, data, settings.forecastSprintCount, settings.dependencyAwareForecast, unit, velocity, blocking, excluded]);

    const [accepted, setAccepted] = useState<Set<string>>(new Set());
    const isAccepted = (key: string) => !accepted.has(`x:${key}`);
    const toggleAccepted = (key: string) =>
        setAccepted((prev) => {
            const next = new Set(prev);
            const id = `x:${key}`;
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const acceptedCount = forecast.placements.filter((p) => isAccepted(p.key)).length;

    const accept = async () => {
        const groups: ForecastAcceptGroup[] = forecast.sprints
            .map((sprint) => ({
                sprintId: sprint.sprintId,
                newSprint: sprint.isVirtual ? virtualSprints.get(sprint.id) || null : null,
                keys: sprint.items.filter(isAccepted),
            }))
            .filter((g) => g.keys.length);
        setProgress(0);
        setResults(null);
        const outcome = await acceptForecast(groups, (done, total) => setProgress(Math.round((done * 100) / total)));
        setResults(outcome);
        setProgress(null);
    };

    const unitLabel = getUnitLabel(unit);

    if (!openSprints.length && !forecast.sprints.length) {
        return <div className="p-6 text-center text-sm text-(--text-secondary)">Create a sprint first. The forecast fills the upcoming sprints from the backlog.</div>;
    }

    return (
        <div className="flex flex-col gap-3 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-(--text-secondary)">
                    Preview of where the ranked backlog would land. {forecast.placements.length} items placed, {forecast.unplaced.length} not placed.
                    {velocity && unit === 'points' && ` Velocity ${formatNumber(velocity.selected)} ${unitLabel}.`}
                </span>
                <span className="flex-1" />
                {progress !== null && <ProgressBar value={progress} className="w-40" />}
                {permissions.scheduleIssues && (
                    <Button
                        label={`Accept ${acceptedCount} items`}
                        leftIcon={<i className="fa fa-check" />}
                        disabled={!acceptedCount || progress !== null}
                        confirmText={`Move ${acceptedCount} issues into the sprints${virtualSprints.size ? ' and create the new sprints' : ''}?`}
                        onClick={accept}
                    />
                )}
            </div>

            {results && (
                <div className="flex flex-col gap-1 rounded border border-(--border-primary) p-2 text-sm">
                    {results.map((r) => (
                        <div key={r.label} className="flex items-center gap-2">
                            <i className={r.ok ? 'fa fa-check text-emerald-600' : 'fa fa-times text-red-600'} />
                            <span>
                                {r.label}: {r.keys.length} issues {r.ok ? 'moved' : 'could not be moved'}
                            </span>
                            {!r.ok && <span className="text-xs text-(--text-secondary)">{r.keys.join(', ')}</span>}
                        </div>
                    ))}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="exportable w-full border-collapse text-sm" data-export-sheet-name="Forecast">
                    <thead>
                        <tr className="bg-(--bg-secondary) text-left text-xs text-(--text-secondary)">
                            <th className="px-2 py-1.5">Sprint</th>
                            <th className="px-2 py-1.5">Dates</th>
                            <th className="px-2 py-1.5">Load</th>
                            <th className="px-2 py-1.5">Forecast items</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forecast.sprints.map((sprint) => {
                            const real = sprint.sprintId ? data.sprintRanges.get(sprint.sprintId) : null;
                            const info = sprint.isVirtual ? virtualSprints.get(sprint.id) : null;
                            const total = sprint.committed + sprint.planned;
                            return (
                                <tr key={sprint.id} className="border-t border-(--border-secondary) align-top">
                                    <td className="px-2 py-1.5">
                                        <div className="font-medium">{sprint.name}</div>
                                        {sprint.isVirtual && <div className="text-[11px] text-(--text-tertiary)">Will be created</div>}
                                    </td>
                                    <td className="whitespace-nowrap px-2 py-1.5 text-xs">{formatDateRange(real?.start || info?.startDate, real?.end || info?.endDate)}</td>
                                    <td className="min-w-44 px-2 py-1.5" data-export-data={`${formatNumber(total)} / ${formatNumber(sprint.capacity)} ${unitLabel}`}>
                                        <CapacityBar committed={total} capacity={sprint.capacity} level={getCapacityLevel(total, sprint.capacity)} unit={unitLabel} label={`${formatNumber(sprint.committed)} already in`} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <div className="flex flex-col gap-0.5">
                                            {sprint.items.map((key) => {
                                                const issue = data.issues[key];
                                                const size = forecast.placements.find((p) => p.key === key)?.size;
                                                return (
                                                    <div key={key} className="flex items-center gap-2">
                                                        <Checkbox checked={isAccepted(key)} onChange={() => toggleAccepted(key)} />
                                                        <a href={issue.url} target="_blank" rel="noreferrer" className="shrink-0 cursor-pointer font-medium hover:underline">
                                                            {key}
                                                        </a>
                                                        <span className="min-w-0 flex-1 truncate" title={issue.summary}>
                                                            {issue.summary}
                                                        </span>
                                                        <span className="shrink-0 text-xs text-(--text-secondary)">
                                                            {formatNumber(size)} {unitLabel}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {!sprint.items.length && <span className="text-xs text-(--text-tertiary)">Nothing more fits</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {forecast.unplaced.length > 0 && (
                <section className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold">Not placed</h3>
                    <div className="flex flex-col gap-0.5 text-sm">
                        {forecast.unplaced.map(({ key, reason }) => (
                            <div key={key} className="flex items-center gap-2">
                                <a href={data.issues[key]?.url} target="_blank" rel="noreferrer" className="shrink-0 cursor-pointer font-medium hover:underline">
                                    {key}
                                </a>
                                <span className="min-w-0 flex-1 truncate">{data.issues[key]?.summary}</span>
                                <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">{unplacedReasonLabels[reason]}</span>
                                <Button size="xs" layout="plain" leftIcon={<i className="fa fa-eye-slash" />} ariaLabel="Leave out of the forecast" title="Leave out of the forecast" onClick={() => setExcluded((prev) => new Set(prev).add(key))} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {excluded.size > 0 && (
                <Button size="sm" layout="plain" label={`Include ${excluded.size} left out items again`} onClick={() => setExcluded(new Set())} />
            )}
        </div>
    );
}
