import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router';

import classNames from 'classnames';

import { ExportHelper } from '@/common/export-helper';
import { GadgetAlert } from '@/gadgets/shared';

import { BlockLoading, Button, EmptyState, Modal } from '@components';

import { mergeDependencyLinkTypes } from '../shared/dependencies';
import { formatDateRange } from '../shared/format';
import { getProjectVersions, type ProjectVersion } from '../shared/jira-api';
import { parseDateKey } from '../shared/segments';
import type { PlannerUser } from '../shared/types';

import ArtDialog from './components/art/ArtDialog';
import ArtSummaryView from './components/art/ArtSummaryView';
import ArtSwitcher, { unassignedArtId } from './components/art/ArtSwitcher';
import ConfidenceView from './components/ConfidenceView';
import ObjectivesView from './components/ObjectivesView';
import PiDefinitionDialog from './components/PiDefinitionDialog';
import PiDependenciesView from './components/PiDependenciesView';
import PiListView from './components/PiListView';
import PiPlannerInfo from './components/PiPlannerInfo';
import PiSettingsDialog from './components/PiSettingsDialog';
import PiSummaryView from './components/PiSummaryView';
import ProgramBoard from './components/ProgramBoard';
import RisksView from './components/RisksView';
import { loadPlans, openPlan, reloadPlanData } from './pi-actions';
import { buildProgramModel } from './pi-model';
import { getPiPageSettings, savePiPageSettings } from './pi-page-settings';
import { usePiStore } from './pi-store';
import { getDefaultArtPlan } from './pi-summary-model';
import type { PiArt, PiDocument, PiSummary } from './pi-types';
import { articleTerm, getTerms, lowerTerm } from './terminology';

type PiView = 'board' | 'objectives' | 'risks' | 'confidence' | 'dependencies' | 'summary';
type ArtView = 'plans' | 'summary';

const viewIcons: Record<PiView, string> = {
    board: 'fa fa-th',
    objectives: 'fa fa-bullseye',
    risks: 'fa fa-exclamation-triangle',
    confidence: 'fa fa-thumbs-up',
    dependencies: 'fa fa-link',
    summary: 'fa fa-file-lines',
};
const views = Object.keys(viewIcons) as PiView[];
const artViewIcons: Record<ArtView, string> = { plans: 'fa fa-list', summary: 'fa fa-chart-bar' };
const artViews = Object.keys(artViewIcons) as ArtView[];

function getArtPlans(plans: PiSummary[], arts: PiArt[], artId: string): PiSummary[] {
    if (artId === unassignedArtId) {
        return plans.filter((p) => !p.artId || !arts.some((a) => a.id === p.artId));
    }
    return plans.filter((p) => p.artId === artId);
}

function getPlanArtId(artId: string | null | undefined, arts: PiArt[]): string | null {
    if (artId === undefined) {
        return null;
    }
    return artId && arts.some((a) => a.id === artId) ? artId : unassignedArtId;
}

function TabLink({ to, active, icon, label }: { to: string; active: boolean; icon: string; label: string }) {
    return (
        <Link
            to={to}
            aria-current={active ? 'page' : undefined}
            className={classNames(
                'flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm',
                active ? 'border-(--primary-color) font-semibold text-(--text-primary)' : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)',
            )}
        >
            <i className={icon} />
            {label}
        </Link>
    );
}

