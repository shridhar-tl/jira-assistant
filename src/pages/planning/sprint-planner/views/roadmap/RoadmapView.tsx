import { useCallback, useEffect, useMemo, useState } from 'react';

import { inject } from '@services';

import {
    Confirm,
    GanttChart,
    type GanttColumn,
    type GanttDependencyClickEvent,
    type GanttDependencyCreateEvent,
    type GanttSegmentChangeEvent,
    type GanttSegmentClickEvent,
    type GanttTaskChangeEvent,
    type GanttTaskClickEvent,
    type GanttTaskCreateEvent,
    type GanttViewMode,
    type TaskBarTemplateProps,
} from '@components';


import { loadParents, type ParentInfo } from '../../../shared/board-loader';
import ResizablePanels from '../../../shared/components/ResizablePanels';
import UserAvatar from '../../../shared/components/UserAvatar';
import { getProjectVersions, type ProjectVersion } from '../../../shared/jira-api';
import { computePersonLoads } from '../../../shared/person-load';
import { toDateKey } from '../../../shared/segments';
import { changeSettings, createDependency, removeDependency, saveSegments, updateIssue } from '../../actions';
import type { RoadmapZoom } from '../../planner-settings';
import { usePlannerStore } from '../../store';
import type { BoardModel } from '../../useBoardModel';
import IssueEditDialog from '../board/IssueEditDialog';

import { buildRoadmapModel, type RoadmapTaskData } from './roadmap-model';
import SegmentDialog, { type SegmentDialogState } from './SegmentDialog';
import UnscheduledList from './UnscheduledList';

interface RoadmapViewProps {
    model: BoardModel;
}

const zoomModes: RoadmapZoom[] = ['day', 'week', 'month', 'quarter', 'year'];
const minSprintWidth = 80;
const columnDays: Record<RoadmapZoom, number> = { day: 1, week: 1, month: 30.4, quarter: 91.3, year: 365 };
const columnWidthLimits: Record<RoadmapZoom, [number, number]> = { day: [36, 36], week: [36, 36], month: [80, 320], quarter: [120, 360], year: [160, 480] };

function getColumnWidth(zoom: RoadmapZoom, sprintDays: number): number {
    const [min, max] = columnWidthLimits[zoom];
    return sprintDays ? Math.min(max, Math.max(min, Math.ceil((minSprintWidth * columnDays[zoom]) / sprintDays))) : min;
}
const noStartFieldMessage = 'There is no start date field. Only the due date was changed. Choose the start date field in the planner settings.';

function getTaskData(task: { data?: Record<string, unknown> }): RoadmapTaskData | null {
    return (task.data as RoadmapTaskData | undefined) || null;
}

function NameCell({ task }: { task: { name: string; data?: Record<string, unknown> } }) {
    const info = getTaskData(task);
    return (
        <span className="flex min-w-0 items-center gap-1 truncate" title={task.name}>
            {info?.kind === 'group' && <i className="fa fa-object-group text-(--text-tertiary)" />}
            {info?.url ? (
                <a href={info.url} target="_blank" rel="noreferrer" className="shrink-0 cursor-pointer font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                    {info.issueKey}
                </a>
            ) : null}
            <span className="truncate">{info?.issueKey ? info.summary : task.name}</span>
        </span>
    );
}

