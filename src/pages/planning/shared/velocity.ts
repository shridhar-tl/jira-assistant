import { isPluginBuild } from '@/constants/build-info';

import { inject } from '@services';

import { readCache, writeCache } from './cache';
import { cacheTtl, maxVelocitySprintCount, sprintStartPropertyKey } from './constants';
import { getBoardSprints, getVelocityChart, searchIssuePages } from './jira-api';
import { getEstimateUnit } from './capacity';
import type { BoardConfig, PlannerFieldIds, PlannerSprint, SprintVelocity, VelocityChoice, VelocitySummary } from './types';

interface CachedSprintVelocity {
    committed: number;
    completed: number;
    committedIsEstimated: boolean;
}

interface SprintSnapshot {
    [issueKey: string]: { sp?: unknown } | false;
}

const secondsPerHour = 3600;

function velocityCacheKey(boardId: number, sprintId: number, field: string): string {
    return `velocity_${boardId}_${sprintId}_${field}`;
}

function toValue(value: unknown, isTime: boolean): number {
    const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    if (!Number.isFinite(num)) {
        return 0;
    }
    return isTime ? num / secondsPerHour : num;
}

function round(value: number): number {
    return Math.round(value * 10) / 10;
}

function median(values: number[]): number {
    if (!values.length) {
        return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarizeVelocity(sprints: SprintVelocity[], choice: VelocityChoice): VelocitySummary {
    const considered = sprints.slice(-Math.max(1, choice.sprintCount));
    const completed = considered.map((s) => s.completed);
    const averageCompleted = completed.length ? round(completed.reduce((a, b) => a + b, 0) / completed.length) : 0;
    const averageCommitted = considered.length ? round(considered.reduce((a, b) => a + b.committed, 0) / considered.length) : 0;
    const medianValue = round(median(completed));
    const last = considered.length ? considered[considered.length - 1].completed : 0;

    const selectedMap: Record<VelocityChoice['mode'], number> = {
        avgCompleted: averageCompleted,
        avgCommitted: averageCommitted,
        median: medianValue,
        last,
        custom: choice.custom ?? averageCompleted,
    };

    return { sprints: considered, averageCompleted, averageCommitted, median: medianValue, last, selected: selectedMap[choice.mode] };
}

async function fromVelocityChart(board: BoardConfig, sprints: PlannerSprint[], field: string): Promise<SprintVelocity[]> {
    const entries = await getVelocityChart(board.boardId);
    const isTime = getEstimateUnit(board.estimationFieldId) === 'hours';
    const entryMap = new Map(entries.map((e) => [e.sprintId, e]));

    return sprints
        .filter((s) => entryMap.has(s.id))
        .map((sprint) => {
            const entry = entryMap.get(sprint.id)!;
            const value: CachedSprintVelocity = {
                committed: round(toValue(entry.estimated, isTime)),
                completed: round(toValue(entry.completed, isTime)),
                committedIsEstimated: false,
            };
            writeCache(velocityCacheKey(board.boardId, sprint.id, field), value, cacheTtl.velocity);
            return { sprintId: sprint.id, name: sprint.name, startDate: sprint.startDate, completeDate: sprint.completeDate, ...value };
        });
}

async function readSnapshots(sprintIds: number[]): Promise<Map<number, SprintSnapshot>> {
    const { $jira } = inject('JiraService');
    const result = new Map<number, SprintSnapshot>();
    const values = await Promise.all(sprintIds.map((id) => $jira.getSprintProperty(id, sprintStartPropertyKey) as Promise<SprintSnapshot | null>));
    sprintIds.forEach((id, index) => {
        if (values[index]) {
            result.set(id, values[index]!);
        }
    });
    return result;
}

/**
 * Committed scope at sprint start comes from the sprint start snapshot written by the Forge trigger when available.
 * Otherwise it is reconstructed from the issues that were in the sprint at close and labelled as estimated.
 */
async function fromSearch(board: BoardConfig, sprints: PlannerSprint[], fieldIds: PlannerFieldIds, field: string): Promise<SprintVelocity[]> {
    if (!fieldIds.sprint || !sprints.length) {
        return [];
    }

    const isTime = getEstimateUnit(board.estimationFieldId) === 'hours';
    const sprintIds = sprints.map((s) => s.id);
    const filterJql = board.filterId ? ` AND filter = ${board.filterId}` : '';
    const { issues } = await searchIssuePages(
        `sprint in (${sprintIds.join(',')})${filterJql} AND issuetype not in subTaskIssueTypes()`,
        [fieldIds.sprint, field, 'status', 'resolutiondate'],
        { maxPages: 5 },
    );

    const snapshots = isPluginBuild && !isTime ? await readSnapshots(sprintIds) : new Map<number, SprintSnapshot>();
    const sprintMap = new Map(sprints.map((s) => [s.id, s]));
    const totals = new Map<number, { committed: number; completed: number }>(sprintIds.map((id) => [id, { committed: 0, completed: 0 }]));

    for (const issue of issues) {
        const sprintValues = (issue.fields[fieldIds.sprint] as { id: number }[] | null) || [];
        const ids = sprintValues.map((s) => s.id).filter((id) => totals.has(id));
        const value = toValue(issue.fields[field], isTime);
        const status = issue.fields.status as { statusCategory?: { key?: string } } | undefined;
        const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate as string) : null;
        const isDone = status?.statusCategory?.key === 'done' || board.doneStatusIds.includes(String((issue.fields.status as { id?: string })?.id));

        const sortedIds = ids.sort((a, b) => (sprintMap.get(a)?.completeDate?.getTime() || 0) - (sprintMap.get(b)?.completeDate?.getTime() || 0));
        const completedIn = isDone ? sortedIds[sortedIds.length - 1] : undefined;

        for (const id of sortedIds) {
            const total = totals.get(id)!;
            total.committed += value;
            const sprint = sprintMap.get(id);
            if (id === completedIn && (!resolved || !sprint?.completeDate || resolved <= new Date(sprint.completeDate.getTime() + 86400000))) {
                total.completed += value;
            }
        }
    }

    return sprints.map((sprint) => {
        const total = totals.get(sprint.id)!;
        const snapshot = snapshots.get(sprint.id);
        let committed = total.committed;
        let committedIsEstimated = true;
        if (snapshot) {
            committed = Object.values(snapshot).reduce<number>((sum, item) => sum + (item ? toValue(item.sp, false) : 0), 0);
            committedIsEstimated = false;
        }
        const value: CachedSprintVelocity = { committed: round(committed), completed: round(total.completed), committedIsEstimated };
        writeCache(velocityCacheKey(board.boardId, sprint.id, field), value, cacheTtl.velocity);
        return { sprintId: sprint.id, name: sprint.name, startDate: sprint.startDate, completeDate: sprint.completeDate, ...value };
    });
}

export async function loadVelocity(board: BoardConfig, fieldIds: PlannerFieldIds, force?: boolean): Promise<SprintVelocity[]> {
    const field = board.estimationFieldId || fieldIds.storyPoints;
    if (!field || board.type === 'kanban') {
        return [];
    }

    const closed = await getBoardSprints(board.boardId, ['closed'], force, true);
    const recent = closed
        .filter((s) => s.completeDate)
        .sort((a, b) => a.completeDate!.getTime() - b.completeDate!.getTime())
        .slice(-maxVelocitySprintCount);

    const cached = new Map<number, CachedSprintVelocity>();
    if (!force) {
        for (const sprint of recent) {
            const value = readCache<CachedSprintVelocity>(velocityCacheKey(board.boardId, sprint.id, field));
            if (value) {
                cached.set(sprint.id, value);
            }
        }
    }

    const missing = recent.filter((s) => !cached.has(s.id));
    let loaded: SprintVelocity[] = [];
    if (missing.length) {
        if (isPluginBuild) {
            loaded = await fromSearch(board, missing, fieldIds, field);
        } else {
            try {
                loaded = await fromVelocityChart(board, missing, field);
            } catch (err) {
                console.warn('Velocity chart unavailable. Calculating velocity from sprint issues.', err);
                loaded = [];
            }
            const stillMissing = missing.filter((s) => !loaded.some((l) => l.sprintId === s.id));
            if (stillMissing.length) {
                loaded.push(...(await fromSearch(board, stillMissing, fieldIds, field)));
            }
        }
    }

    const loadedMap = new Map(loaded.map((l) => [l.sprintId, l]));
    return recent
        .map((sprint) => {
            const value = loadedMap.get(sprint.id) || cached.get(sprint.id);
            if (!value) {
                return null;
            }
            return {
                sprintId: sprint.id,
                name: sprint.name,
                startDate: sprint.startDate,
                completeDate: sprint.completeDate,
                committed: value.committed,
                completed: value.completed,
                committedIsEstimated: value.committedIsEstimated,
            };
        })
        .filter((v): v is SprintVelocity => !!v);
}
