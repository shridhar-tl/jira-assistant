import { useMemo, useState } from 'react';

import { Button, Checkbox, Dropdown, Modal, NumericInput } from '@components';

import { getIssueHours, getIssuePoints } from '../../shared/capacity';
import Field from '../../shared/components/Field';
import { formatNumber } from '../../shared/format';
import { clearFeaturePlacement, moveFeatureStories, placeFeature } from '../pi-actions';
import { unplannedIterationId, type ProgramModel } from '../pi-model';
import type { PiData } from '../pi-loader';
import type { TermSet } from '../terminology';

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
export default function MoveFeatureDialog({ target, model, data, terms, onHide }: MoveFeatureDialogProps) {
    const feature = data.features[target.featureKey];
    const [boardId, setBoardId] = useState<number | null>(target.boardId ?? model.rows[0]?.team.boardId ?? null);
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

    const unit = row?.unit === 'hours' ? 'h' : 'pts';
    const sizeOf = (story: (typeof stories)[number]) => (row?.unit === 'hours' ? getIssueHours(story) : getIssuePoints(story, 'points'));
    const selected = stories.filter((s) => !excluded.has(s.key));

    const apply = async () => {
        if (!boardId) {
            return;
        }
        setIsSaving(true);
        const ok = children.length
            ? await moveFeatureStories(
                  selected.filter((s) => s.currentSprintId !== effectiveSprintId).map((s) => s.key),
                  effectiveSprintId,
              )
            : await placeFeature(target.featureKey, boardId, effectiveSprintId, estimate ?? null);
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
                label={stories.length ? `Move ${selected.length} stories` : `Plan ${terms.feature.toLowerCase()}`}
                isLoading={isSaving}
                disabled={isSaving || !boardId || hasStoriesElsewhere || (stories.length > 0 && !selected.length) || (columnId !== unplannedIterationId && !effectiveSprintId && stories.length > 0)}
                onClick={apply}
            />
        </div>
    );

    return (
        <Modal isOpen onClose={onHide} title={`${target.featureKey} · ${feature?.summary || ''}`} size="md" footer={footer}>
            <div className="flex flex-col gap-3">
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

                {columnId !== unplannedIterationId && !columnSprints.length && stories.length > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">This team has no sprint in that {terms.iteration.toLowerCase()} yet. Add one to the plan first.</span>
                )}

                {hasStoriesElsewhere ? (
                    <span className="text-sm text-(--text-secondary)">
                        This {terms.feature.toLowerCase()} has no open stories in {row?.team.name || 'this team'}. Its stories are in other {terms.teams.toLowerCase()} or done, so there is
                        nothing to move here.
                    </span>
                ) : stories.length ? (
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-(--text-secondary)">
                            Not-done stories of this {terms.feature.toLowerCase()} in {row?.team.name} or not attributed to a team yet. Done stories never move.
                        </span>
                        {stories.map((story) => (
                            <div key={story.key} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={!excluded.has(story.key)}
                                    onChange={(e) =>
                                        setExcluded((prev) => {
                                            const next = new Set(prev);
                                            if (e.value) {
                                                next.delete(story.key);
                                            } else {
                                                next.add(story.key);
                                            }
                                            return next;
                                        })
                                    }
                                />
                                <span className="shrink-0 font-medium">{story.key}</span>
                                <span className="min-w-0 flex-1 truncate">{story.summary}</span>
                                <span className="shrink-0 text-xs text-(--text-secondary)">{formatNumber(sizeOf(story))} {unit}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Field
                        label={`Rough estimate (${unit})`}
                        hint={`This ${terms.feature.toLowerCase()} has no stories in ${row?.team.name || 'this team'} yet. The rough plan counts against the team's capacity until stories exist.`}
                    >
                        <NumericInput value={estimate} min={0} maxDecimals={1} onChange={(e) => setEstimate(e.value)} />
                    </Field>
                )}
            </div>
        </Modal>
    );
}
