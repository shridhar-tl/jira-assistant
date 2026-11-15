import { useEffect, useState, type KeyboardEvent } from 'react';

import { Button, Dropdown, NumericInput } from '@components';

import { formatNumber, formatShortDate } from '../../../shared/format';
import type { TeamDefinition, VelocityChoice, VelocityMode, VelocitySummary } from '../../../shared/types';
import { loadVelocityData, saveTeam } from '../../actions';
import { usePlannerStore } from '../../store';

interface VelocityPanelProps {
    team: TeamDefinition;
    velocity: VelocitySummary | null;
    unitLabel: string;
    readOnly: boolean;
}

const modeOptions: { value: VelocityMode; label: string }[] = [
    { value: 'avgCompleted', label: 'Average completed' },
    { value: 'avgCommitted', label: 'Average committed' },
    { value: 'median', label: 'Median completed' },
    { value: 'last', label: 'Last sprint' },
    { value: 'custom', label: 'Custom value' },
];

export default function VelocityPanel({ team, velocity, unitLabel, readOnly }: VelocityPanelProps) {
    const isLoading = usePlannerStore((s) => s.isVelocityLoading);
    const error = usePlannerStore((s) => s.velocityError);
    const choice = team.velocity;

    const [custom, setCustom] = useState<number | undefined>(choice.custom ?? undefined);
    const [sprintCount, setSprintCount] = useState<number | undefined>(choice.sprintCount);

    useEffect(() => {
        setCustom(choice.custom ?? undefined);
        setSprintCount(choice.sprintCount);
    }, [choice.custom, choice.sprintCount]);

    const update = (changes: Partial<VelocityChoice>) => saveTeam({ ...team, velocity: { ...choice, ...changes } });

    const commitCustom = () => {
        if ((custom ?? null) !== choice.custom) {
            update({ custom: custom ?? null });
        }
    };
    const commitSprintCount = () => {
        if (sprintCount && sprintCount !== choice.sprintCount) {
            update({ sprintCount });
        } else if (!sprintCount) {
            setSprintCount(choice.sprintCount);
        }
    };
    const blurOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <section className="flex flex-col gap-2 rounded-lg border border-(--border-primary) p-3">
            <div className="flex flex-wrap items-end gap-2">
                <h3 className="me-auto text-sm font-semibold">Velocity</h3>
                <div className="w-48">
                    <Dropdown options={modeOptions} value={choice.mode} onChange={(e) => update({ mode: e.value as VelocityMode })} readOnly={readOnly} />
                </div>
                {choice.mode === 'custom' && (
                    <div className="w-28">
                        <NumericInput value={custom} min={0} onChange={(e) => setCustom(e.value)} onBlur={commitCustom} onKeyDown={blurOnEnter} readonly={readOnly} placeholder={unitLabel} />
                    </div>
                )}
                <div className="w-28" title="Number of closed sprints used">
                    <NumericInput value={sprintCount} min={1} max={12} onChange={(e) => setSprintCount(e.value)} onBlur={commitSprintCount} onKeyDown={blurOnEnter} readonly={readOnly} />
                </div>
                <Button size="sm" layout="plain" leftIcon={<i className="fa fa-refresh" />} ariaLabel="Reload velocity" title="Reload velocity" isLoading={isLoading} onClick={() => loadVelocityData(true)} />
            </div>

            {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
            {velocity ? (
                <>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span>
                            Selected: <b>{formatNumber(velocity.selected)}</b> {unitLabel}
                        </span>
                        <span className="text-(--text-secondary)">Avg completed {formatNumber(velocity.averageCompleted)}</span>
                        <span className="text-(--text-secondary)">Avg committed {formatNumber(velocity.averageCommitted)}</span>
                        <span className="text-(--text-secondary)">Median {formatNumber(velocity.median)}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="exportable w-full min-w-[420px] border-collapse text-sm" data-export-sheet-name="Velocity">
                            <thead>
                                <tr className="border-b border-(--border-primary) text-left text-xs text-(--text-secondary)">
                                    <th className="px-2 py-1">Sprint</th>
                                    <th className="px-2 py-1">Completed on</th>
                                    <th className="px-2 py-1 text-right">Committed ({unitLabel})</th>
                                    <th className="px-2 py-1 text-right">Completed ({unitLabel})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {velocity.sprints.map((s) => (
                                    <tr key={s.sprintId} className="border-b border-(--border-secondary)">
                                        <td className="px-2 py-1">{s.name}</td>
                                        <td className="px-2 py-1">{formatShortDate(s.completeDate)}</td>
                                        <td className="px-2 py-1 text-right" title={s.committedIsEstimated ? 'Estimated: the scope at sprint start was not recorded' : 'Scope at sprint start'}>
                                            {formatNumber(s.committed)}
                                            {s.committedIsEstimated && <span className="ms-1 text-[10px] text-(--text-tertiary)">est.</span>}
                                        </td>
                                        <td className="px-2 py-1 text-right">{formatNumber(s.completed)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                !isLoading && <span className="text-sm text-(--text-secondary)">No closed sprints yet. Capacity in points uses hours per point until there is velocity.</span>
            )}
        </section>
    );
}
