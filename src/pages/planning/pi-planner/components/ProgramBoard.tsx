import { useMemo, useState, type DragEvent } from 'react';

import classNames from 'classnames';
import { isAfter, isBefore } from 'date-fns';

import { InputSwitch } from '@components';

import CapacityBar from '../../shared/components/CapacityBar';
import DependencyOverlay, { type OverlayLink } from '../../shared/components/DependencyOverlay';
import ResizablePanels from '../../shared/components/ResizablePanels';
import { formatDateRange, formatNumber } from '../../shared/format';
import { parseDateKey } from '../../shared/segments';
import type { PiData } from '../pi-loader';
import { unplannedIterationId, type PiTeamRow, type ProgramModel } from '../pi-model';
import type { PiDocument } from '../pi-types';
import { lowerTerm, type TermSet } from '../terminology';

import FeatureCard, { featureDragType, type FeatureDragData } from './FeatureCard';
import MoveFeatureDialog, { type MoveTarget } from './MoveFeatureDialog';

interface ProgramBoardProps {
    doc: PiDocument;
    data: PiData;
    model: ProgramModel;
    terms: TermSet;
    canEdit: boolean;
}

interface ColumnInfo {
    id: string;
    name: string;
    start: Date | null;
    end: Date | null;
    isIp: boolean;
}

