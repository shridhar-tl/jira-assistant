import { useState } from 'react';

import classNames from 'classnames';
import { format } from 'date-fns';

import { DateTimePicker } from '@/controls';

import { Button, Dropdown, TextInput } from '@components';

import Field from '../../shared/components/Field';
import { toDateKey } from '../../shared/segments';
import { createItemId, updatePlan } from '../pi-actions';
import type { PiDocument, PiMilestone } from '../pi-types';
import type { TermSet } from '../terminology';

interface ConfidenceViewProps {
    doc: PiDocument;
    terms: TermSet;
    canEdit: boolean;
}

const programValue = 'program';
const votes = [1, 2, 3, 4, 5];

function average(values: number[]): string {
    return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '–';
}

/** Confidence votes (1–5) per team and for the program with their history (PI-8), and custom milestones of the plan (PI-5). */
export default function ConfidenceView({ doc, terms, canEdit }: ConfidenceViewProps) {
    const [team, setTeam] = useState(programValue);
    const [note, setNote] = useState('');
    const [milestoneTitle, setMilestoneTitle] = useState('');
    const [milestoneDate, setMilestoneDate] = useState<Date>(new Date());
    const groups = [{ id: null as number | null, name: terms.program }, ...doc.teams.map((t) => ({ id: t.boardId as number | null, name: t.name }))];

    const addVote = (vote: number) =>
        updatePlan({
            votes: [...doc.votes, { id: createItemId('v'), teamBoardId: team === programValue ? null : Number(team), vote, date: new Date().toISOString(), note: note.trim() }],
        }).then((ok) => ok && setNote(''));

    const addMilestone = () => {
        const milestone: PiMilestone = { id: createItemId('m'), date: toDateKey(milestoneDate), title: milestoneTitle.trim(), kind: 'event' };
        updatePlan({ milestones: [...doc.milestones, milestone].sort((a, b) => a.date.localeCompare(b.date)) }).then((ok) => ok && setMilestoneTitle(''));
    };

    return (
        <div className="grid grid-cols-1 gap-4 p-3 xl:grid-cols-2">
            <section className="flex flex-col gap-3 rounded-lg border border-(--border-primary) p-3">
                <h3 className="text-sm font-semibold">{terms.confidence}</h3>
                {canEdit && (
                    <div className="flex flex-wrap items-end gap-2">
                        <Field label={terms.team} className="w-48">
                            <Dropdown options={groups.map((g) => ({ label: g.name, value: g.id ? String(g.id) : programValue }))} value={team} onChange={(e) => setTeam(e.value as string)} />
                        </Field>
                        <Field label="Note" className="min-w-40 flex-1">
                            <TextInput value={note} onChange={(e) => setNote(e.value)} placeholder="Optional" />
                        </Field>
                        <div className="flex gap-1" role="group" aria-label="Vote">
                            {votes.map((v) => (
                                <Button key={v} label={String(v)} size="sm" layout="outlined" onClick={() => addVote(v)} />
                            ))}
                        </div>
                    </div>
                )}
                <table className="exportable w-full border-collapse text-sm" data-export-sheet-name={terms.confidence}>
                    <thead>
                        <tr className="text-left text-xs text-(--text-secondary)">
                            <th className="px-2 py-1">{terms.team}</th>
                            <th className="px-2 py-1 text-right">Latest</th>
                            <th className="px-2 py-1 text-right">Average</th>
                            <th className="px-2 py-1">History</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map((g) => {
                            const list = doc.votes.filter((v) => v.teamBoardId === g.id).sort((a, b) => a.date.localeCompare(b.date));
                            const latest = list[list.length - 1];
                            return (
                                <tr key={g.name} className="border-t border-(--border-secondary)">
                                    <td className="px-2 py-1">{g.name}</td>
                                    <td className={classNames('px-2 py-1 text-right font-semibold', latest && latest.vote < 3 ? 'text-red-600 dark:text-red-400' : '')}>{latest?.vote ?? '–'}</td>
                                    <td className="px-2 py-1 text-right">{average(list.map((v) => v.vote))}</td>
                                    <td className="px-2 py-1 text-xs text-(--text-secondary)">
                                        {list.map((v) => (
                                            <span key={v.id} className="me-2" title={v.note || undefined}>
                                                {v.vote} ({format(new Date(v.date), 'd MMM')})
                                            </span>
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </section>

            <section className="flex flex-col gap-3 rounded-lg border border-(--border-primary) p-3">
                <h3 className="text-sm font-semibold">Key dates</h3>
                {canEdit && (
                    <div className="flex flex-wrap items-end gap-2">
                        <Field label="Event" className="min-w-40 flex-1">
                            <TextInput value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.value)} placeholder="Planning day, demo, code freeze" />
                        </Field>
                        <Field label="Date">
                            <DateTimePicker value={milestoneDate} onChange={setMilestoneDate} />
                        </Field>
                        <Button label="Add" leftIcon={<i className="fa fa-plus" />} disabled={!milestoneTitle.trim()} onClick={addMilestone} />
                    </div>
                )}
                <ul className="flex flex-col gap-1 text-sm">
                    {doc.milestones.map((m) => (
                        <li key={m.id} className="flex items-center gap-2">
                            <i className={m.kind === 'release' ? 'fa fa-rocket text-amber-500' : 'fa fa-flag text-amber-500'} />
                            <span className="w-24 text-(--text-secondary)">{m.date}</span>
                            <span className="flex-1">{m.title}</span>
                            {canEdit && (
                                <Button size="xs" layout="plain" variant="danger" leftIcon={<i className="fa fa-trash" />} ariaLabel="Delete" onClick={() => updatePlan({ milestones: doc.milestones.filter((x) => x.id !== m.id) })} />
                            )}
                        </li>
                    ))}
                    {!doc.milestones.length && <li className="text-(--text-tertiary)">No key dates yet. Releases with a release date are shown on the board automatically.</li>}
                </ul>
            </section>
        </div>
    );
}
