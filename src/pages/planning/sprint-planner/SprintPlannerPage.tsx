import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { useNavigate, useParams } from 'react-router';

import { ExportHelper } from '@/common/export-helper';
import { GadgetAlert } from '@/gadgets/shared';
import { phoneMediaQuery, useMediaQuery } from '@/hooks';

import { BlockLoading, Button, Modal } from '@components';

import type { PlannerBoard } from '../shared/types';

import { changeSettings, loadBoard, refreshBoard, toggleDraftMode } from './actions';
import DraftBar from './components/DraftBar';
import FilterBar from './components/FilterBar';
import PlannerSettingsDrawer from './components/PlannerSettingsDrawer';
import PlannerToolbar from './components/PlannerToolbar';
import SprintPlannerInfo from './components/SprintPlannerInfo';
import StorageConsentNotice from './components/StorageConsentNotice';
import { plannerViews, type PlannerView } from './planner-settings';
import { hasActiveFilters, usePlannerStore } from './store';
import useBoardModel from './useBoardModel';
import SprintBoardView from './views/board/SprintBoardView';
import HealthView from './views/health/HealthView';

const CapacityView = lazy(() => import('./views/capacity/CapacityView'));
const LeaveCalendarView = lazy(() => import('./views/leave/LeaveCalendarView'));
const ForecastView = lazy(() => import('./views/forecast/ForecastView'));
const RoadmapView = lazy(() => import('./views/roadmap/RoadmapView'));
const ResourceTimelineView = lazy(() => import('./views/resources/ResourceTimelineView'));
const DependencyListView = lazy(() => import('./views/dependencies/DependencyListView'));
const TeamSettingsDialog = lazy(() => import('./views/capacity/TeamSettingsDialog'));

const refreshOnFocusAfterMs = 60000;
const recentBoardCount = 5;
const exportableViews: PlannerView[] = ['capacity', 'forecast', 'health', 'dependencies'];


