import classNames from 'classnames';

import { Button, InputSwitch } from '@components';

import BoardSwitcher from '../../shared/components/board-switcher/BoardSwitcher';
import type { BoardType, PlannerBoard } from '../../shared/types';
import { plannerViews, type PlannerView } from '../planner-settings';

interface PlannerToolbarProps {
    boardId: number | null;
    board: PlannerBoard | null;
    recentBoardIds: number[];
    boardType: BoardType | null;
    view: PlannerView;
    draftEnabled: boolean;
    draftLocked: boolean;
    isLoading: boolean;
    filterCount: number;
    showFilters: boolean;
    onBoardChange: (board: PlannerBoard) => void;
    onViewChange: (view: PlannerView) => void;
    onDraftToggle: (enabled: boolean) => void;
    onToggleFilters: () => void;
    onRefresh: () => void;
    onSettings: () => void;
    onTeam: () => void;
    onHelp: () => void;
    onExport?: () => void;
}

export default function PlannerToolbar({
    boardId,
    board,
    recentBoardIds,
    boardType,
    view,
    draftEnabled,
    draftLocked,
    isLoading,
    filterCount,
    showFilters,
    onBoardChange,
    onViewChange,
    onDraftToggle,
    onToggleFilters,
    onRefresh,
    onSettings,
    onTeam,
    onHelp,
    onExport,
}: PlannerToolbarProps) {
    const views = plannerViews.filter((v) => !(boardType === 'kanban' && v.needsSprints));

    return (
        <div className="flex shrink-0 flex-col gap-2 border-b border-(--border-primary) bg-(--bg-secondary) px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
                <BoardSwitcher className="max-w-full sm:max-w-96" board={board} boardId={boardId} recentIds={recentBoardIds} onChange={onBoardChange} />
                <span className="flex-1" />
                <div className="flex items-center gap-1" title={draftLocked ? 'Apply or discard the staged changes before leaving draft mode' : 'Stage changes locally and apply them together'}>
                    <InputSwitch checked={draftEnabled} onChange={(e) => onDraftToggle(e.value)} label="Draft mode" />
                </div>
                <Button
                    layout="outlined"
                    size="sm"
                    leftIcon={<i className="fa fa-filter" />}
                    label={filterCount ? `Filters (${filterCount})` : 'Filters'}
                    className={classNames({ 'bg-(--bg-active)': showFilters })}
                    onClick={onToggleFilters}
                    disabled={!boardId}
                />
                <Button layout="outlined" size="sm" leftIcon={<i className="fa fa-users" />} label="Team" onClick={onTeam} disabled={!boardId} />
                {onExport && <Button layout="outlined" size="sm" leftIcon={<i className="fa fa-download" />} title="Export to Excel" ariaLabel="Export" onClick={onExport} />}
                <Button
                    layout="outlined"
                    size="sm"
                    leftIcon={<i className={classNames('fa fa-refresh', { 'fa-spin': isLoading })} />}
                    title="Reload from Jira (clears the cached board data)"
                    ariaLabel="Refresh"
                    onClick={onRefresh}
                    disabled={!boardId || isLoading}
                />
                <Button layout="outlined" size="sm" leftIcon={<i className="fa fa-cog" />} title="Planner settings" ariaLabel="Settings" onClick={onSettings} />
                <Button layout="outlined" size="sm" leftIcon={<i className="fa fa-question-circle" />} title="How to use the planner" ariaLabel="Help" onClick={onHelp} />
            </div>
            <nav className="-mb-2 flex gap-1 overflow-x-auto" aria-label="Planner views">
                {views.map((v) => (
                    <button
                        key={v.value}
                        type="button"
                        className={classNames(
                            'flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm',
                            view === v.value
                                ? 'border-(--color-primary-500) font-semibold text-(--text-primary)'
                                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)',
                        )}
                        onClick={() => onViewChange(v.value)}
                        aria-current={view === v.value ? 'page' : undefined}
                    >
                        <i className={v.icon} />
                        {v.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