export default function RoadmapView({ model }: RoadmapViewProps) {
    const { data, dependencies } = model;
    const settings = usePlannerStore((s) => s.settings);
    const canEdit = data.permissions.editIssues;
    const [segmentDialog, setSegmentDialog] = useState<SegmentDialogState | null>(null);
    const [editKey, setEditKey] = useState<string | null>(null);
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [levelParents, setLevelParents] = useState<Record<string, ParentInfo>>({});
    const maxLevel = Math.max(1, ...settings.roadmapLevels);

    useEffect(() => {
        const projects = [...new Set(Object.values(data.issues).map((i) => i.projectKey))];
        getProjectVersions(projects).then(setVersions).catch(console.error);
    }, [data.board.id]);

    useEffect(() => {
        if (maxLevel < 2) {
            setLevelParents({});
            return;
        }
        let cancelled = false;
        const loadLevels = async () => {
            let loaded: Record<string, ParentInfo> = {};
            let keys = Object.values(data.parents)
                .map((p) => p.parentKey)
                .filter((k): k is string => !!k);
            for (let level = 2; level <= maxLevel && keys.length; level++) {
                loaded = await loadParents(keys, data.mapContext, loaded);
                keys = keys.map((k) => loaded[k]?.parentKey).filter((k): k is string => !!k && !loaded[k]);
            }
            if (!cancelled) {
                setLevelParents(loaded);
            }
        };
        loadLevels().catch(console.error);
        return () => {
            cancelled = true;
        };
    }, [maxLevel, data.parents, data.mapContext]);

    const personLoads = useMemo(
        () =>
            computePersonLoads({
                issues: Object.values(data.issues),
                members: data.members,
                team: data.team,
                leaveIndex: data.leaveIndex,
                sprintRanges: data.sprintRanges,
                estimateUnit: data.estimateUnit,
                leadTimeDays: settings.leadTimeDays,
            }),
        [data, settings.leadTimeDays],
    );

    const roadmap = useMemo(
        () =>
            buildRoadmapModel({
                data,
                dependencies,
                personLoads,
                colorMode: settings.barColorMode,
                leadTimeDays: settings.leadTimeDays,
                canEdit,
                levelParents,
                levels: settings.roadmapLevels,
                versions,
            }),
        [data, dependencies, personLoads, settings.barColorMode, settings.leadTimeDays, canEdit, levelParents, settings.roadmapLevels, versions],
    );

    const memberMap = useMemo(() => new Map(data.members.map((m) => [m.id, m])), [data.members]);

    const columns: GanttColumn[] = useMemo(
        () => [
            { field: 'name', headerText: 'Issue', width: 280, template: ({ task }) => <NameCell task={task} /> },
            { field: 'assignee', headerText: 'Assignee', width: 120 },
            { field: 'status', headerText: 'Status', width: 100 },
        ],
        [],
    );

    const isHoliday = useCallback((date: Date) => roadmap.holidayKeys.has(toDateKey(date)), [roadmap.holidayKeys]);

    const handleTaskChange = useCallback(
        (e: GanttTaskChangeEvent) => {
            const info = getTaskData(e.task);
            if (info?.kind !== 'issue') {
                return;
            }
            if (!data.fieldIds.startDate) {
                const { $message } = inject('MessageService');
                $message.warning(noStartFieldMessage);
                updateIssue(info.issueKey, { dueDate: e.end });
                return;
            }
            updateIssue(info.issueKey, { startDate: e.start, dueDate: e.end });
        },
        [data.fieldIds.startDate],
    );

    const handleSegmentChange = useCallback(
        (e: GanttSegmentChangeEvent) => {
            const key = getTaskData(e.task)?.issueKey;
            const issue = key ? data.issues[key] : null;
            if (!issue) {
                return;
            }
            saveSegments(
                issue.key,
                issue.segments.map((s) => (s.id === e.segment.id ? { ...s, start: toDateKey(e.start), end: toDateKey(e.end) } : s)),
            );
        },
        [data.issues],
    );

    const handleTaskCreate = useCallback((e: GanttTaskCreateEvent) => {
        const info = e.targetTask ? getTaskData(e.targetTask) : null;
        if (info?.kind === 'issue') {
            setSegmentDialog({ issueKey: info.issueKey, segmentId: null, start: e.start, end: e.end });
        }
    }, []);

    const handleSegmentOpen = useCallback((e: GanttSegmentClickEvent) => {
        const key = getTaskData(e.task)?.issueKey;
        if (key) {
            setSegmentDialog({ issueKey: key, segmentId: e.segment.id });
        }
    }, []);

    const handleTaskOpen = useCallback((e: GanttTaskClickEvent) => {
        const info = getTaskData(e.task);
        if (info?.kind === 'issue') {
            setEditKey(info.issueKey);
        }
    }, []);

    const handleDependencyCreate = useCallback((e: GanttDependencyCreateEvent) => {
        const from = getTaskData(e.fromTask);
        const to = getTaskData(e.toTask);
        if (from?.kind === 'issue' && to?.kind === 'issue') {
            createDependency(from.issueKey, to.issueKey);
        }
    }, []);

    const handleDependencyClick = useCallback(
        (e: GanttDependencyClickEvent) => {
            const blockerKey = getTaskData(e.fromTask)?.issueKey;
            const dependantKey = getTaskData(e.toTask)?.issueKey;
            const dep = dependencies.find((d) => d.blockerKey === blockerKey && d.dependantKey === dependantKey);
            if (!dep || !data.permissions.linkIssues) {
                return;
            }
            Confirm.yesNo(e.event.currentTarget as HTMLElement, `Remove the link "${blockerKey} blocks ${dependantKey}" from Jira?`, () =>
                removeDependency(dep.linkId, dep.typeName, dep.inwardKey, dep.outwardKey),
            );
        },
        [dependencies, data.permissions.linkIssues],
    );

    const taskBarTemplate = useCallback(
        ({ task, width, segment, isGroup }: TaskBarTemplateProps) => {
            if (isGroup) {
                return null;
            }
            const people = segment ? String(segment.data?.people || '').split(',').filter(Boolean) : [];
            return (
                <div className="flex h-full w-full items-center gap-1 overflow-hidden text-[11px]">
                    {people.slice(0, 2).map((id) => (
                        <UserAvatar key={id} name={memberMap.get(id)?.displayName || id} avatarUrl={memberMap.get(id)?.avatarUrl} size="xs" />
                    ))}
                    {people.length > 2 && <span>+{people.length - 2}</span>}
                    {width > 50 && <span className="truncate">{segment?.label || task.name}</span>}
                </div>
            );
        },
        [memberMap],
    );

    const viewMode: GanttViewMode = settings.roadmapZoom;

    return (
        <div className="flex min-h-0 flex-1 flex-col p-2">
            <ResizablePanels
                panelId="roadmap-unscheduled"
                defaultSideSize={260}
                minSideSize={180}
                minMainSize={360}
                main={
                    roadmap.tasks.length ? (
                        <GanttChart
                            tasks={roadmap.tasks}
                            columns={columns}
                            viewMode={viewMode}
                            columnWidth={getColumnWidth(settings.roadmapZoom, roadmap.sprintDays)}
                            height="100%"
                            rowHeight={34}
                            fieldsPanelWidth={360}
                            markers={roadmap.markers}
                            bands={roadmap.bands}
                            isHoliday={isHoliday}
                            showProgress={false}
                            allowTaskDrag={canEdit}
                            allowTaskResize={canEdit}
                            allowTaskCreate={canEdit}
                            allowDependencyCreate={data.permissions.linkIssues}
                            readOnly={!canEdit && !data.permissions.linkIssues}
                            taskBarTemplate={taskBarTemplate}
                            onTaskChange={handleTaskChange}
                            onSegmentChange={handleSegmentChange}
                            onTaskCreate={handleTaskCreate}
                            onTaskDoubleClick={handleTaskOpen}
                            onSegmentDoubleClick={handleSegmentOpen}
                            onDependencyCreate={handleDependencyCreate}
                            onDependencyClick={handleDependencyClick}
                            onViewModeChange={(mode) => zoomModes.includes(mode as RoadmapZoom) && changeSettings({ roadmapZoom: mode as RoadmapZoom })}
                        />
                    ) : (
                        <div className="p-6 text-center text-sm text-(--text-secondary)">No issue of this board has dates, a sprint or a planned segment yet.</div>
                    )
                }
                side={
                    roadmap.unscheduled.length ? (
                        <UnscheduledList issues={roadmap.unscheduled} title="Unscheduled" onPlan={canEdit ? (key) => setSegmentDialog({ issueKey: key, segmentId: null }) : undefined} />
                    ) : undefined
                }
            />
            {segmentDialog && <SegmentDialog state={segmentDialog} data={data} onHide={() => setSegmentDialog(null)} />}
            {editKey && (
                <IssueEditDialog
                    issueKey={editKey}
                    data={data}
                    canEdit={canEdit}
                    canSchedule={data.permissions.scheduleIssues}
                    onPlanSegments={canEdit ? () => setSegmentDialog({ issueKey: editKey, segmentId: null }) : undefined}
                    onHide={() => setEditKey(null)}
                />
            )}
        </div>
    );
}
