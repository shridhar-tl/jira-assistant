import { getIssueHours, getIssuePoints } from '../../shared/capacity';
import { formatNumber } from '../../shared/format';
import type { PiData } from '../pi-loader';
import { unplannedIterationId, type ProgramModel } from '../pi-model';
import type { PiDocument, RoamStatus } from '../pi-types';
import type { TermSet } from '../terminology';

import { getPredictability } from './ObjectivesView';

interface PiSummaryViewProps {
    doc: PiDocument;
    data: PiData;
    model: ProgramModel;
    terms: TermSet;
}

const roamOrder: RoamStatus[] = ['open', 'owned', 'accepted', 'mitigated', 'resolved'];

/** Scope, capacity use and progress per team and iteration, conflicts, objectives with value, and risks by ROAM status (PI-9). */
export default function PiSummaryView({ doc, data, model, terms }: PiSummaryViewProps) {
    const predictability = getPredictability(doc.objectives);
    const conflicts = model.dependencies.filter((d) => d.conflict !== 'none' && !d.blockerDone);

    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                    { label: terms.teams, value: String(doc.teams.length) },
                    { label: 'Dependency conflicts', value: String(conflicts.length) },
                    { label: 'Predictability', value: predictability === null ? '–' : `${predictability}%` },
                    { label: `Open ${terms.risks.toLowerCase()}`, value: String(doc.risks.filter((r) => r.roam === 'open').length) },
                ].map((tile) => (
                    <div key={tile.label} className="rounded-lg border border-(--border-primary) p-3">
                        <div className="text-xs text-(--text-secondary)">{tile.label}</div>
                        <div className="text-2xl font-semibold">{tile.value}</div>
                    </div>
                ))}
            </div>

            <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Scope, capacity and progress</h3>
                <div className="overflow-x-auto">
                    <table className="exportable w-full min-w-[640px] border-collapse text-sm" data-export-sheet-name="Scope and progress">
                        <thead>
                            <tr className="bg-(--bg-secondary) text-left text-xs text-(--text-secondary)">
                                <th className="px-2 py-1.5">{terms.team}</th>
                                <th className="px-2 py-1.5">{terms.iteration}</th>
                                <th className="px-2 py-1.5 text-right">Stories</th>
                                <th className="px-2 py-1.5 text-right">Planned</th>
                                <th className="px-2 py-1.5 text-right">Capacity</th>
                                <th className="px-2 py-1.5 text-right">Utilisation</th>
                                <th className="px-2 py-1.5 text-right">Done</th>
                            </tr>
                        </thead>
                        <tbody>
                            {model.rows.flatMap((row) =>
                                [...row.columns, { id: unplannedIterationId, name: 'Not in a sprint' }].map((column, index) => {
                                    const cells = row.cells[column.id] || [];
                                    const storyKeys = cells.flatMap((c) => c.storyKeys);
                                    const done = storyKeys
                                        .map((k) => data.stories[k])
                                        .filter((s) => s?.statusCategory === 'done')
                                        .reduce((sum, s) => sum + (row.unit === 'hours' ? getIssueHours(s) : getIssuePoints(s, 'points')), 0);
                                    const planned = cells.reduce((sum, c) => sum + c.estimate, 0);
                                    const load = row.loads[column.id];
                                    const unit = row.unit === 'hours' ? 'h' : 'pts';
                                    return (
                                        <tr key={`${row.team.boardId}-${column.id}`} className="border-t border-(--border-secondary)">
                                            <td className="px-2 py-1 font-medium">{index === 0 ? row.team.name : ''}</td>
                                            <td className="px-2 py-1">{column.name}</td>
                                            <td className="px-2 py-1 text-right">{storyKeys.length}</td>
                                            <td className="px-2 py-1 text-right">
                                                {formatNumber(planned)} {unit}
                                            </td>
                                            <td className="px-2 py-1 text-right">{load ? `${formatNumber(load.capacity)} ${unit}` : '–'}</td>
                                            <td className="px-2 py-1 text-right">{load && load.capacity > 0 ? `${Math.round((planned * 100) / load.capacity)}%` : '–'}</td>
                                            <td className="px-2 py-1 text-right">{planned > 0 ? `${Math.round((done * 100) / planned)}%` : '–'}</td>
                                        </tr>
                                    );
                                }),
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <section className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">{terms.objectives}</h3>
                    <table className="exportable w-full border-collapse text-sm" data-export-sheet-name={`${terms.objectives} summary`}>
                        <thead>
                            <tr className="text-left text-xs text-(--text-secondary)">
                                <th className="px-2 py-1">{terms.team}</th>
                                <th className="px-2 py-1 text-right">{terms.committed}</th>
                                <th className="px-2 py-1 text-right">{terms.plannedValue}</th>
                                <th className="px-2 py-1 text-right">{terms.actualValue}</th>
                                <th className="px-2 py-1 text-right">Predictability</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[{ id: null as number | null, name: terms.program }, ...doc.teams.map((t) => ({ id: t.boardId as number | null, name: t.name }))].map((g) => {
                                const list = doc.objectives.filter((o) => o.teamBoardId === g.id);
                                const value = getPredictability(list);
                                return (
                                    <tr key={g.name} className="border-t border-(--border-secondary)">
                                        <td className="px-2 py-1">{g.name}</td>
                                        <td className="px-2 py-1 text-right">{list.filter((o) => o.committed).length}</td>
                                        <td className="px-2 py-1 text-right">{formatNumber(list.filter((o) => o.committed).reduce((s, o) => s + (o.plannedValue || 0), 0))}</td>
                                        <td className="px-2 py-1 text-right">{formatNumber(list.filter((o) => o.committed).reduce((s, o) => s + (o.actualValue || 0), 0))}</td>
                                        <td className="px-2 py-1 text-right">{value === null ? '–' : `${value}%`}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
                <section className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">{terms.risks}</h3>
                    <table className="exportable w-full border-collapse text-sm" data-export-sheet-name={`${terms.risks} summary`}>
                        <tbody>
                            {roamOrder.map((status) => (
                                <tr key={status} className="border-t border-(--border-secondary)">
                                    <td className="px-2 py-1">{terms.roam[status]}</td>
                                    <td className="px-2 py-1 text-right font-semibold">{doc.risks.filter((r) => r.roam === status).length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <h3 className="mt-2 text-sm font-semibold">Dependency conflicts</h3>
                    <ul className="flex flex-col gap-0.5 text-sm">
                        {conflicts.map((d) => (
                            <li key={d.id}>
                                {d.blockerKey} blocks {d.dependantKey}
                                {d.crossTeam && <span className="ms-1 text-xs text-(--text-secondary)">(cross-team)</span>}
                            </li>
                        ))}
                        {!conflicts.length && <li className="text-(--text-tertiary)">None</li>}
                    </ul>
                </section>
            </div>
        </div>
    );
}
