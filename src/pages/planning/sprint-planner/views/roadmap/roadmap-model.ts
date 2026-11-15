import { addDays, differenceInCalendarDays, isAfter, isBefore, subDays } from 'date-fns';

import type { GanttBand, GanttMarker, GanttSegment, GanttTask } from '@components';

import { getDayAvailability } from '../../../shared/availability';
import type { BoardData, ParentInfo } from '../../../shared/board-loader';
import { createDistributionContext, getIssueHours } from '../../../shared/capacity';
import { getContrastText, getParentColor, statusCategoryBarColors } from '../../../shared/colors';
import type { Dependency } from '../../../shared/dependencies';
import type { ProjectVersion } from '../../../shared/jira-api';
import { getIssueSpan } from '../../../shared/load-distribution';
import type { PersonLoadResult } from '../../../shared/person-load';
import { parseDateKey, toDateKey } from '../../../shared/segments';
import type { BarColorMode, PlannerIssue, PlannerSprint, TeamMember } from '../../../shared/types';

export interface RoadmapTaskData extends Record<string, unknown> {
    kind: 'issue' | 'parent' | 'group';
    issueKey: string;
    summary: string;
    assignee: string;
    status: string;
    derived: boolean;
    url: string;
}

export interface RoadmapModel {
    tasks: GanttTask[];
    unscheduled: PlannerIssue[];
    markers: GanttMarker[];
    bands: GanttBand[];
    sprintDays: number;
    holidayKeys: Set<string>;
}

export interface RoadmapInput {
    data: BoardData;
    dependencies: Dependency[];
    personLoads: PersonLoadResult;
    colorMode: BarColorMode;
    leadTimeDays: number;
    canEdit: boolean;
    levelParents: Record<string, ParentInfo>;
    levels: number[];
    versions: ProjectVersion[];
}

const noParentKey = '__none__';
const overloadedColor = '#ef4444';
const healthyColor = '#10b981';
const derivedTextColor = '#172b4d';
const derivedBarClass = 'border border-dashed border-current';
const sprintBandColor = '#6366f1';
const releaseHistoryDays = 90;

function spanOf(tasks: GanttTask[]): { start: Date; end: Date } | null {
    let start: Date | null = null;
    let end: Date | null = null;
    for (const task of tasks) {
        const s = new Date(task.start);
        const e = new Date(task.end);
        if (!start || isBefore(s, start)) start = s;
        if (!end || isAfter(e, end)) end = e;
    }
    return start && end ? { start, end } : null;
}

function getShortSprintNames(sprints: PlannerSprint[]): Map<number, string> {
    const byBoard = new Map<number | null, PlannerSprint[]>();
    sprints.forEach((s) => byBoard.set(s.boardId, [...(byBoard.get(s.boardId) || []), s]));
    const names = new Map<number, string>();
    for (const group of byBoard.values()) {
        const words = group.map((s) => s.name.trim().split(/\s+/));
        let common = Math.min(...words.map((w) => w.length - 1));
        while (common > 0 && !words.every((w) => w.slice(0, common).join(' ') === words[0].slice(0, common).join(' '))) {
            common--;
        }
        group.forEach((s, i) => names.set(s.id, words[i].slice(group.length > 1 ? common : words[i].length - 1).join(' ')));
    }
    return names;
}

function getMedianDays(bands: GanttBand[]): number {
    const days = bands.map((b) => differenceInCalendarDays(new Date(b.end), new Date(b.start)) + 1).sort((a, b) => a - b);
    return days.length ? days[Math.floor(days.length / 2)] : 0;
}

function isOverAllocated(personId: string | undefined, start: Date, end: Date, input: RoadmapInput, members: Map<string, TeamMember>): boolean {
    if (!personId) {
        return false;
    }
    const member = members.get(personId);
    const days = input.personLoads.loads.get(personId);
    if (!member || !days) {
        return false;
    }
    let current = start;
    let guard = 0;
    while (!isAfter(current, end) && guard++ < 400) {
        const load = days.get(toDateKey(current));
        if (load && load.hours > getDayAvailability(member, current, input.data.team, input.data.leaveIndex).availableHours + 0.01) {
            return true;
        }
        current = addDays(current, 1);
    }
    return false;
}