export default function PiPlannerPage() {
    const { userId, piId: piParam, view: viewParam, artId: artParam, artView: artViewParam } = useParams();
    const navigate = useNavigate();
    const contentRef = useRef<HTMLDivElement>(null);
    const settings = usePiStore((s) => s.settings);
    const canEdit = usePiStore((s) => s.canEdit);
    const arts = usePiStore((s) => s.arts);
    const plans = usePiStore((s) => s.plans);
    const doc = usePiStore((s) => s.doc);
    const data = usePiStore((s) => s.data);
    const isLoading = usePiStore((s) => s.isLoading);
    const error = usePiStore((s) => s.error);
    const [listReady, setListReady] = useState(false);
    const [editing, setEditing] = useState<PiDocument | 'new' | null>(null);
    const [editingArt, setEditingArt] = useState<PiArt | 'new' | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [summaryPlanId, setSummaryPlanId] = useState<string | null>(null);

    const isArtRoute = artParam !== undefined;
    const piId = isArtRoute ? undefined : piParam;
    const view: PiView = views.includes(viewParam as PiView) ? (viewParam as PiView) : 'board';
    const artView: ArtView = artViews.includes(artViewParam as ArtView) ? (artViewParam as ArtView) : 'plans';
    const terms = getTerms(settings?.terminology || 'neutral');
    const viewLabels: Record<PiView, string> = {
        board: 'Program board',
        objectives: terms.objectives,
        risks: terms.risks,
        confidence: `${terms.confidence} & dates`,
        dependencies: 'Dependencies',
        summary: 'Summary',
    };
    const artViewLabels: Record<ArtView, string> = { plans: terms.plans, summary: 'Summary' };

    const basePath = `/${userId}/planning/pi-planner`;
    const planUrl = useCallback((id: string, nextView: PiView = 'board') => `${basePath}/${id}/${nextView}`, [basePath]);
    const artUrl = useCallback((id: string, nextView: ArtView = 'plans') => `${basePath}/art/${id}/${nextView}`, [basePath]);

    const hasUnassigned = useMemo(() => getArtPlans(plans, arts, unassignedArtId).length > 0, [plans, arts]);
    const currentArtId = isArtRoute ? artParam || null : getPlanArtId(doc && doc.id === piId ? doc.artId : undefined, arts);
    const currentArt = arts.find((a) => a.id === currentArtId) || null;
    const artPlans = useMemo(() => (isArtRoute && artParam ? getArtPlans(plans, arts, artParam) : plans), [isArtRoute, artParam, plans, arts]);
    const effectiveSummaryPlanId = isArtRoute && artView === 'summary' ? (artPlans.some((p) => p.id === summaryPlanId) ? summaryPlanId : getDefaultArtPlan(artPlans)?.id || null) : null;
    const loadedPlanId = piId || effectiveSummaryPlanId;

    useEffect(() => {
        loadPlans().then(() => setListReady(true));
    }, []);

    useEffect(() => {
        openPlan(loadedPlanId || null);
    }, [loadedPlanId]);

    useEffect(() => {
        if (!listReady || piId || isArtRoute) {
            return;
        }
        const remembered = getPiPageSettings().artId;
        const target =
            (remembered && arts.some((a) => a.id === remembered) && remembered) ||
            (remembered === unassignedArtId && hasUnassigned && unassignedArtId) ||
            arts[0]?.id ||
            (hasUnassigned ? unassignedArtId : null);
        if (target) {
            navigate(artUrl(target), { replace: true });
        }
    }, [listReady, piId, isArtRoute, arts, hasUnassigned, navigate, artUrl]);

    useEffect(() => {
        if (listReady && isArtRoute && artParam !== unassignedArtId && !arts.some((a) => a.id === artParam)) {
            navigate(basePath, { replace: true });
        }
    }, [listReady, isArtRoute, artParam, arts, navigate, basePath]);

    useEffect(() => {
        const isKnown = artParam === unassignedArtId || arts.some((a) => a.id === artParam);
        if (isArtRoute && artParam && isKnown && getPiPageSettings().artId !== artParam) {
            savePiPageSettings({ artId: artParam }).catch(console.error);
        }
    }, [isArtRoute, artParam, arts]);

    useEffect(() => {
        if (!data) {
            return;
        }
        const projects = Object.values(data.teams)
            .map((t) => t.config.projectKey || t.board.projectKey)
            .filter((k): k is string => !!k);
        getProjectVersions(projects).then(setVersions).catch(console.error);
    }, [data]);

    const docWithReleases = useMemo(() => {
        if (!doc) {
            return null;
        }
        const releases = versions
            .filter((v) => v.releaseDate && v.releaseDate >= doc.startDate && v.releaseDate <= doc.endDate)
            .map((v) => ({ id: `release-${v.id}`, date: v.releaseDate!, title: `${v.name} (${v.projectKey})`, kind: 'release' as const }));
        return { ...doc, milestones: [...doc.milestones, ...releases].sort((a, b) => a.date.localeCompare(b.date)) };
    }, [doc, versions]);

    const model = useMemo(
        () => (doc && data && settings ? buildProgramModel(doc, data, settings.cadence, mergeDependencyLinkTypes(settings.dependencyLinkTypes, data.detectedLinkTypes)) : null),
        [doc, data, settings],
    );

    const people = useMemo<PlannerUser[]>(() => {
        const map = new Map<string, PlannerUser>();
        Object.values(data?.teams || {}).forEach((t) => t.members.forEach((m) => map.set(m.id, m)));
        return [...map.values()];
    }, [data]);

    const teamNames = useMemo(() => new Map<number, string>([...arts.flatMap((a) => a.teams), ...plans.flatMap((p) => p.teams)].map((t) => [t.boardId, t.name])), [arts, plans]);

    const openPlanView = useCallback((id: string, nextView: PiView = 'board') => navigate(planUrl(id, nextView)), [navigate, planUrl]);

    const handleExport = () => {
        if (!contentRef.current) {
            return;
        }
        const helper = new ExportHelper();
        helper.element = contentRef.current;
        helper.fileName = `${doc?.name || terms.plan} - ${viewLabels[view]}`;
        helper.format = 'XLSX';
        helper.export();
    };

    const renderPlan = () => {
        if (error) {
            return <GadgetAlert action={<Button label="Retry" size="sm" layout="outlined" onClick={() => reloadPlanData()} />}>{error}</GadgetAlert>;
        }
        if (!doc || doc.id !== piId || !data || !model || !docWithReleases) {
            return <BlockLoading />;
        }
        switch (view) {
            case 'objectives':
                return <ObjectivesView doc={doc} data={data} terms={terms} canEdit={canEdit} />;
            case 'risks':
                return <RisksView doc={doc} data={data} terms={terms} canEdit={canEdit} people={people} />;
            case 'confidence':
                return <ConfidenceView doc={doc} terms={terms} canEdit={canEdit} />;
            case 'dependencies':
                return <PiDependenciesView doc={doc} data={data} model={model} terms={terms} canEdit={canEdit} />;
            case 'summary':
                return <PiSummaryView doc={doc} data={data} model={model} terms={terms} onNavigate={(next) => openPlanView(doc.id, next)} />;
            default:
                return <ProgramBoard doc={docWithReleases} data={data} model={model} terms={terms} canEdit={canEdit} />;
        }
    };

    const renderHome = () => {
        if (isArtRoute && artView === 'summary') {
            return (
                <ArtSummaryView
                    art={currentArt}
                    plans={artPlans}
                    selectedPlanId={effectiveSummaryPlanId}
                    model={model}
                    terms={terms}
                    onSelectPlan={setSummaryPlanId}
                    onOpenPlan={(id, next) => openPlanView(id, next || 'board')}
                />
            );
        }
        if (!isArtRoute && listReady && !arts.length && !plans.length) {
            return (
                <div className="p-4">
                    <EmptyState
                        title={`Start with ${articleTerm(terms.program)}`}
                        description={`${articleTerm(terms.program).replace(/^./, (c) => c.toUpperCase())} groups the ${lowerTerm(terms.teams)} that plan together. Its ${lowerTerm(terms.plans)} start with those ${lowerTerm(terms.teams)}.`}
                        action={canEdit ? { label: `New ${lowerTerm(terms.program)}`, onClick: () => setEditingArt('new') } : undefined}
                    />
                </div>
            );
        }
        return (
            <>
                {currentArtId === unassignedArtId && arts.length > 0 && (
                    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
                        <div className="rounded-md border border-(--border-primary) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-secondary)">
                            These {lowerTerm(terms.plans)} are not part of {articleTerm(terms.program)}. Edit {articleTerm(terms.plan)} to move it into one.
                        </div>
                    </div>
                )}
                <PiListView plans={artPlans} terms={terms} teamNames={teamNames} planUrl={(id) => planUrl(id)} onCreate={() => setEditing('new')} />
            </>
        );
    };

    const backArtId = currentArtId || plans.find((p) => p.id === piId)?.artId || unassignedArtId;

    return (
        <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col bg-(--bg-primary)">
            <div className="flex shrink-0 flex-col gap-2 border-b border-(--border-primary) bg-(--bg-secondary) px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                    {piId ? (
                        <>
                            <Button
                                size="sm"
                                layout="plain"
                                leftIcon={<i className="fa fa-arrow-left" />}
                                label={currentArt?.name || terms.plans}
                                title={`Back to the ${lowerTerm(terms.plans)} of ${currentArt?.name || `this ${lowerTerm(terms.program)}`}`}
                                onClick={() => navigate(artUrl(backArtId))}
                            />
                            {doc && doc.id === piId && (
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate font-semibold">{doc.name}</span>
                                    <span className="text-xs text-(--text-secondary)">
                                        {formatDateRange(parseDateKey(doc.startDate), parseDateKey(doc.endDate))} · {doc.teams.length} {lowerTerm(terms.teams)}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <ArtSwitcher
                            artId={currentArtId}
                            terms={terms}
                            showUnassigned={hasUnassigned}
                            onChange={(id) => navigate(artUrl(id, artView))}
                            onEdit={setEditingArt}
                            onCreate={() => setEditingArt('new')}
                        />
                    )}
                    <span className="flex-1" />
                    {piId && doc && canEdit && <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-pencil" />} label={`Edit ${lowerTerm(terms.plan)}`} onClick={() => setEditing(doc)} />}
                    {piId && doc && view !== 'board' && <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-download" />} ariaLabel="Export" title="Export to Excel" onClick={handleExport} />}
                    {(piId || artView === 'summary') && doc && (
                        <Button size="sm" layout="outlined" leftIcon={<i className={classNames('fa fa-refresh', { 'fa-spin': isLoading })} />} ariaLabel="Refresh" title="Reload from Jira" onClick={() => reloadPlanData()} />
                    )}
                    {settings && canEdit && <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-cog" />} ariaLabel="Settings" title="Program settings" onClick={() => setShowSettings(true)} />}
                    <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-question-circle" />} ariaLabel="Help" title={`How to use ${lowerTerm(terms.plans)}`} onClick={() => setShowHelp(true)} />
                </div>
                {piId && (
                    <nav className="-mb-2 flex gap-1 overflow-x-auto" aria-label="Plan views">
                        {views.map((v) => (
                            <TabLink key={v} to={planUrl(piId, v)} active={view === v} icon={viewIcons[v]} label={viewLabels[v]} />
                        ))}
                    </nav>
                )}
                {isArtRoute && artParam && (
                    <nav className="-mb-2 flex gap-1 overflow-x-auto" aria-label={`${terms.program} views`}>
                        {artViews.map((v) => (
                            <TabLink key={v} to={artUrl(artParam, v)} active={artView === v} icon={artViewIcons[v]} label={artViewLabels[v]} />
                        ))}
                    </nav>
                )}
            </div>
            <div ref={contentRef} className="flex min-h-0 flex-1 flex-col overflow-auto">
                {piId ? renderPlan() : listReady ? renderHome() : <BlockLoading />}
            </div>
            {editing && (
                <PiDefinitionDialog
                    doc={editing === 'new' ? null : editing}
                    artId={editing === 'new' ? (currentArtId && currentArtId !== unassignedArtId ? currentArtId : null) : editing.artId}
                    terms={terms}
                    onHide={() => setEditing(null)}
                    onSaved={(saved) => {
                        setEditing(null);
                        if (saved.id === piId) {
                            reloadPlanData(false);
                        } else {
                            openPlanView(saved.id);
                        }
                    }}
                />
            )}
            {editingArt && (
                <ArtDialog
                    art={editingArt === 'new' ? null : editingArt}
                    terms={terms}
                    onHide={() => setEditingArt(null)}
                    onSaved={(saved) => {
                        setEditingArt(null);
                        navigate(artUrl(saved.id, artView));
                    }}
                    onDeleted={() => {
                        setEditingArt(null);
                        navigate(basePath);
                    }}
                />
            )}
            {showSettings && settings && <PiSettingsDialog settings={settings} onHide={() => setShowSettings(false)} />}
            {showHelp && (
                <Modal isOpen onClose={() => setShowHelp(false)} title={`How to use ${lowerTerm(terms.plans)}`} size="lg" footer={<Button label="Close" onClick={() => setShowHelp(false)} />}>
                    <PiPlannerInfo terms={terms} />
                </Modal>
            )}
        </div>
    );
}