export default function ProgramBoard({ doc, data, model, terms, canEdit }: ProgramBoardProps) {
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
    const [showLines, setShowLines] = useState(true);
    const [dragOver, setDragOver] = useState<string | null>(null);

    const aligned = model.rows[0]?.columns.length ? model.rows.every((r) => r.columns.length === model.rows[0].columns.length && r.columns.every((c, i) => c.id === model.rows[0].columns[i].id)) : true;
    const headerColumns: ColumnInfo[] = aligned ? model.rows[0]?.columns || [] : [];

    const depCount = useMemo(() => {
        const counts = new Map<string, { count: number; conflict: boolean }>();
        for (const dep of model.featureDependencies) {
            for (const key of [dep.fromKey, dep.toKey]) {
                const current = counts.get(key) || { count: 0, conflict: false };
                counts.set(key, { count: current.count + 1, conflict: current.conflict || dep.conflict });
            }
        }
        return counts;
    }, [model.featureDependencies]);

    const links: OverlayLink[] = useMemo(() => {
        const firstCard = (featureKey: string) => {
            for (const row of model.rows) {
                for (const column of [...row.columns.map((c) => c.id), unplannedIterationId]) {
                    if ((row.cells[column] || []).some((c) => c.featureKey === featureKey)) {
                        return `${row.team.boardId}:${featureKey}`;
                    }
                }
            }
            return null;
        };
        return model.featureDependencies
            .map((dep) => {
                const from = firstCard(dep.fromKey);
                const to = firstCard(dep.toKey);
                return from && to ? { id: `${dep.fromKey}>${dep.toKey}`, from, to, conflict: dep.conflict, title: `${dep.fromKey} blocks ${dep.toKey}` } : null;
            })
            .filter((l): l is OverlayLink => !!l);
    }, [model]);

    const milestonesIn = (column: ColumnInfo) =>
        doc.milestones.filter((m) => {
            const date = parseDateKey(m.date);
            return column.start && column.end && !isBefore(date, column.start) && !isAfter(date, column.end);
        });

    const handleDrop = (e: DragEvent<HTMLDivElement>, boardId: number, columnId: string) => {
        setDragOver(null);
        const raw = e.dataTransfer.getData(featureDragType);
        if (!raw || !canEdit) {
            return;
        }
        e.preventDefault();
        const payload = JSON.parse(raw) as FeatureDragData;
        setMoveTarget({ featureKey: payload.featureKey, boardId, columnId });
    };

    const renderCell = (row: PiTeamRow, columnId: string) => {
        const cellId = `${row.team.boardId}:${columnId}`;
        const load = row.loads[columnId];
        const unitLabel = row.unit === 'hours' ? 'h' : 'pts';
        return (
            <div
                key={cellId}
                className={classNames('flex min-h-24 min-w-52 flex-col gap-1.5 rounded border border-(--border-secondary) bg-(--bg-secondary) p-1.5', {
                    'ring-2 ring-(--color-primary-400)': dragOver === cellId,
                })}
                onDragOver={(e) => {
                    if (canEdit && e.dataTransfer.types.includes(featureDragType)) {
                        e.preventDefault();
                        setDragOver(cellId);
                    }
                }}
                onDragLeave={() => setDragOver((current) => (current === cellId ? null : current))}
                onDrop={(e) => handleDrop(e, row.team.boardId, columnId)}
            >
                {load && columnId !== unplannedIterationId && (
                    <CapacityBar committed={load.load} capacity={load.capacity} level={load.level} unit={unitLabel} label={load.sprints.map((s) => s.name).join(', ') || 'No sprint'} />
                )}
                {(row.cells[columnId] || []).map((cell) => (
                    <FeatureCard
                        key={cell.featureKey}
                        cell={cell}
                        feature={data.features[cell.featureKey]}
                        stories={data.stories}
                        boardId={row.team.boardId}
                        unitLabel={unitLabel}
                        dependencyCount={depCount.get(cell.featureKey)?.count || 0}
                        hasConflict={!!depCount.get(cell.featureKey)?.conflict}
                        canEdit={canEdit}
                        onMove={(featureKey) => setMoveTarget({ featureKey, boardId: row.team.boardId, columnId })}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col p-2">
            <ResizablePanels
                panelId="program-backlog"
                defaultSideSize={260}
                minSideSize={180}
                minMainSize={360}
                main={
                    <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
                        <div className="flex items-center gap-3 pr-2 text-xs text-(--text-secondary)">
                            <span>Drag a {lowerTerm(terms.feature)} to a team and {lowerTerm(terms.iteration)} to move its stories there. Stories not in a sprint are in the last column.</span>
                            <span className="flex-1" />
                            <span className="shrink-0 whitespace-nowrap">
                                <InputSwitch label="Dependency lines" checked={showLines} onChange={(e) => setShowLines(e.value)} />
                            </span>
                        </div>
                        <div ref={setContainer} className="relative min-h-0 flex-1 overflow-auto">
                            <div className="inline-flex min-w-full flex-col gap-2">
                                {aligned && (
                                    <div className="sticky top-0 z-20 flex gap-2 bg-(--bg-primary) pb-1">
                                        <div className="w-40 shrink-0" />
                                        {headerColumns.map((column) => (
                                            <div key={column.id} className="min-w-52 flex-1 text-xs">
                                                <div className="flex items-center gap-1 font-semibold text-(--text-primary)">
                                                    {column.name}
                                                    {column.isIp && <span className="rounded bg-violet-100 px-1 text-[10px] text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{terms.ipIteration}</span>}
                                                </div>
                                                <div className="text-(--text-secondary)">{formatDateRange(column.start, column.end)}</div>
                                                {milestonesIn(column).map((m) => (
                                                    <div key={m.id} className="truncate text-amber-600 dark:text-amber-400" title={m.title}>
                                                        <i className={m.kind === 'release' ? 'fa fa-rocket me-1' : 'fa fa-flag me-1'} />
                                                        {m.title}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                        <div className="min-w-52 flex-1 text-xs font-semibold text-(--text-secondary)">Not in a sprint</div>
                                    </div>
                                )}
                                {model.rows.map((row) => {
                                    const total = row.columns.reduce((sum, c) => sum + (row.loads[c.id]?.load || 0), 0);
                                    const capacity = row.columns.reduce((sum, c) => sum + (row.loads[c.id]?.capacity || 0), 0);
                                    return (
                                        <div key={row.team.boardId} className="flex gap-2">
                                            <div className="sticky left-0 z-10 flex w-40 shrink-0 flex-col gap-1 bg-(--bg-primary) py-1 text-sm">
                                                <span className="font-semibold">{row.team.name}</span>
                                                <span className="text-xs text-(--text-secondary)">
                                                    {formatNumber(total)} / {formatNumber(capacity)} {row.unit === 'hours' ? 'h' : 'pts'}
                                                </span>
                                                {!row.data && <span className="text-xs text-red-600">Board not accessible</span>}
                                            </div>
                                            {row.columns.map((column) => (
                                                <div key={column.id} className="flex min-w-52 flex-1 flex-col">
                                                    {!aligned && (
                                                        <div className="text-xs font-semibold">
                                                            {column.name} <span className="font-normal text-(--text-secondary)">{formatDateRange(column.start, column.end)}</span>
                                                        </div>
                                                    )}
                                                    {renderCell(row, column.id)}
                                                </div>
                                            ))}
                                            <div className="flex min-w-52 flex-1 flex-col">{renderCell(row, unplannedIterationId)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <DependencyOverlay container={container} links={links} attribute="data-pi-card" visible={showLines} />
                        </div>
                    </div>
                }
                side={
                    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-(--border-primary)">
                        <div className="shrink-0 border-b border-(--border-primary) bg-(--bg-secondary) px-2 py-1.5 text-sm font-semibold">
                            {terms.features} not planned <span className="font-normal text-(--text-secondary)">({model.unplannedFeatures.length})</span>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto p-1.5">
                            {model.unplannedFeatures.map((key) => {
                                const feature = data.features[key];
                                return (
                                    <div
                                        key={key}
                                        className={classNames('flex items-center gap-1.5 rounded border border-(--border-primary) bg-(--bg-primary) px-1.5 py-1 text-xs', { 'cursor-grab': canEdit })}
                                        draggable={canEdit}
                                        onDragStart={(e) => e.dataTransfer.setData(featureDragType, JSON.stringify({ featureKey: key, fromBoardId: 0 } satisfies FeatureDragData))}
                                    >
                                        <span className="shrink-0 font-medium">{key}</span>
                                        <span className="min-w-0 flex-1 truncate" title={feature?.summary}>
                                            {feature?.summary}
                                        </span>
                                        {canEdit && (
                                            <button type="button" className="cursor-pointer rounded px-1 text-(--text-tertiary) hover:bg-(--bg-hover)" onClick={() => setMoveTarget({ featureKey: key, boardId: null, columnId: null })} aria-label={`Plan ${key}`}>
                                                <i className="fa fa-calendar-plus" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {!model.unplannedFeatures.length && <span className="p-2 text-xs text-(--text-tertiary)">Every open {lowerTerm(terms.feature)} is planned.</span>}
                        </div>
                    </aside>
                }
            />

            {moveTarget && <MoveFeatureDialog target={moveTarget} model={model} data={data} terms={terms} onHide={() => setMoveTarget(null)} />}
        </div>
    );
}
