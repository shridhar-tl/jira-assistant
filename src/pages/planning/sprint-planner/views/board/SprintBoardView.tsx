import { useCallback, useMemo, useState, type MouseEvent } from 'react';

import { isAfter } from 'date-fns';

import { KanbanBoard, showContextMenu, type ContextMenuItemInput, type KanbanCardData, type KanbanCardMoveEvent, type KanbanCardReorderEvent, type KanbanColumnData } from '@components';

import { backlogColumnId } from '../../../shared/board-loader';
import DependencyOverlay, { type OverlayLink } from '../../../shared/components/DependencyOverlay';
import ResizablePanels from '../../../shared/components/ResizablePanels';
import { getIssueHours, getIssuePoints, isIssueEstimated } from '../../../shared/capacity';
import { getDisplayUnit } from '../../../shared/format';
import { computeSprintHealth } from '../../../shared/health';
import type { PlannerSprint } from '../../../shared/types';
import { findIssueColumn, loadMore, moveIssues, saveTeam, setSelection, toggleCollapsedColumn, toggleSelection } from '../../actions';
import { usePlannerStore } from '../../store';
import type { BoardModel } from '../../useBoardModel';
import DependencyDialog from '../dependencies/DependencyDialog';
import AssigneeBreakdown from './AssigneeBreakdown';
import CapacityOverrideDialog from './CapacityOverrideDialog';
import ColumnHeader from './ColumnHeader';
import CompleteSprintDialog from './CompleteSprintDialog';
import CreateIssueDialog from './CreateIssueDialog';
import EpicStrip from './EpicStrip';
import IssueCard, { type CardWarnings } from './IssueCard';
import IssueEditDialog from './IssueEditDialog';
import SprintDialog, { type SprintDialogMode } from './SprintDialog';

import './SprintBoard.css';

interface SprintBoardViewProps {
    model: BoardModel;
    onShowHealth?: () => void;
}

type BoardDialog =
    | { kind: 'edit'; key: string }
    | { kind: 'create'; columnId: string }
    | { kind: 'sprint'; mode: SprintDialogMode; sprint: PlannerSprint | null }
    | { kind: 'complete'; sprint: PlannerSprint }
    | { kind: 'override'; sprint: PlannerSprint }
    | { kind: 'dependency'; key: string };

const noWarnings: CardWarnings = { unestimated: false, unassigned: false, blocked: false, dueAfterEnd: false };

/** Position in the full column for an index in the filtered list of cards shown. */
function toFullIndex(fullKeys: string[], visibleKeys: string[], visibleIndex: number): number {
    if (visibleIndex < visibleKeys.length) {
        const index = fullKeys.indexOf(visibleKeys[visibleIndex]);
        return index < 0 ? fullKeys.length : index;
    }
    const lastVisible = visibleKeys[visibleKeys.length - 1];
    return lastVisible ? fullKeys.indexOf(lastVisible) + 1 : fullKeys.length;
}

function findMovedKey(before: string[], after: string[]): string | null {
    for (const candidate of after) {
        const a = before.filter((k) => k !== candidate);
        const b = after.filter((k) => k !== candidate);
        if (a.length === b.length && a.every((k, i) => k === b[i]) && before.indexOf(candidate) !== after.indexOf(candidate)) {
            return candidate;
        }
    }
    return null;
}