function parseBoardId(value: string | undefined): number | null {
    const id = Number(value?.split(',')[0]);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function parseView(value: string | undefined): PlannerView | null {
    return plannerViews.some((v) => v.value === value) ? (value as PlannerView) : null;
}

export default function SprintPlannerPage() {
    const { userId, boardIds, view: viewParam } = useParams();
    const navigate = useNavigate();
    const isPhone = useMediaQuery(phoneMediaQuery);
    const contentRef = useRef<HTMLDivElement>(null);

    const settings = usePlannerStore((s) => s.settings);
    const data = usePlannerStore((s) => s.data);
    const isLoading = usePlannerStore((s) => s.isLoading);
    const error = usePlannerStore((s) => s.error);
    const draft = usePlannerStore((s) => s.draft);
    const filters = usePlannerStore((s) => s.filters);
    const activeBoardId = usePlannerStore((s) => s.activeBoardId);
    const teamReadOnlyReason = usePlannerStore((s) => s.teamReadOnlyReason);
    const model = useBoardModel();

    const [showFilters, setShowFilters] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTeam, setShowTeam] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const boardId = parseBoardId(boardIds) ?? settings.boardIds[0] ?? null;
    const requestedView = parseView(viewParam) ?? settings.view;
    const isKanban = data?.config.type === 'kanban';
    const view: PlannerView = isKanban && plannerViews.find((v) => v.value === requestedView)?.needsSprints ? 'capacity' : requestedView;

    const goTo = useCallback(
        (nextBoardId: number | null, nextView: PlannerView) => {
            navigate(`/${userId}/planning/sprint-planner${nextBoardId ? `/${nextBoardId}/${nextView}` : ''}`);
        },
        [navigate, userId],
    );

    useEffect(() => {
        if (boardId !== activeBoardId || (!data && !isLoading && !error)) {
            loadBoard(boardId);
        }
        if (boardId && (settings.boardIds[0] !== boardId || settings.view !== view)) {
            changeSettings({ boardIds: [boardId, ...settings.boardIds.filter((id) => id !== boardId)].slice(0, recentBoardCount), view });
        }
    }, [boardId, view]);

    useEffect(() => {
        const handleVisible = () => {
            const state = usePlannerStore.getState();
            if (
                document.visibilityState === 'visible' &&
                state.data &&
                !state.isLoading &&
                !state.draft.changes.length &&
                Date.now() - state.data.loadedAt > refreshOnFocusAfterMs
            ) {
                loadBoard(state.data.board.id);
            }
        };
        document.addEventListener('visibilitychange', handleVisible);
        return () => document.removeEventListener('visibilitychange', handleVisible);
    }, []);

    const handleBoardChange = useCallback((board: PlannerBoard) => goTo(board.id, view), [goTo, view]);
    const handleViewChange = useCallback((nextView: PlannerView) => goTo(boardId, nextView), [goTo, boardId]);

    const handleExport = useCallback(() => {
        if (!contentRef.current) {
            return;
        }
        const helper = new ExportHelper();
        helper.element = contentRef.current;
        helper.fileName = `${data?.board.name || 'planner'} - ${plannerViews.find((v) => v.value === view)?.label}`;
        helper.format = 'XLSX';
        helper.export();
    }, [data?.board.name, view]);

    const renderView = () => {
        if (!boardId) {
            return <SprintPlannerInfo />;
        }
        if (error) {
            return (
                <GadgetAlert action={<Button label="Retry" size="sm" layout="outlined" onClick={refreshBoard} />}>
                    {error}
                </GadgetAlert>
            );
        }
        if (!model) {
            return <BlockLoading />;
        }

        if (view === 'board') {
            return isPhone ? <HealthView model={model} compact /> : <SprintBoardView model={model} onShowHealth={() => handleViewChange('health')} />;
        }
        if (view === 'health') {
            return <HealthView model={model} />;
        }
        return (
            <Suspense fallback={<BlockLoading />}>
                {view === 'capacity' && <CapacityView model={model} />}
                {view === 'leave' && <LeaveCalendarView model={model} />}
                {view === 'forecast' && <ForecastView model={model} />}
                {view === 'roadmap' && <RoadmapView model={model} />}
                {view === 'resources' && <ResourceTimelineView model={model} />}
                {view === 'dependencies' && <DependencyListView model={model} />}
            </Suspense>
        );
    };

    return (
        <div className="sprint-planner flex h-[calc(100vh-3rem)] min-h-0 flex-col bg-(--bg-primary)">
            <PlannerToolbar
                boardId={boardId}
                board={data?.board.id === boardId ? data.board : null}
                recentBoardIds={settings.boardIds}
                boardType={data?.config.type || null}
                view={view}
                draftEnabled={draft.enabled}
                draftLocked={draft.changes.length > 0}
                isLoading={isLoading}
                filterCount={hasActiveFilters(filters) ? Object.values(filters).filter((v) => (Array.isArray(v) ? v.length : !!v)).length : 0}
                showFilters={showFilters}
                onBoardChange={handleBoardChange}
                onViewChange={handleViewChange}
                onDraftToggle={toggleDraftMode}
                onToggleFilters={() => setShowFilters((v) => !v)}
                onRefresh={refreshBoard}
                onSettings={() => setShowSettings(true)}
                onTeam={() => setShowTeam(true)}
                onHelp={() => setShowHelp(true)}
                onExport={exportableViews.includes(view) && model ? handleExport : undefined}
            />
            <StorageConsentNotice />
            {showFilters && model && <FilterBar model={model} />}
            <DraftBar />
            {teamReadOnlyReason && (
                <GadgetAlert variant="warning" className="mx-3 mt-2">
                    {teamReadOnlyReason}
                </GadgetAlert>
            )}
            {data?.leave.errors.length ? (
                <GadgetAlert variant="warning" className="mx-3 mt-2">
                    Leave: {data.leave.errors.map((e) => `${e.sourceName} (${e.message})`).join(', ')}
                </GadgetAlert>
            ) : null}
            {isLoading && model && <div className="h-0.5 w-full animate-pulse bg-(--color-primary-400)" />}
            <div ref={contentRef} className="flex min-h-0 flex-1 flex-col overflow-auto">
                {renderView()}
            </div>
            <PlannerSettingsDrawer open={showSettings} onClose={() => setShowSettings(false)} />
            {showHelp && (
                <Modal isOpen onClose={() => setShowHelp(false)} title="How to use the Sprint Planner" size="lg" footer={<Button label="Close" onClick={() => setShowHelp(false)} />}>
                    <SprintPlannerInfo />
                </Modal>
            )}
            {showTeam && model && (
                <Suspense fallback={null}>
                    <TeamSettingsDialog model={model} onHide={() => setShowTeam(false)} />
                </Suspense>
            )}
        </div>
    );
}
