import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { addDays, startOfDay } from 'date-fns';

import { DateTimePicker } from '@/controls';

import { inject } from '@services';

import { Button, Dropdown, InputSwitch, Modal, Multiselect, TextInput } from '@components';

import BoardPicker from '../../shared/components/BoardPicker';
import Field from '../../shared/components/Field';
import { formatDateRange } from '../../shared/format';
import { getJiraErrorMessage } from '../../shared/jira-api';
import { parseDateKey, toDateKey } from '../../shared/segments';
import type { PlannerBoard } from '../../shared/types';
import { createPlanId, savePlanDocument } from '../pi-actions';
import { piDefinitionReducer, type PiDefinitionState } from '../pi-definition-state';
import { loadTeamSprints } from '../pi-loader';
import { getPlan } from '../pi-storage';
import { usePiStore } from '../pi-store';
import type { PiDocument, PiTeam } from '../pi-types';
import { lowerTerm, type TermSet } from '../terminology';

interface PiDefinitionDialogProps {
    doc: PiDocument | null;
    artId: string | null;
    terms: TermSet;
    onSaved: (doc: PiDocument) => void;
    onHide: () => void;
}

const defaultLengthDays = 70;
const noCopy = '';
const noArt = '';

/** Creates or edits a plan: dates, teams, the sprints of each team in the plan and the iterations (PI-1, PI-1a, PI-10). */
export default function PiDefinitionDialog({ doc, artId: initialArtId, terms, onSaved, onHide }: PiDefinitionDialogProps) {
    const allPlans = usePiStore((s) => s.plans);
    const arts = usePiStore((s) => s.arts);
    const settings = usePiStore((s) => s.settings);
    const [artId, setArtId] = useState<string>(doc ? doc.artId || noArt : initialArtId || noArt);
    const art = arts.find((a) => a.id === artId) || null;
    const plans = allPlans.filter((p) => (p.artId || noArt) === artId);
    const [name, setName] = useState(doc?.name || '');
    const [state, dispatch] = useReducer(piDefinitionReducer, null, (): PiDefinitionState => {
        const today = startOfDay(new Date());
        const initialArt = arts.find((a) => a.id === initialArtId);
        return {
            teams: doc?.teams || (initialArt?.teams || []).map((t) => ({ ...t, sprintIds: [] })),
            start: doc ? parseDateKey(doc.startDate) : today,
            end: doc ? parseDateKey(doc.endDate) : addDays(today, defaultLengthDays - 1),
            iterations: doc?.iterations || [],
            sprintLists: {},
            isNew: !doc,
            savedBoardIds: doc?.teams.map((t) => t.boardId) || [],
            ipSprint: settings?.ipSprint ?? true,
        };
    });
    const { teams, start, end, iterations, sprintLists } = state;
    const [isSaving, setIsSaving] = useState(false);
    const [copyFrom, setCopyFrom] = useState(noCopy);
    const loadedBoardsRef = useRef(new Set<number>());

    const boardIds = useMemo(() => teams.map((t) => t.boardId), [teams]);
    const boardKey = boardIds.join(',');

    useEffect(() => {
        const boardsToLoad = (boardKey ? boardKey.split(',').map(Number) : []).filter((id) => !loadedBoardsRef.current.has(id));
        if (!boardsToLoad.length) {
            return;
        }
        boardsToLoad.forEach((id) => loadedBoardsRef.current.add(id));
        loadTeamSprints(boardsToLoad, true)
            .then((lists) => dispatch({ type: 'sprintsLoaded', lists }))
            .catch((err) => {
                boardsToLoad.forEach((id) => loadedBoardsRef.current.delete(id));
                console.error(err);
            });
    }, [boardKey]);

    const setTeams = (list: PiTeam[]) => dispatch({ type: 'teams', teams: list });

    const handleTeams = (boards: PlannerBoard[]) => {
        setTeams(
            boards.map(
                (b) => teams.find((t) => t.boardId === b.id) || doc?.teams.find((t) => t.boardId === b.id) || { boardId: b.id, name: b.name, sprintIds: [] },
            ),
        );
    };

    const changeArt = (id: string) => {
        setArtId(id);
        setCopyFrom(noCopy);
        const next = arts.find((a) => a.id === id);
        if (!doc && next) {
            setTeams(next.teams.map((t) => teams.find((c) => c.boardId === t.boardId) || { ...t, sprintIds: [] }));
        }
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
            $message.error(getJiraErrorMessage(err), `Unable to copy the ${lowerTerm(terms.teams)}`);
        }
    };

    const save = async () => {
        setIsSaving(true);
        const current = usePiStore.getState().doc;
        const base = doc && current?.id === doc.id ? current : doc;
        const next: PiDocument = {
            id: base?.id || createPlanId(),
            artId: artId || null,
            name: name.trim(),
            startDate: toDateKey(start),
            endDate: toDateKey(end),
            teams,
            iterations,
            milestones: base?.milestones || [],
            objectives: base?.objectives || [],
            risks: base?.risks || [],
            dependencies: base?.dependencies || [],
            votes: base?.votes || [],
            version: base?.version || 0,
            created: base?.created || '',
            createdBy: base?.createdBy || null,
            updated: base?.updated || '',
            updatedBy: base?.updatedBy || '',
            updatedByUser: base?.updatedByUser || null,
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
                    <Field label="Name" className="sm:col-span-2">
                        <TextInput value={name} onChange={(e) => setName(e.value)} maxLength={80} autoFocus placeholder="2026 Q1" />
                    </Field>
                    <Field label={terms.program}>
                        <Dropdown
                            options={[...arts.map((a) => ({ label: a.name, value: a.id })), { label: 'None', value: noArt }]}
                            value={artId}
                            onChange={(e) => changeArt(e.value as string)}
                        />
                    </Field>
                    <Field label="Start">
                        <DateTimePicker value={start} onChange={(value: Date) => dispatch({ type: 'dates', start: value, end })} />
                    </Field>
                    <Field label="End">
                        <DateTimePicker value={end} onChange={(value: Date) => dispatch({ type: 'dates', start, end: value })} />
                    </Field>
                    {!doc && plans.length > 0 && (
                        <Field label={`Copy ${lowerTerm(terms.teams)} from`}>
                            <Dropdown options={[{ label: 'Do not copy', value: noCopy }, ...plans.map((p) => ({ label: p.name, value: p.id }))]} value={copyFrom} onChange={(e) => applyCopy(e.value as string)} />
                        </Field>
                    )}
                </div>

                <Field label={terms.teams} hint={art ? `Starts with the teams of ${art.name}. Each team is a scrum board.` : 'Each team is a scrum board.'}>
                    <BoardPicker multiple scrumOnly value={boardIds} onChange={handleTeams} placeholder="Choose the boards of the teams" />
                </Field>

                {teams.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Sprints in this {lowerTerm(terms.plan)}</span>
                            <span className="flex-1" />
                            <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-magic" />} label="Match by dates" onClick={() => dispatch({ type: 'regenerate' })} />
                        </div>
                        {teams.map((team) => (
                            <Field key={team.boardId} label={team.name}>
                                <Multiselect
                                    options={(sprintLists[team.boardId] || []).map((s) => ({ label: `${s.name} (${formatDateRange(s.startDate, s.endDate)})`, value: s.id }))}
                                    value={team.sprintIds}
                                    onChange={(e) => dispatch({ type: 'teamSprints', boardId: team.boardId, sprintIds: e.value as number[] })}
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
                                <InputSwitch label={terms.ipIteration} checked={it.isIp} onChange={(e) => dispatch({ type: 'iterations', iterations: iterations.map((x) => (x.id === it.id ? { ...x, isIp: e.value } : x)) })} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
