import { useEffect, useMemo, useRef, useState } from 'react';

import { addDays, startOfDay } from 'date-fns';

import { inject } from '@services';

import { DateTimePicker } from '@/controls';

import { Button, Dropdown, InputSwitch, Modal, Multiselect, TextInput } from '@components';

import BoardPicker from '../../shared/components/BoardPicker';
import Field from '../../shared/components/Field';
import { formatDateRange } from '../../shared/format';
import { parseDateKey, toDateKey } from '../../shared/segments';
import type { PlannerBoard, PlannerSprint } from '../../shared/types';
import { getJiraErrorMessage } from '../../shared/jira-api';
import { createPlanId, savePlanDocument } from '../pi-actions';
import { loadTeamSprints } from '../pi-loader';
import { getPlan } from '../pi-storage';
import { createIterations, matchSprints } from '../pi-model';
import { usePiStore } from '../pi-store';
import type { PiDocument, PiIteration, PiTeam } from '../pi-types';
import type { TermSet } from '../terminology';

interface PiDefinitionDialogProps {
    doc: PiDocument | null;
    terms: TermSet;
    onSaved: (doc: PiDocument) => void;
    onHide: () => void;
}

const defaultLengthDays = 70;
const noCopy = '';

/** Creates or edits a plan: dates, teams, the sprints of each team in the plan and the iterations (PI-1, PI-1a, PI-10). */
export default function PiDefinitionDialog({ doc, terms, onSaved, onHide }: PiDefinitionDialogProps) {
    const plans = usePiStore((s) => s.plans);
    const settings = usePiStore((s) => s.settings);
    const today = startOfDay(new Date());
    const [name, setName] = useState(doc?.name || '');
    const [start, setStart] = useState<Date>(doc ? parseDateKey(doc.startDate) : today);
    const [end, setEnd] = useState<Date>(doc ? parseDateKey(doc.endDate) : addDays(today, defaultLengthDays - 1));
    const [teams, setTeams] = useState<PiTeam[]>(doc?.teams || []);
    const [iterations, setIterations] = useState<PiIteration[]>(doc?.iterations || []);
    const [sprintLists, setSprintLists] = useState<Record<number, PlannerSprint[]>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [copyFrom, setCopyFrom] = useState(noCopy);
    const loadedBoardsRef = useRef(new Set<number>());

    const boardIds = useMemo(() => teams.map((t) => t.boardId), [teams]);

    useEffect(() => {
        const boardsToLoad = boardIds.filter((id) => !loadedBoardsRef.current.has(id));
        if (!boardsToLoad.length) {
            return;
        }
        boardsToLoad.forEach((id) => loadedBoardsRef.current.add(id));
        loadTeamSprints(boardsToLoad, true)
            .then((lists) => setSprintLists((current) => ({ ...current, ...lists })))
            .catch((err) => {
                boardsToLoad.forEach((id) => loadedBoardsRef.current.delete(id));
                console.error(err);
            });
    }, [boardIds.join(',')]);

    const autoMatch = (list: PiTeam[], lists: Record<number, PlannerSprint[]>) =>
        list.map((t) => ({ ...t, sprintIds: matchSprints(lists[t.boardId] || [], toDateKey(start), toDateKey(end)).map((s) => s.id) }));

    const regenerate = () => {
        const matched = autoMatch(teams, sprintLists);
        setTeams(matched);
        setIterations(
            createIterations(
                toDateKey(start),
                toDateKey(end),
                matched.map((t) => (sprintLists[t.boardId] || []).filter((s) => t.sprintIds.includes(s.id))),
                settings?.ipSprint ?? true,
            ),
        );
    };

    useEffect(() => {
        if (!boardIds.length || boardIds.some((id) => !sprintLists[id])) {
            return;
        }
        if (!doc) {
            regenerate();
            return;
        }
        setTeams((current) =>
            current.map((t) =>
                t.sprintIds.length || doc.teams.some((d) => d.boardId === t.boardId)
                    ? t
                    : { ...t, sprintIds: matchSprints(sprintLists[t.boardId] || [], toDateKey(start), toDateKey(end)).map((s) => s.id) },
            ),
        );
    }, [sprintLists, boardIds.join(','), start.getTime(), end.getTime()]);

    const handleTeams = (boards: PlannerBoard[]) => {
        setTeams(
            boards.map(
                (b) => teams.find((t) => t.boardId === b.id) || doc?.teams.find((t) => t.boardId === b.id) || { boardId: b.id, name: b.name, sprintIds: [] },
            ),
        );
    };

    const applyCopy = async (planId: string) => {
        setCopyFrom(planId);
        if (planId === noCopy) {
            return;
        }
        try {
            const source = await getPlan(planId);
            if (source) {
                setTeams(source.teams.map((s) => teams.find((t) => t.boardId === s.boardId) || { boardId: s.boardId, name: s.name, sprintIds: [] }));
            }
        } catch (err) {
            const { $message } = inject('MessageService');
            $message.error(getJiraErrorMessage(err), `Unable to copy the ${terms.teams.toLowerCase()}`);
        }
    };

    const save = async () => {
        setIsSaving(true);
        const current = usePiStore.getState().doc;
        const base = doc && current?.id === doc.id ? current : doc;
        const next: PiDocument = {
            id: base?.id || createPlanId(),
            name: name.trim(),
            startDate: toDateKey(start),
            endDate: toDateKey(end),
            teams,
            iterations,
            milestones: base?.milestones || [],
            objectives: base?.objectives || [],
            risks: base?.risks || [],
            votes: base?.votes || [],
            version: base?.version || 0,
            updated: base?.updated || '',
            updatedBy: base?.updatedBy || '',
        };
        const ok = await savePlanDocument(next);
        setIsSaving(false);
        if (ok) {
            onSaved(usePiStore.getState().doc?.id === next.id ? usePiStore.getState().doc! : next);
        }
    };

    const footer = (
        <div className="flex items-center justify-end gap-2">
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button label="Save" isLoading={isSaving} disabled={isSaving || !name.trim() || !teams.length || end < start} onClick={save} />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={doc ? `Edit ${terms.plan}` : `New ${terms.plan}`} size="lg" footer={footer}>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Name" className="sm:col-span-3">
                        <TextInput value={name} onChange={(e) => setName(e.value)} maxLength={80} autoFocus placeholder="2026 Q1" />
                    </Field>
                    <Field label="Start">
                        <DateTimePicker value={start} onChange={setStart} />
                    </Field>
                    <Field label="End">
                        <DateTimePicker value={end} onChange={setEnd} />
                    </Field>
                    {!doc && plans.length > 0 && (
                        <Field label={`Copy ${terms.teams.toLowerCase()} from`}>
                            <Dropdown options={[{ label: 'Do not copy', value: noCopy }, ...plans.map((p) => ({ label: p.name, value: p.id }))]} value={copyFrom} onChange={(e) => applyCopy(e.value as string)} />
                        </Field>
                    )}
                </div>

                <Field label={terms.teams} hint="Each team is a scrum board.">
                    <BoardPicker multiple scrumOnly value={boardIds} onChange={handleTeams} placeholder="Choose the boards of the teams" />
                </Field>

                {teams.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Sprints in this {terms.plan.toLowerCase()}</span>
                            <span className="flex-1" />
                            <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-magic" />} label="Match by dates" onClick={regenerate} />
                        </div>
                        {teams.map((team) => (
                            <Field key={team.boardId} label={team.name}>
                                <Multiselect
                                    options={(sprintLists[team.boardId] || []).map((s) => ({ label: `${s.name} (${formatDateRange(s.startDate, s.endDate)})`, value: s.id }))}
                                    value={team.sprintIds}
                                    onChange={(e) => setTeams(teams.map((t) => (t.boardId === team.boardId ? { ...t, sprintIds: e.value as number[] } : t)))}
                                    placeholder="No sprints"
                                    searchable
                                />
                            </Field>
                        ))}
                    </div>
                )}

                {iterations.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">{terms.iteration}s</span>
                        {iterations.map((it) => (
                            <div key={it.id} className="flex items-center gap-3 text-sm">
                                <span className="w-28">{it.name}</span>
                                <span className="flex-1 text-(--text-secondary)">{formatDateRange(parseDateKey(it.startDate), parseDateKey(it.endDate))}</span>
                                <InputSwitch label={terms.ipIteration} checked={it.isIp} onChange={(e) => setIterations(iterations.map((x) => (x.id === it.id ? { ...x, isIp: e.value } : x)))} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
