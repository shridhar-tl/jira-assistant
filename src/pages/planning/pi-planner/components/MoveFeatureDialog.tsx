import { useMemo, useState } from 'react';

import { Button, Dropdown, Modal, NumericInput } from '@components';

import { getCapacityLevel, getIssueHours, getIssuePoints } from '../../shared/capacity';
import CapacityBar from '../../shared/components/CapacityBar';
import Field from '../../shared/components/Field';
import { formatNumber } from '../../shared/format';
import type { PlannerIssue } from '../../shared/types';
import { clearFeaturePlacement, moveFeatureStories, placeFeature } from '../pi-actions';
import type { PiData } from '../pi-loader';
import { unplannedIterationId, type ProgramModel } from '../pi-model';
import { lowerTerm, type TermSet } from '../terminology';

import StoryPickList from './board/StoryPickList';
import IssueLink from './common/IssueLink';
import StatusPill from './common/StatusPill';

export interface MoveTarget {
    featureKey: string;
    boardId: number | null;
    columnId: string | null;
}

interface MoveFeatureDialogProps {
    target: MoveTarget;
    model: ProgramModel;
    data: PiData;
    terms: TermSet;
    onHide: () => void;
}

/**
 * Moves the not-done stories of a feature that belong to the target team into the team's sprint of the target column,
 * after a preview where stories can be left out. A feature without stories there is planned with a rough estimate instead (PI-2).
 */
function defaultBoardId(target: MoveTarget, model: ProgramModel, data: PiData): number | null {
    if (target.boardId) {
        return target.boardId;
    }
    const openTeams = new Set(
        Object.values(data.stories)
            .filter((s) => (s.epicKey || s.parentKey) === target.featureKey && s.statusCategory !== 'done')
            .map((s) => model.storyTeam.get(s.key)),
    );
    return (model.rows.find((r) => openTeams.has(r.team.boardId)) ?? model.rows[0])?.team.boardId ?? null;
}