function getBarColor(issue: PlannerIssue, start: Date, end: Date, input: RoadmapInput, members: Map<string, TeamMember>): string {
    switch (input.colorMode) {
        case 'epic': {
            const parentKey = issue.epicKey || issue.parentKey;
            return parentKey ? getParentColor(parentKey, input.data.parents[parentKey]?.color) : statusCategoryBarColors[issue.statusCategory];
        }
        case 'load':
            return isOverAllocated(issue.assignee?.id, start, end, input, members) ? overloadedColor : healthyColor;
        default:
            return statusCategoryBarColors[issue.statusCategory];
    }
}

function toIssueTask(issue: PlannerIssue, input: RoadmapInput, members: Map<string, TeamMember>): GanttTask | null {
    const { data } = input;
    const range = issue.currentSprintId ? data.sprintRanges.get(issue.currentSprintId) || null : null;
    const ctx = createDistributionContext(data.members, data.team, data.leaveIndex, range, input.leadTimeDays);

    let start: Date;
    let end: Date;
    let derived = false;
    let segments: GanttSegment[] | undefined;

    if (issue.segments.length) {
        const parts = issue.segments.map((s) => ({ start: parseDateKey(s.start), end: parseDateKey(s.end) }));
        start = parts.reduce((min, p) => (isBefore(p.start, min) ? p.start : min), parts[0].start);
        end = parts.reduce((max, p) => (isAfter(p.end, max) ? p.end : max), parts[0].end);
        segments = issue.segments.map((s) => {
            const color = getBarColor(issue, parseDateKey(s.start), parseDateKey(s.end), input, members);
            return {
                id: s.id,
                start: parseDateKey(s.start),
                end: parseDateKey(s.end),
                label: s.label,
                color,
                textColor: getContrastText(color),
                draggable: input.canEdit,
                resizable: input.canEdit,
                data: { people: s.people.map((p) => p.id).join(','), label: s.label || '' },
            };
        });
    } else {
        const span = getIssueSpan(issue, getIssueHours(issue), ctx);
        if (!span) {
            return null;
        }
        start = span.start;
        end = span.end;
        derived = span.isDerived;
    }

    const color = getBarColor(issue, start, end, input, members);
    return {
        id: issue.key,
        name: `${issue.key} ${issue.summary}`,
        start,
        end,
        color: derived ? `${color}66` : color,
        textColor: derived ? derivedTextColor : getContrastText(color),
        cssClass: derived ? derivedBarClass : undefined,
        progress: issue.statusCategory === 'done' ? 100 : 0,
        draggable: input.canEdit,
        resizable: input.canEdit,
        segments,
        data: {
            kind: 'issue',
            issueKey: issue.key,
            summary: issue.summary,
            assignee: issue.assignee?.displayName || '',
            status: issue.status,
            derived,
            url: issue.url,
        } satisfies RoadmapTaskData,
    };
}

interface TreeNode {
    key: string;
    level: number;
    nodes: Map<string, TreeNode>;
    issues: GanttTask[];
}

function byStart(a: GanttTask, b: GanttTask): number {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
}

function getAncestorChain(parentKey: string, input: RoadmapInput, maxLevel: number): { key: string; level: number }[] {
    if (parentKey === noParentKey) {
        return [];
    }
    const chain = [{ key: parentKey, level: 1 }];
    let key = input.data.parents[parentKey]?.parentKey || null;
    for (let level = 2; key && level <= maxLevel; level++) {
        chain.push({ key, level });
        key = input.levelParents[key]?.parentKey || null;
    }
    return chain;
}

function toParentTask(key: string, info: ParentInfo | undefined, children: GanttTask[], kind: 'parent' | 'group'): GanttTask | null {
    const childSpan = spanOf(children);
    const explicitStart = info?.startDate || null;
    const explicitEnd = info?.dueDate || null;
    const start = childSpan ? (explicitStart && isBefore(explicitStart, childSpan.start) ? explicitStart : childSpan.start) : explicitStart;
    const end = childSpan ? (explicitEnd && isAfter(explicitEnd, childSpan.end) ? explicitEnd : childSpan.end) : explicitEnd;
    if (!start || !end) {
        return null;
    }
    const color = key === noParentKey ? '#94a3b8' : getParentColor(key, info?.color);
    return {
        id: kind === 'group' ? `group:${key}` : `parent:${key}`,
        name: key === noParentKey ? 'No parent' : `${key} ${info?.summary || ''}`.trim(),
        start,
        end: isBefore(end, start) ? start : end,
        color,
        textColor: getContrastText(color),
        type: 'group',
        draggable: false,
        resizable: false,
        children,
        data: {
            kind,
            issueKey: key === noParentKey ? '' : key,
            summary: info?.summary || '',
            assignee: '',
            status: info?.statusCategory === 'done' ? 'Done' : '',
            derived: !explicitStart || !explicitEnd,
            url: info?.url || '',
        } satisfies RoadmapTaskData,
    };
}

