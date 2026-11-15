import { useState, type DragEvent } from 'react';

import classNames from 'classnames';

import { getContrastText, getParentColor } from '../../shared/colors';
import { formatNumber } from '../../shared/format';
import type { PlannerIssue } from '../../shared/types';
import type { PiFeatureCell } from '../pi-model';

export const featureDragType = 'application/x-ja-feature';

interface FeatureCardProps {
    cell: PiFeatureCell;
    feature: PlannerIssue | undefined;
    stories: Record<string, PlannerIssue>;
    boardId: number;
    unitLabel: string;
    dependencyCount: number;
    hasConflict: boolean;
    canEdit: boolean;
    onMove: (featureKey: string) => void;
}

export interface FeatureDragData {
    featureKey: string;
    fromBoardId: number;
}

/** A feature in a team / iteration cell with the count and estimate of its stories there (PI-2). */
export default function FeatureCard({ cell, feature, stories, boardId, unitLabel, dependencyCount, hasConflict, canEdit, onMove }: FeatureCardProps) {
    const [expanded, setExpanded] = useState(false);
    const color = getParentColor(cell.featureKey, feature?.color);
    const progress = cell.estimate > 0 ? Math.round((cell.doneEstimate * 100) / cell.estimate) : 0;

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        const payload: FeatureDragData = { featureKey: cell.featureKey, fromBoardId: boardId };
        e.dataTransfer.setData(featureDragType, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={classNames('flex flex-col gap-1 rounded-md border border-(--border-primary) bg-(--bg-primary) p-1.5 text-xs shadow-sm', { 'cursor-grab': canEdit })}
            draggable={canEdit}
            onDragStart={handleDragStart}
            data-pi-card={`${boardId}:${cell.featureKey}`}
            style={{ borderLeft: `4px solid ${color}` }}
        >
            <div className="flex items-start gap-1">
                <span className="min-w-0 flex-1 line-clamp-2 font-medium text-(--text-primary)" title={feature?.summary}>
                    {feature?.summary || cell.featureKey}
                </span>
                {canEdit && (
                    <button type="button" className="shrink-0 cursor-pointer rounded px-1 text-(--text-tertiary) hover:bg-(--bg-hover)" onClick={() => onMove(cell.featureKey)} aria-label={`Move ${cell.featureKey}`} title="Move or plan">
                        <i className="fa fa-arrows" />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-1.5 text-(--text-secondary)">
                <a href={feature?.url} target="_blank" rel="noreferrer" className="cursor-pointer font-medium hover:underline">
                    {cell.featureKey}
                </a>
                {cell.isPlacement ? (
                    <span className="rounded px-1 text-[10px]" style={{ backgroundColor: color, color: getContrastText(color) }} title="Planned before breakdown with a rough estimate">
                        rough
                    </span>
                ) : (
                    <button type="button" className="cursor-pointer hover:underline" onClick={() => setExpanded(!expanded)} title="Show the stories">
                        {cell.count} {cell.count === 1 ? 'story' : 'stories'}
                    </button>
                )}
                <span className="flex-1" />
                {dependencyCount > 0 && (
                    <span className={hasConflict ? 'text-red-600 dark:text-red-400' : ''} title={hasConflict ? 'Has a dependency conflict' : 'Has dependencies'}>
                        <i className="fa fa-link me-0.5" />
                        {dependencyCount}
                    </span>
                )}
                <span className="font-semibold text-(--text-primary)">
                    {formatNumber(cell.estimate)} {unitLabel}
                </span>
            </div>
            {!cell.isPlacement && cell.estimate > 0 && (
                <div className="h-1 overflow-hidden rounded bg-(--bg-tertiary)">
                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
            )}
            {expanded && (
                <ul className="flex flex-col gap-0.5 border-t border-(--border-secondary) pt-1">
                    {cell.storyKeys.map((key) => (
                        <li key={key} className="flex items-center gap-1">
                            <a href={stories[key]?.url} target="_blank" rel="noreferrer" className={classNames('shrink-0 cursor-pointer hover:underline', { 'line-through': stories[key]?.statusCategory === 'done' })}>
                                {key}
                            </a>
                            <span className="truncate text-(--text-secondary)">{stories[key]?.summary}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