export default function MoveFeatureDialog({ target, model, data, terms, onHide }: MoveFeatureDialogProps) {
    const feature = data.features[target.featureKey];
    const [boardId, setBoardId] = useState<number | null>(() => defaultBoardId(target, model, data));
    const row = model.rows.find((r) => r.team.boardId === boardId);
    const [columnId, setColumnId] = useState<string | null>(target.columnId ?? row?.columns[0]?.id ?? null);
    const columnSprints = row && columnId ? row.loads[columnId]?.sprints || [] : [];
    const [sprintId, setSprintId] = useState<number | null>(null);
    const effectiveSprintId = columnId === unplannedIterationId ? null : sprintId ?? columnSprints[0]?.id ?? null;
    const [estimate, setEstimate] = useState<number | undefined>(feature?.featurePlacement?.estimate ?? undefined);
    const [excluded, setExcluded] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    const children = useMemo(() => Object.values(data.stories).filter((s) => (s.epicKey || s.parentKey) === target.featureKey), [data.stories, target.featureKey]);
    const stories = useMemo(
        () =>
            children.filter((s) => {
                const team = model.storyTeam.get(s.key);
                return s.statusCategory !== 'done' && (team === boardId || !team);
            }),
        [children, model.storyTeam, boardId],
    );
    const hasStoriesElsewhere = children.length > 0 && !stories.length;
    const doneCount = children.filter((s) => s.statusCategory === 'done').length;

    const unit = row?.unit === 'hours' ? 'h' : 'pts';
    const sizeOf = (story: PlannerIssue) => (row?.unit === 'hours' ? getIssueHours(story) : getIssuePoints(story, 'points'));
    const selected = stories.filter((s) => !excluded.has(s.key));
    const moving = selected.filter((s) => s.currentSprintId !== effectiveSprintId);
    const movingSize = moving.reduce((sum, s) => sum + sizeOf(s), 0);
    const load = row && columnId && columnId !== unplannedIterationId ? row.loads[columnId] : undefined;
    const loadAfter = (load?.load || 0) + (stories.length ? movingSize : (estimate ?? 0) - (feature?.featurePlacement?.estimate ?? 0));

    const sprintName = (id: number | null) => (id ? Object.values(data.teams).flatMap((t) => t.sprints).find((s) => s.id === id)?.name || 'Sprint' : 'Backlog');

    const apply = async () => {
        if (!boardId) {
            return;
        }
        setIsSaving(true);
        const ok = children.length ? await moveFeatureStories(moving.map((s) => s.key), effectiveSprintId) : await placeFeature(target.featureKey, boardId, effectiveSprintId, estimate ?? null);
        setIsSaving(false);
        if (ok) {
            onHide();
        }
    };

    const footer = (
        <div className="flex flex-wrap items-center justify-end gap-2">
            {feature?.featurePlacement && (
                <Button
                    label="Remove rough plan"
                    layout="plain"
                    variant="danger"
                    className="me-auto"
                    onClick={async () => {
                        await clearFeaturePlacement(target.featureKey);
                        onHide();
                    }}
                />
            )}
            <Button label="Cancel" layout="plain" onClick={onHide} />
            <Button
                label={stories.length ? `Move ${moving.length} ${moving.length === 1 ? 'story' : 'stories'}` : `Plan ${lowerTerm(terms.feature)}`}
                isLoading={isSaving}
                disabled={
                    isSaving ||
                    !boardId ||
                    hasStoriesElsewhere ||
                    (stories.length > 0 && !moving.length) ||
                    (columnId !== unplannedIterationId && !effectiveSprintId && stories.length > 0)
                }
                onClick={apply}
            />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`Plan ${lowerTerm(terms.feature)}`} size="lg" footer={footer}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-(--bg-secondary) px-3 py-2">
                    <IssueLink issueKey={target.featureKey} issue={feature} />
                    <span className="min-w-0 flex-1 truncate font-medium" title={feature?.summary}>
                        {feature?.summary}
                    </span>
                    {feature && <StatusPill status={feature.status} category={feature.statusCategory} />}
                    {children.length > 0 && (
                        <span className="text-xs text-(--text-secondary)">
                            {children.length} stories · {doneCount} done
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label={terms.team}>
                        <Dropdown
                            options={model.rows.map((r) => ({ label: r.team.name, value: r.team.boardId }))}
                            value={boardId ?? undefined}
                            onChange={(e) => {
                                setBoardId(e.value as number);
                                setSprintId(null);
                                setExcluded(new Set());
                            }}
                        />
                    </Field>
                    <Field label={terms.iteration}>
                        <Dropdown
                            options={[...(row?.columns || []).map((c) => ({ label: c.name, value: c.id })), { label: 'Not in a sprint', value: unplannedIterationId }]}
                            value={columnId ?? undefined}
                            onChange={(e) => {
                                setColumnId(e.value as string);
                                setSprintId(null);
                            }}
                        />
                    </Field>
                    {columnSprints.length > 1 && (
                        <Field label="Sprint">
                            <Dropdown options={columnSprints.map((s) => ({ label: s.name, value: s.id }))} value={effectiveSprintId ?? undefined} onChange={(e) => setSprintId(e.value as number)} />
                        </Field>
                    )}
                </div>

                {load && load.sprints.length > 0 && !hasStoriesElsewhere && (
                    <CapacityBar
                        committed={loadAfter}
                        capacity={load.capacity}
                        level={getCapacityLevel(loadAfter, load.capacity)}
                        unit={unit}
                        label={`${row?.team.name} · ${load.sprints.map((sp) => sp.name).join(', ')} after this change`}
                    />
                )}

                {columnId !== unplannedIterationId && !columnSprints.length && !hasStoriesElsewhere && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        {stories.length
                            ? `This team has no sprint in that ${lowerTerm(terms.iteration)} yet. Add one to the plan first.`
                            : `This team has no sprint in that ${lowerTerm(terms.iteration)} yet, so the rough plan goes to "Not in a sprint". Add a sprint to the plan first to plan it in that ${lowerTerm(terms.iteration)}.`}
                    </div>
                )}

                {hasStoriesElsewhere ? (
                    <span className="text-sm text-(--text-secondary)">
                        This {lowerTerm(terms.feature)} has no open stories in {row?.team.name || 'this team'}. Its stories are in other {lowerTerm(terms.teams)} or done, so there is nothing
                        to move here.
                    </span>
                ) : stories.length ? (
                    <div className="flex flex-col gap-2">
                        <span className="text-xs text-(--text-secondary)">
                            Open stories of this {lowerTerm(terms.feature)} in {row?.team.name} or not attributed to a team yet. Done stories never move. Selected: {moving.length} ({formatNumber(movingSize)}{' '}
                            {unit}).
                        </span>
                        <StoryPickList stories={stories} excluded={excluded} onExcludedChange={setExcluded} sizeOf={sizeOf} unit={unit} sprintName={sprintName} />
                    </div>
                ) : (
                    <Field
                        label={`Rough estimate (${unit})`}
                        hint={`This ${lowerTerm(terms.feature)} has no stories in ${row?.team.name || 'this team'} yet. The rough plan counts against the team's capacity until stories exist.`}
                    >
                        <NumericInput value={estimate} min={0} maxDecimals={1} onChange={(e) => setEstimate(e.value)} />
                    </Field>
                )}
            </div>
        </Modal>
    );
}
