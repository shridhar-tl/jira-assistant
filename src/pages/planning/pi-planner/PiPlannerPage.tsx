import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import { useNavigate, useParams } from 'react-router';

import { ExportHelper } from '@/common/export-helper';
import { GadgetAlert } from '@/gadgets/shared';

import { BlockLoading, Button, Modal } from '@components';

import { formatDateRange } from '../shared/format';
import { getProjectVersions, type ProjectVersion } from '../shared/jira-api';
import { parseDateKey } from '../shared/segments';
import type { PlannerUser } from '../shared/types';
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
import { usePiStore } from './pi-store';
import type { PiDocument } from './pi-types';
import { getTerms } from './terminology';

type PiView = 'board' | 'objectives' | 'risks' | 'confidence' | 'dependencies' | 'summary';

const viewIcons: Record<PiView, string> = {
    board: 'fa fa-th',
    objectives: 'fa fa-bullseye',
    risks: 'fa fa-exclamation-triangle',
    confidence: 'fa fa-thumbs-up',
    dependencies: 'fa fa-link',
    summary: 'fa fa-file-lines',
};
const views = Object.keys(viewIcons) as PiView[];

export default function PiPlannerPage() {
    const { userId, piId, view: viewParam } = useParams();
    const navigate = useNavigate();
    const contentRef = useRef<HTMLDivElement>(null);
    const settings = usePiStore((s) => s.settings);
    const canEdit = usePiStore((s) => s.canEdit);
    const doc = usePiStore((s) => s.doc);
    const data = usePiStore((s) => s.data);
    const isLoading = usePiStore((s) => s.isLoading);
    const error = usePiStore((s) => s.error);
    const [editing, setEditing] = useState<PiDocument | 'new' | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [versions, setVersions] = useState<ProjectVersion[]>([]);

    const view: PiView = views.includes(viewParam as PiView) ? (viewParam as PiView) : 'board';
    const terms = getTerms(settings?.terminology || 'neutral');
    const viewLabels: Record<PiView, string> = {
        board: 'Program board',
        objectives: terms.objectives,
        risks: terms.risks,
        confidence: `${terms.confidence} & dates`,
        dependencies: 'Dependencies',
        summary: 'Summary',
    };

    useEffect(() => {
        loadPlans();
    }, []);

    useEffect(() => {
        openPlan(piId || null);
    }, [piId]);

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
        () => (doc && data && settings ? buildProgramModel(doc, data, settings.cadence, settings.dependencyLinkTypes) : null),
        [doc, data, settings],
    );

    const people = useMemo<PlannerUser[]>(() => {
        const map = new Map<string, PlannerUser>();
        Object.values(data?.teams || {}).forEach((t) => t.members.forEach((m) => map.set(m.id, m)));
        return [...map.values()];
    }, [data]);

    const goTo = useCallback((id: string | null, nextView: PiView = 'board') => navigate(`/${userId}/planning/pi-planner${id ? `/${id}/${nextView}` : ''}`), [navigate, userId]);

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
        if (!doc || !data || !model || !docWithReleases) {
            return <BlockLoading />;
        }
        switch (view) {
            case 'objectives':
                return <ObjectivesView doc={doc} terms={terms} canEdit={canEdit} />;
            case 'risks':
                return <RisksView doc={doc} terms={terms} canEdit={canEdit} people={people} />;
            case 'confidence':
                return <ConfidenceView doc={doc} terms={terms} canEdit={canEdit} />;
            case 'dependencies':
                return <PiDependenciesView doc={doc} data={data} model={model} terms={terms} canEdit={canEdit} />;
            case 'summary':
                return <PiSummaryView doc={doc} data={data} model={model} terms={terms} />;
            default:
                return <ProgramBoard doc={docWithReleases} data={data} model={model} terms={terms} canEdit={canEdit} />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col bg-(--bg-primary)">
            <div className="flex shrink-0 flex-col gap-2 border-b border-(--border-primary) bg-(--bg-secondary) px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                    {piId && <Button size="sm" layout="plain" leftIcon={<i className="fa fa-arrow-left" />} label={terms.plans} onClick={() => goTo(null)} />}
                    {doc && (
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold">{doc.name}</span>
                            <span className="text-xs text-(--text-secondary)">
                                {formatDateRange(parseDateKey(doc.startDate), parseDateKey(doc.endDate))} · {doc.teams.length} {terms.teams.toLowerCase()}
                            </span>
                        </div>
                    )}
                    <span className="flex-1" />
                    {doc && canEdit && <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-pencil" />} label="Edit plan" onClick={() => setEditing(doc)} />}
                    {doc && <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-download" />} ariaLabel="Export" title="Export to Excel" onClick={handleExport} />}
                    {doc && <Button size="sm" layout="outlined" leftIcon={<i className={classNames('fa fa-refresh', { 'fa-spin': isLoading })} />} ariaLabel="Refresh" title="Reload from Jira" onClick={() => reloadPlanData()} />}
                    {settings && canEdit && <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-cog" />} ariaLabel="Settings" title="Program settings" onClick={() => setShowSettings(true)} />}
                    <Button size="sm" layout="outlined" leftIcon={<i className="fa fa-question-circle" />} ariaLabel="Help" title={`How to use ${terms.plans.toLowerCase()}`} onClick={() => setShowHelp(true)} />
                </div>
                {piId && (
                    <nav className="-mb-2 flex gap-1 overflow-x-auto" aria-label="Plan views">
                        {views.map((v) => (
                            <button
                                key={v}
                                type="button"
                                className={classNames(
                                    'flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm',
                                    view === v ? 'border-(--color-primary-500) font-semibold text-(--text-primary)' : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)',
                                )}
                                onClick={() => goTo(piId, v)}
                            >
                                <i className={viewIcons[v]} />
                                {viewLabels[v]}
                            </button>
                        ))}
                    </nav>
                )}
            </div>
            <div ref={contentRef} className="flex min-h-0 flex-1 flex-col overflow-auto">
                {piId ? renderPlan() : <PiListView terms={terms} onOpen={(id) => goTo(id)} onCreate={() => setEditing('new')} />}
            </div>
            {editing && (
                <PiDefinitionDialog
                    doc={editing === 'new' ? null : editing}
                    terms={terms}
                    onHide={() => setEditing(null)}
                    onSaved={(saved) => {
                        setEditing(null);
                        if (saved.id === piId) {
                            reloadPlanData(false);
                        } else {
                            goTo(saved.id);
                        }
                    }}
                />
            )}
            {showSettings && settings && <PiSettingsDialog settings={settings} onHide={() => setShowSettings(false)} />}
            {showHelp && (
                <Modal isOpen onClose={() => setShowHelp(false)} title={`How to use ${terms.plans.toLowerCase()}`} size="lg" footer={<Button label="Close" onClick={() => setShowHelp(false)} />}>
                    <PiPlannerInfo terms={terms} />
                </Modal>
            )}
        </div>
    );
}
