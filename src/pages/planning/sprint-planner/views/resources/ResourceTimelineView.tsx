import { useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';
import { addDays } from 'date-fns';

import { loadLevelClassNames } from '@/gadgets/WorkloadHeatmap/constants';
import HeatmapGrid from '@/gadgets/WorkloadHeatmap/HeatmapGrid';
import HeatmapLegend from '@/gadgets/WorkloadHeatmap/HeatmapLegend';
import { getLoadLevel } from '@/gadgets/WorkloadHeatmap/load-calculator';
import HeatmapOverlay from '@/gadgets/WorkloadHeatmap/HeatmapOverlay';
import '@/gadgets/WorkloadHeatmap/WorkloadHeatmap.css';

import { inject } from '@services';

import {
    InputSwitch,
    ResourceTimeline,
    SelectButton,
    type ResourceTimelineDropEvent,
    type ResourceTimelineEventChangeEvent,
    type ResourceTimelineEventClickEvent,
    type ResourceTimelineResource,
} from '@components';

import { getDayAvailability } from '../../../shared/availability';
import ResizablePanels from '../../../shared/components/ResizablePanels';
import UserAvatar from '../../../shared/components/UserAvatar';
import { formatNumber } from '../../../shared/format';
import { buildPlannerHeatmapModel } from '../../../shared/heatmap-adapter';
import { computePersonLoads } from '../../../shared/person-load';
import { toDateKey } from '../../../shared/segments';
import { saveSegments, updateIssue, type IssueEdit } from '../../actions';
import { usePlannerStore } from '../../store';
import type { BoardModel } from '../../useBoardModel';
import IssueEditDialog from '../board/IssueEditDialog';
import SegmentDialog, { type SegmentDialogState } from '../roadmap/SegmentDialog';
import UnscheduledList, { issueDragType } from '../roadmap/UnscheduledList';
import { buildResourceModel, type ResourceEventData } from './resource-model';

interface ResourceTimelineViewProps {
    model: BoardModel;
}

const zoomItems = [
    { label: 'Compact', value: '20' },
    { label: 'Normal', value: '32' },
    { label: 'Wide', value: '48' },
];
const noStartFieldMessage = 'There is no start date field. Only the due date was changed. Choose the start date field in the planner settings.';

function getLoadLabel(percent: number | null, dayWidth: number): string {
    if (percent === null) {
        return '!';
    }
    if (dayWidth < 28) {
        return '';
    }
    return dayWidth < 44 ? String(percent) : `${percent}%`;
}

function getEventData(item: { data?: Record<string, unknown> }): ResourceEventData | null {
    return (item.data as ResourceEventData | undefined) || null;
}

export default function ResourceTimelineView({ model }: ResourceTimelineViewProps) {
    const { data } = model;
    const settings = usePlannerStore((s) => s.settings);
    const canEdit = data.permissions.editIssues;
    const [dayWidth, setDayWidth] = useState(32);
    const [showGrid, setShowGrid] = useState(false);
    const [segmentDialog, setSegmentDialog] = useState<SegmentDialogState | null>(null);
    const [editKey, setEditKey] = useState<string | null>(null);

    const resourceModel = useMemo(() => buildResourceModel(data, settings.barColorMode, settings.leadTimeDays, canEdit), [data, settings.barColorMode, settings.leadTimeDays, canEdit]);
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

    const memberMap = useMemo(() => new Map(data.members.map((m) => [m.id, m])), [data.members]);
    const resources: ResourceTimelineResource[] = useMemo(() => data.members.map((m) => ({ id: m.id, name: m.displayName })), [data.members]);

    const markers = useMemo(
        () =>
            data.sprints
                .filter((s) => s.state !== 'closed')
                .map((s) => ({ id: `sprint-${s.id}`, date: data.sprintRanges.get(s.id)?.start || new Date(), label: s.name })),
        [data.sprints, data.sprintRanges],
    );

    const isNonWorkingDay = useCallback(
        (date: Date, resourceId: string) => {
            const member = memberMap.get(resourceId);
            if (!member) {
                return false;
            }
            const day = getDayAvailability(member, date, data.team, data.leaveIndex);
            return !day.isWorkingDay || day.availableHours <= 0;
        },
        [memberMap, data.team, data.leaveIndex],
    );

    const dayCellTemplate = useCallback(
        (resource: ResourceTimelineResource, date: Date) => {
            const member = memberMap.get(resource.id);
            if (!member) {
                return null;
            }
            const availability = getDayAvailability(member, date, data.team, data.leaveIndex);
            const hours = personLoads.loads.get(resource.id)?.get(toDateKey(date))?.hours || 0;
            if (!availability.isWorkingDay && !hours) {
                return null;
            }
            const level = getLoadLevel(hours * 3600, availability.availableHours * 3600);
            const percent = availability.availableHours > 0 ? Math.round((hours * 100) / availability.availableHours) : null;
            const hasLeave = availability.leave.length > 0 || availability.holidays.length > 0;
            const title = `${formatNumber(hours)} h planned of ${formatNumber(availability.availableHours)} h available${percent !== null && hours > 0 ? ` (${percent}%)` : ''}${availability.leave.length ? ` · ${availability.leave.map((l) => l.title).join(', ')}` : ''}`;
            return (
                <div className="workload-heatmap h-full p-px" title={title}>
                    <div
                        className={classNames('heat-cell flex h-full items-center justify-center overflow-hidden rounded-sm text-[10px] leading-none tabular-nums', {
                            [loadLevelClassNames[level]]: hours > 0,
                            'font-semibold': level === 'over' || level === 'critical',
                        })}
                    >
                        {hours > 0 ? getLoadLabel(percent, dayWidth) : hasLeave ? <i className="fa fa-plane text-sky-500" /> : null}
                    </div>
                </div>
            );
        },
        [memberMap, data.team, data.leaveIndex, personLoads, dayWidth],
    );

    const resourceTemplate = useCallback(
        (resource: ResourceTimelineResource) => {
            const member = memberMap.get(resource.id);
            return (
                <div className="flex min-w-0 items-center gap-2">
                    <UserAvatar name={resource.name} avatarUrl={member?.avatarUrl} size="sm" />
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{resource.name}</span>
                        <span className="text-[10px] text-(--text-tertiary)">
                            {member?.allocation ?? 100}% · {member?.hoursPerDay ?? data.team.defaults.hoursPerDay} h/day
                        </span>
                    </div>
                </div>
            );
        },
        [memberMap, data.team.defaults.hoursPerDay],
    );

    const handleChange = useCallback(
        ({ item, start, end, resourceId }: ResourceTimelineEventChangeEvent) => {
            const info = getEventData(item);
            const issue = info ? data.issues[info.issueKey] : null;
            if (!info || !issue) {
                return;
            }
            if (info.segmentId) {
                saveSegments(
                    issue.key,
                    issue.segments.map((s) =>
                        s.id === info.segmentId
                            ? {
                                  ...s,
                                  start: toDateKey(start),
                                  end: toDateKey(end),
                                  people: resourceId !== info.personId ? s.people.map((p) => (p.id === info.personId ? { ...p, id: resourceId } : p)).filter((p, i, list) => list.findIndex((x) => x.id === p.id) === i) : s.people,
                              }
                            : s,
                    ),
                );
                return;
            }
            const edit: IssueEdit = {};
            if (resourceId !== info.personId) {
                edit.assignee = memberMap.get(resourceId) || null;
            }
            const datesChanged = toDateKey(start) !== toDateKey(new Date(item.start)) || toDateKey(end) !== toDateKey(new Date(item.end));
            if (datesChanged) {
                edit.dueDate = end;
                if (data.fieldIds.startDate) {
                    edit.startDate = start;
                } else {
                    const { $message } = inject('MessageService');
                    $message.warning(noStartFieldMessage);
                }
            }
            updateIssue(issue.key, edit);
        },
        [data.issues, data.fieldIds.startDate, memberMap],
    );

    const handleOpen = useCallback(({ item }: ResourceTimelineEventClickEvent) => {
        const info = getEventData(item);
        if (info?.segmentId) {
            setSegmentDialog({ issueKey: info.issueKey, segmentId: info.segmentId, start: new Date(item.start), end: new Date(item.end) });
        } else if (info) {
            setEditKey(info.issueKey);
        }
    }, []);

    const handleDrop = useCallback(
        ({ resourceId, date, dataTransfer }: ResourceTimelineDropEvent) => {
            const key = dataTransfer.getData(issueDragType);
            const issue = key ? data.issues[key] : null;
            if (!issue) {
                return;
            }
            const hours = (issue.remainingEstimate ?? issue.originalEstimate ?? 0) / 3600;
            const days = settings.leadTimeDays || Math.max(1, Math.ceil(hours / Math.max(1, data.team.defaults.hoursPerDay)));
            updateIssue(issue.key, {
                assignee: memberMap.get(resourceId) || issue.assignee,
                ...(data.fieldIds.startDate ? { startDate: date } : {}),
                dueDate: addDays(date, days - 1),
            });
        },
        [data.issues, data.fieldIds.startDate, data.team.defaults.hoursPerDay, memberMap, settings.leadTimeDays],
    );

    const heatmapModel = useMemo(
        () => (showGrid ? buildPlannerHeatmapModel(data.board.name, data.members, data.team, data.leaveIndex, personLoads, data.issues, resourceModel.range) : null),
        [showGrid, data, personLoads, resourceModel.range],
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-(--text-secondary)">
                    Drag a bar along the row to reschedule it or to another person to reassign it. The row under each person shows the daily load.
                </span>
                <span className="flex-1" />
                <InputSwitch label="Daily load grid" checked={showGrid} onChange={(e) => setShowGrid(e.value)} />
                <SelectButton items={zoomItems} value={String(dayWidth)} onChange={(e) => setDayWidth(Number(e.value))} />
            </div>
            <ResizablePanels
                panelId="resources-load"
                layout="vertical"
                defaultSideSize={300}
                minSideSize={140}
                minMainSize={220}
                main={
                    <ResizablePanels
                        panelId="resources-unscheduled"
                        defaultSideSize={260}
                        minSideSize={180}
                        minMainSize={320}
                        main={
                            <ResourceTimeline
                                resources={resources}
                                events={resourceModel.events}
                                startDate={resourceModel.range.start}
                                endDate={resourceModel.range.end}
                                dayWidth={dayWidth}
                                height="100%"
                                markers={markers}
                                readOnly={!canEdit}
                                isNonWorkingDay={isNonWorkingDay}
                                resourceTemplate={resourceTemplate}
                                dayCellTemplate={dayCellTemplate}
                                emptyMessage="No team members. Add them under Team."
                                onEventChange={handleChange}
                                onEventDoubleClick={handleOpen}
                                onExternalDrop={canEdit ? handleDrop : undefined}
                            />
                        }
                        side={
                            resourceModel.unscheduled.length ? (
                                <UnscheduledList
                                    issues={resourceModel.unscheduled}
                                    title="Unscheduled"
                                    draggable={canEdit}
                                    onPlan={canEdit ? (key) => setSegmentDialog({ issueKey: key, segmentId: null }) : undefined}
                                />
                            ) : undefined
                        }
                    />
                }
                side={
                    heatmapModel ? (
                        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-(--border-primary)">
                            <div className="workload-heatmap min-h-0 flex-1 overflow-auto">
                                <HeatmapOverlay>
                                    <HeatmapGrid model={heatmapModel} />
                                </HeatmapOverlay>
                            </div>
                            <div className="shrink-0 border-t border-(--border-primary) bg-(--bg-secondary) px-3 py-2">
                                <HeatmapLegend capacityPerDay={heatmapModel.capacityPerDay} />
                            </div>
                        </section>
                    ) : undefined
                }
            />
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
            {segmentDialog && <SegmentDialog state={segmentDialog} data={data} onHide={() => setSegmentDialog(null)} />}
        </div>
    );
}