export function buildRoadmapModel(input: RoadmapInput): RoadmapModel {
    const { data, dependencies } = input;
    const members = new Map(data.members.map((m) => [m.id, m]));
    const unscheduled: PlannerIssue[] = [];
    const byParent = new Map<string, GanttTask[]>();
    const taskMap = new Map<string, GanttTask>();
    const issueKeys = new Set(Object.keys(data.issues));

    for (const issue of Object.values(data.issues)) {
        if (issue.isSubtask && issue.parentKey && issueKeys.has(issue.parentKey)) {
            continue;
        }
        const task = toIssueTask(issue, input, members);
        if (!task) {
            if (issue.statusCategory !== 'done') {
                unscheduled.push(issue);
            }
            continue;
        }
        taskMap.set(issue.key, task);
        const parentKey = issue.epicKey || issue.parentKey || noParentKey;
        const list = byParent.get(parentKey);
        if (list) {
            list.push(task);
        } else {
            byParent.set(parentKey, [task]);
        }
    }

    for (const dep of dependencies) {
        const dependant = taskMap.get(dep.dependantKey);
        const blocker = taskMap.get(dep.blockerKey);
        if (!dependant || !blocker || dep.blockerDone) {
            continue;
        }
        const startsEarly = isBefore(new Date(dependant.start), new Date(blocker.end));
        dependant.dependencies = [...(dependant.dependencies || []), { targetId: blocker.id, color: startsEarly ? overloadedColor : undefined }];
    }

    const levels = new Set(input.levels);
    const maxLevel = Math.max(1, ...input.levels);
    const roots = new Map<string, TreeNode>();
    const rootIssues: GanttTask[] = [];
    for (const [parentKey, children] of byParent) {
        const shown = getAncestorChain(parentKey, input, maxLevel)
            .filter((item) => levels.has(item.level))
            .reverse();
        if (parentKey === noParentKey && levels.has(1)) {
            shown.push({ key: noParentKey, level: 1 });
        }
        let container = roots;
        let node: TreeNode | null = null;
        for (const item of shown) {
            node = container.get(item.key) || { key: item.key, level: item.level, nodes: new Map(), issues: [] };
            container.set(item.key, node);
            container = node.nodes;
        }
        if (node) {
            node.issues.push(...children);
        } else {
            rootIssues.push(...children);
        }
    }

    const toNodeTask = (node: TreeNode): GanttTask | null => {
        const children = [...[...node.nodes.values()].map(toNodeTask).filter((t): t is GanttTask => !!t), ...node.issues].sort(byStart);
        return node.level === 1
            ? toParentTask(node.key, data.parents[node.key], children, 'parent')
            : toParentTask(node.key, input.levelParents[node.key], children, 'group');
    };

    const tasks = [...[...roots.values()].map(toNodeTask).filter((t): t is GanttTask => !!t), ...rootIssues].sort(byStart);

    const openSprints = data.sprints.filter((s) => s.state !== 'closed' && data.sprintRanges.has(s.id));
    const shortNames = getShortSprintNames(openSprints);
    const bands: GanttBand[] = openSprints.map((sprint) => {
        const range = data.sprintRanges.get(sprint.id) as { start: Date; end: Date };
        return { id: `sprint-${sprint.id}`, start: range.start, end: range.end, label: sprint.name, shortLabel: shortNames.get(sprint.id), color: sprintBandColor };
    });

    const releaseCutoff = toDateKey(subDays(new Date(), releaseHistoryDays));
    const markers: GanttMarker[] = input.versions
        .filter((v) => v.releaseDate && v.releaseDate >= releaseCutoff)
        .map((v) => ({ id: `version-${v.id}`, date: v.releaseDate as string, label: v.name, color: v.released ? '#10b981' : '#f59e0b' }));

    const holidayKeys = new Set<string>();
    data.leaveIndex.get('*')?.forEach((_, dayKey) => holidayKeys.add(dayKey));

    return { tasks, unscheduled: unscheduled.sort((a, b) => a.key.localeCompare(b.key)), markers, bands, sprintDays: getMedianDays(bands), holidayKeys };
}