export default function SprintBoardView({ model, onShowHealth }: SprintBoardViewProps) {
    const { data, capacities, blocking, isVisible } = model;
    const settings = usePlannerStore((s) => s.settings);
    const selection = usePlannerStore((s) => s.selection);
    const saving = usePlannerStore((s) => s.saving);
    const highlightParent = usePlannerStore((s) => s.highlightParent);
    const [dialog, setDialog] = useState<BoardDialog | null>(null);
    const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<string>>(new Set());
    const [boardElement, setBoardElement] = useState<HTMLDivElement | null>(null);

    const { permissions } = data;
    const unit = getDisplayUnit(data.team.planningUnit, data.estimateUnit);
    const collapsed = useMemo(() => new Set(settings.collapsedColumns[String(data.board.id)] || []), [settings.collapsedColumns, data.board.id]);
    const closedSprintIds = useMemo(() => new Set(data.sprints.filter((s) => s.state === 'closed').map((s) => s.id)), [data.sprints]);

    const columnIds = useMemo(() => [backlogColumnId, ...data.sprints.map((s) => String(s.id))], [data.sprints]);
    const columnTitles = useMemo(() => {
        const titles: Record<string, string> = { [backlogColumnId]: 'Backlog' };
        data.sprints.forEach((s) => (titles[String(s.id)] = s.name));
        return titles;
    }, [data.sprints]);

    const visibleColumnKeys = useMemo(() => {
        const result: Record<string, string[]> = {};
        for (const columnId of columnIds) {
            result[columnId] = (data.columns[columnId] || []).filter((key) => {
                const issue = data.issues[key];
                return issue && isVisible(issue);
            });
        }
        return result;
    }, [columnIds, data.columns, data.issues, isVisible]);

    const columns: KanbanColumnData[] = useMemo(
        () =>
            columnIds.map((id) => {
                const sprint = data.sprints.find((s) => String(s.id) === id);
                return {
                    id,
                    title: columnTitles[id],
                    collapsed: collapsed.has(id),
                    locked: sprint?.state === 'closed' || !permissions.scheduleIssues,
                };
            }),
        [columnIds, columnTitles, collapsed, data.sprints, permissions.scheduleIssues],
    );

    const cards: KanbanCardData[] = useMemo(
        () =>
            columnIds.flatMap((columnId) =>
                visibleColumnKeys[columnId].map((key, order) => ({ id: key, title: data.issues[key].summary, columnId, order })),
            ),
        [columnIds, visibleColumnKeys, data.issues],
    );

    const getKeysToMove = useCallback(
        (key: string) => {
            if (!selection.includes(key)) {
                return [key];
            }
            const ordered: string[] = [];
            columnIds.forEach((columnId) => (data.columns[columnId] || []).forEach((k) => selection.includes(k) && ordered.push(k)));
            return ordered;
        },
        [selection, columnIds, data.columns],
    );

    const moveTo = useCallback(
        (key: string, toColumn: string, visibleIndex: number) => {
            const keys = getKeysToMove(key);
            const fullKeys = (data.columns[toColumn] || []).filter((k) => !keys.includes(k));
            const visibleKeys = visibleColumnKeys[toColumn].filter((k) => !keys.includes(k));
            moveIssues(keys, toColumn, toFullIndex(fullKeys, visibleKeys, visibleIndex));
        },
        [getKeysToMove, data.columns, visibleColumnKeys],
    );

    const handleCardMove = useCallback((e: KanbanCardMoveEvent) => moveTo(String(e.cardId), String(e.toColumnId), e.toIndex), [moveTo]);

    const handleCardReorder = useCallback(
        (e: KanbanCardReorderEvent) => {
            const columnId = String(e.columnId);
            const after = e.cards.map((c) => String(c.id));
            const movedKey = findMovedKey(visibleColumnKeys[columnId], after);
            if (movedKey) {
                moveTo(movedKey, columnId, after.indexOf(movedKey));
            }
        },
        [visibleColumnKeys, moveTo],
    );

    const handleSelect = useCallback((key: string) => toggleSelection(key), []);
    const handleOpen = useCallback((key: string) => setDialog({ kind: 'edit', key }), []);

    const handleCardMenu = useCallback(
        (key: string, event: MouseEvent) => {
            const currentColumn = findIssueColumn(data, key);
            const keys = getKeysToMove(key);
            const label = keys.length > 1 ? `${keys.length} selected issues` : key;
            const targets = columnIds.filter((id) => id !== currentColumn && !closedSprintIds.has(Number(id)));
            const issue = data.issues[key];

            const items: ContextMenuItemInput[] = [
                { label: 'Edit…', icon: 'fa fa-pencil', command: () => setDialog({ kind: 'edit', key }) },
                { label: 'Open in Jira', icon: 'fa fa-external-link', command: () => window.open(issue.url, '_blank', 'noreferrer') },
                { label: selection.includes(key) ? 'Deselect' : 'Select', icon: 'fa fa-square-check', command: () => toggleSelection(key) },
            ];
            if (permissions.scheduleIssues && currentColumn) {
                items.push(
                    { separator: true },
                    { label: `Move ${label} to`, icon: 'fa fa-arrow-right', items: targets.map((id) => ({ label: columnTitles[id], command: () => moveIssues(keys, id, (data.columns[id] || []).length) })) },
                    { label: 'Move to top', icon: 'fa fa-angle-double-up', command: () => moveIssues(keys, currentColumn, 0) },
                    { label: 'Move to bottom', icon: 'fa fa-angle-double-down', command: () => moveIssues(keys, currentColumn, (data.columns[currentColumn] || []).length) },
                );
            }
            if (permissions.linkIssues) {
                items.push({ separator: true }, { label: 'Add dependency…', icon: 'fa fa-link', command: () => setDialog({ kind: 'dependency', key }) });
            }
            if (selection.length) {
                items.push({ separator: true }, { label: 'Clear selection', icon: 'fa fa-times', command: () => setSelection([]) });
            }
            showContextMenu(event, items);
        },
        [data, getKeysToMove, columnIds, closedSprintIds, columnTitles, permissions, selection],
    );

    const handleColumnMenu = useCallback(
        (columnId: string, event: MouseEvent) => {
            const sprint = data.sprints.find((s) => String(s.id) === columnId) || null;
            const items: ContextMenuItemInput[] = [];
            if (permissions.createIssues) {
                items.push({ label: 'Create issue…', icon: 'fa fa-plus', command: () => setDialog({ kind: 'create', columnId }) });
            }
            if (sprint && permissions.manageSprints && sprint.state !== 'closed') {
                items.push({ label: 'Edit sprint…', icon: 'fa fa-pencil', command: () => setDialog({ kind: 'sprint', mode: 'edit', sprint }) });
                if (sprint.state === 'future') {
                    items.push({ label: 'Start sprint…', icon: 'fa fa-play', command: () => setDialog({ kind: 'sprint', mode: 'start', sprint }) });
                }
                if (sprint.state === 'active') {
                    items.push({ label: 'Complete sprint…', icon: 'fa fa-flag-checkered', command: () => setDialog({ kind: 'complete', sprint }) });
                }
            }
            if (sprint && sprint.state !== 'closed') {
                items.push({ label: 'Capacity override…', icon: 'fa fa-percent', command: () => setDialog({ kind: 'override', sprint }) });
            }
            if (!columnId || columnId === backlogColumnId) {
                if (permissions.manageSprints) {
                    items.push({ label: 'Create sprint…', icon: 'fa fa-calendar-plus', command: () => setDialog({ kind: 'sprint', mode: 'create', sprint: null }) });
                }
            }
            if (items.length) {
                showContextMenu(event, items);
            }
        },
        [data.sprints, permissions],
    );

    const healthScores = useMemo(() => {
        const openIds = new Set(model.openSprints.map((s) => s.id));
        const scores = new Map<number, number>();
        for (const sprint of model.openSprints) {
            const issues = (data.columns[String(sprint.id)] || []).map((k) => data.issues[k]).filter((i) => !!i);
            scores.set(
                sprint.id,
                computeSprintHealth({
                    sprint,
                    range: data.sprintRanges.get(sprint.id) || null,
                    issues,
                    capacity: capacities.get(sprint.id) || null,
                    blockingDependencies: blocking,
                    openSprintIds: openIds,
                    estimateUnit: data.estimateUnit,
                    scopeChange: null,
                }).score,
            );
        }
        return scores;
    }, [model.openSprints, data, capacities, blocking]);

    const columnHeaderTemplate = useCallback(
        (column: KanbanColumnData, _count: number, helpers: { toggleCollapse: () => void }) => {
            const columnId = String(column.id);
            const sprint = data.sprints.find((s) => String(s.id) === columnId) || null;
            const keys = data.columns[columnId] || [];
            const issues = keys.map((k) => data.issues[k]).filter((i) => i && !i.isSubtask);
            const totalEstimate = issues.reduce(
                (sum, i) => sum + (unit === 'hours' ? getIssueHours(i) : getIssuePoints(i, data.estimateUnit)),
                0,
            );
            const unestimatedCount = issues.filter((i) => i.statusCategory !== 'done' && !isIssueEstimated(i, data.estimateUnit)).length;

            return (
                <ColumnHeader
                    title={column.title}
                    sprint={sprint}
                    capacity={sprint ? capacities.get(sprint.id) || null : null}
                    unit={unit}
                    showBoth={data.team.planningUnit === 'both'}
                    issueCount={issues.length}
                    totalEstimate={totalEstimate}
                    unestimatedCount={unestimatedCount}
                    derivedDates={!!(sprint && data.sprintRanges.get(sprint.id)?.isDerived)}
                    healthScore={sprint ? (healthScores.get(sprint.id) ?? null) : null}
                    onHealthClick={onShowHealth}
                    onCollapse={() => {
                        helpers.toggleCollapse();
                    }}
                    onMenu={(e) => handleColumnMenu(columnId, e)}
                />
            );
        },
        [data, capacities, unit, handleColumnMenu, healthScores, onShowHealth],
    );

    const columnFooterTemplate = useCallback(
        (column: KanbanColumnData) => {
            const columnId = String(column.id);
            const sprint = data.sprints.find((s) => String(s.id) === columnId);
            const capacity = sprint ? capacities.get(sprint.id) : undefined;
            const expanded = expandedBreakdowns.has(columnId);
            const hiddenCount = (data.columns[columnId] || []).length - visibleColumnKeys[columnId].length;

            return (
                <div className="flex flex-col gap-1 text-[11px]">
                    {hiddenCount > 0 && <span className="text-(--text-tertiary)">{hiddenCount} hidden by filters</span>}
                    {capacity && (
                        <button
                            type="button"
                            className="flex cursor-pointer items-center gap-1 text-(--text-secondary) hover:text-(--text-primary)"
                            onClick={() =>
                                setExpandedBreakdowns((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(columnId)) {
                                        next.delete(columnId);
                                    } else {
                                        next.add(columnId);
                                    }
                                    return next;
                                })
                            }
                        >
                            <i className={expanded ? 'fa fa-caret-down' : 'fa fa-caret-right'} />
                            People ({capacity.members.filter((m) => m.level === 'over').length} over capacity)
                        </button>
                    )}
                    {capacity && expanded && (
                        <AssigneeBreakdown
                            capacity={capacity}
                            unit={unit}
                            onSelectMember={(memberId) => usePlannerStore.setState((state) => ({ filters: { ...state.filters, assignees: [memberId] } }))}
                        />
                    )}
                    <div className="flex items-center gap-2">
                        {permissions.createIssues && sprint?.state !== 'closed' && (
                            <button type="button" className="cursor-pointer text-(--primary-color) hover:underline" onClick={() => setDialog({ kind: 'create', columnId })}>
                                <i className="fa fa-plus me-1" />
                                Create issue
                            </button>
                        )}
                        {columnId === backlogColumnId && data.backlogNextToken && (
                            <button type="button" className="ms-auto cursor-pointer text-(--primary-color) hover:underline" onClick={() => loadMore()}>
                                Load more
                            </button>
                        )}
                    </div>
                </div>
            );
        },
        [data, capacities, expandedBreakdowns, visibleColumnKeys, unit, permissions.createIssues],
    );

    const cardTemplate = useCallback(
        (card: KanbanCardData, column: KanbanColumnData) => {
            const issue = data.issues[String(card.id)];
            const sprintId = column.id === backlogColumnId ? null : Number(column.id);
            const range = sprintId ? data.sprintRanges.get(sprintId) : undefined;
            const parentKey = issue.epicKey || issue.parentKey;
            const open = issue.statusCategory !== 'done';
            const warnings: CardWarnings = open
                ? {
                      unestimated: !issue.isSubtask && !isIssueEstimated(issue, data.estimateUnit),
                      unassigned: !issue.assignee && !issue.segments.length,
                      blocked: !!blocking.get(issue.key)?.length,
                      dueAfterEnd: !!range && !!issue.dueDate && isAfter(issue.dueDate, range.end),
                  }
                : noWarnings;

            return (
                <IssueCard
                    issue={issue}
                    parentSummary={parentKey ? data.parents[parentKey]?.summary || issue.parent?.summary : undefined}
                    parentColor={parentKey ? data.parents[parentKey]?.color : null}
                    estimateUnit={data.estimateUnit}
                    compact={settings.cardDensity === 'compact'}
                    fields={settings.cardFields}
                    warnings={warnings}
                    selected={selection.includes(issue.key)}
                    highlighted={!!highlightParent && (issue.epicKey || issue.parentKey) === highlightParent}
                    dimmed={!!highlightParent && (issue.epicKey || issue.parentKey) !== highlightParent && highlightParent !== '__none__'}
                    saving={!!saving[issue.key]}
                    subtaskCount={settings.subtaskMode === 'rollup' ? issue.subtaskKeys.length : 0}
                    onSelect={handleSelect}
                    onOpen={handleOpen}
                    onMenu={handleCardMenu}
                />
            );
        },
        [data, blocking, settings, selection, highlightParent, saving, handleSelect, handleOpen, handleCardMenu],
    );

    const dependencyLinks: OverlayLink[] = useMemo(
        () =>
            settings.showDependencyLines
                ? model.dependencies
                      .filter((d) => !d.blockerDone && data.issues[d.blockerKey] && data.issues[d.dependantKey])
                      .map((d) => ({ id: d.id, from: d.blockerKey, to: d.dependantKey, conflict: d.conflict !== 'none', title: `${d.blockerKey} blocks ${d.dependantKey}` }))
                : [],
        [settings.showDependencyLines, model.dependencies, data.issues],
    );

    const hasParentRows = settings.showEpicStrip && columnIds.some((id) => (data.columns[id] || []).some((key) => data.issues[key] && !data.issues[key].isSubtask));

    const lastSprint = data.sprints[data.sprints.length - 1] || null;
    const lastRange = lastSprint ? data.sprintRanges.get(lastSprint.id) : undefined;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <ResizablePanels
                panelId="board-parents"
                layout="vertical"
                sideFirst
                defaultSideSize={150}
                minSideSize={60}
                minMainSize={260}
                side={
                    hasParentRows ? (
                        <EpicStrip
                            model={model}
                            columnIds={columnIds}
                            columnTitles={columnTitles}
                            highlighted={highlightParent}
                            onHighlight={(key) => usePlannerStore.setState({ highlightParent: key })}
                        />
                    ) : undefined
                }
                main={
                    <div ref={setBoardElement} className="relative h-full min-h-0 overflow-hidden p-2">
                        <KanbanBoard
                            className="sprint-planner-board h-full"
                            columns={columns}
                            cards={cards}
                            columnWidth={300}
                            fillHeight
                            allowCollapse
                            stickyColumnHeaders
                            draggable={permissions.scheduleIssues}
                            cardTemplate={cardTemplate}
                            columnHeaderTemplate={columnHeaderTemplate}
                            columnFooterTemplate={columnFooterTemplate}
                            onCardMove={handleCardMove}
                            onCardReorder={handleCardReorder}
                            onColumnCollapse={(id, isCollapsed) => toggleCollapsedColumn(String(id), isCollapsed)}
                            emptyColumnTemplate={() => <div className="p-3 text-center text-xs text-(--text-tertiary)">Drop issues here</div>}
                        />
                        <DependencyOverlay container={boardElement} links={dependencyLinks} attribute="data-issue-key" visible={settings.showDependencyLines} />
                    </div>
                }
            />

            {dialog?.kind === 'edit' && (
                <IssueEditDialog issueKey={dialog.key} data={data} canEdit={permissions.editIssues} canSchedule={permissions.scheduleIssues} onHide={() => setDialog(null)} />
            )}
            {dialog?.kind === 'create' && <CreateIssueDialog columnId={dialog.columnId} data={data} onHide={() => setDialog(null)} />}
            {dialog?.kind === 'sprint' && (
                <SprintDialog
                    mode={dialog.mode}
                    sprint={dialog.sprint}
                    lastSprint={lastSprint}
                    boardName={data.board.name}
                    defaultRange={
                        dialog.sprint ? data.sprintRanges.get(dialog.sprint.id) || null : lastRange ? { start: new Date(lastRange.end.getTime() + 86400000), end: new Date(lastRange.end.getTime() + (lastRange.end.getTime() - lastRange.start.getTime()) + 86400000) } : null
                    }
                    onHide={() => setDialog(null)}
                />
            )}
            {dialog?.kind === 'complete' && <CompleteSprintDialog sprint={dialog.sprint} data={data} onHide={() => setDialog(null)} />}
            {dialog?.kind === 'override' && (
                <CapacityOverrideDialog
                    sprint={dialog.sprint}
                    value={data.team.sprintOverrides[String(dialog.sprint.id)] ?? 100}
                    onSave={async (percent) => {
                        const overrides = { ...data.team.sprintOverrides };
                        if (percent === 100) {
                            delete overrides[String(dialog.sprint.id)];
                        } else {
                            overrides[String(dialog.sprint.id)] = percent;
                        }
                        if (await saveTeam({ ...data.team, sprintOverrides: overrides })) {
                            setDialog(null);
                        }
                    }}
                    onHide={() => setDialog(null)}
                />
            )}
            {dialog?.kind === 'dependency' && <DependencyDialog issueKey={dialog.key} data={data} onHide={() => setDialog(null)} />}
        </div>
    );
}
