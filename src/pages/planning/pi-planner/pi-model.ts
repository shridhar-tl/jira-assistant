import { addDays, differenceInCalendarDays, isAfter, isBefore, max as maxDate, min as minDate, startOfDay } from 'date-fns';

import { computeSprintCapacity, getCapacityLevel, getIssueHours, getIssuePoints, getSprintRanges, type CapacityLevel, type SprintRange } from '../shared/capacity';
import { getDependencies, type Dependency, type DependencyConflict } from '../shared/dependencies';
import { parseDateKey, toDateKey } from '../shared/segments';
import type { PlannerIssue, PlannerSprint, StatusCategory } from '../shared/types';

import type { PiData, PiTeamData } from './pi-loader';
import type { CadenceMode, PiDocument, PiIteration, PiTeam } from './pi-types';

export const unplannedIterationId = 'unplanned';

export interface PiFeatureCell {
    featureKey: string;
    storyKeys: string[];
    count: number;
    estimate: number;
    doneEstimate: number;
    isPlacement: boolean;
}

export interface PiIterationLoad {
    capacity: number;
    load: number;
    level: CapacityLevel;
    sprints: PlannerSprint[];
}

export interface PiTeamRow {
    team: PiTeam;
    data: PiTeamData | undefined;
    unit: 'points' | 'hours';
    cells: Record<string, PiFeatureCell[]>;
    loads: Record<string, PiIterationLoad>;
    columns: { id: string; name: string; start: Date | null; end: Date | null; isIp: boolean }[];
}

export interface ProgramModel {
    rows: PiTeamRow[];
    iterations: PiIteration[];
    unplannedFeatures: string[];
    storyTeam: Map<string, number | null>;
    dependencies: Dependency[];
    featureDependencies: { fromKey: string; toKey: string; conflict: boolean; crossTeam: boolean }[];
}

export interface DependencyLinkSettings {
    name: string;
    outwardBlocks: boolean;
}

const defaultIterationDays = 14;

function getOverlapDays(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
    const start = maxDate([aStart, bStart]);
    const end = minDate([aEnd, bEnd]);
    return isAfter(start, end) ? 0 : differenceInCalendarDays(end, start) + 1;
}

/** Sprints of a team that overlap the plan dates. */
export function matchSprints(sprints: PlannerSprint[], startDate: string, endDate: string): PlannerSprint[] {
    const start = parseDateKey(startDate);
    const end = parseDateKey(endDate);
    const ranges = getSprintRanges(sprints.filter((s) => s.state !== 'closed'));
    return sprints.filter((s) => {
        const range = s.startDate && s.endDate ? { start: startOfDay(s.startDate), end: startOfDay(s.endDate) } : ranges.get(s.id);
        return !!range && getOverlapDays(range.start, range.end, start, end) > 0;
    });
}

/**
 * Common iterations aligned by date: the sprints of the team with the most sprints in the plan, or equal two-week
 * iterations when no team has dated sprints. The last iteration is the IP / planning iteration when enabled.
 */
export function createIterations(startDate: string, endDate: string, teamSprints: PlannerSprint[][], ipSprint: boolean): PiIteration[] {
    const start = parseDateKey(startDate);
    const end = parseDateKey(endDate);
    const dated = teamSprints.map((list) => list.filter((s) => s.startDate && s.endDate)).sort((a, b) => b.length - a.length)[0] || [];

    let iterations: PiIteration[];
    if (dated.length) {
        iterations = [...dated]
            .sort((a, b) => a.startDate!.getTime() - b.startDate!.getTime())
            .map((s, index) => ({
                id: `it${index + 1}`,
                name: `Iteration ${index + 1}`,
                startDate: toDateKey(maxDate([startOfDay(s.startDate!), start])),
                endDate: toDateKey(minDate([startOfDay(s.endDate!), end])),
                isIp: false,
            }));
    } else {
        iterations = [];
        let current = start;
        let index = 1;
        while (!isAfter(current, end) && index < 30) {
            const iterationEnd = minDate([addDays(current, defaultIterationDays - 1), end]);
            iterations.push({ id: `it${index}`, name: `Iteration ${index}`, startDate: toDateKey(current), endDate: toDateKey(iterationEnd), isIp: false });
            current = addDays(iterationEnd, 1);
            index++;
        }
    }

    if (ipSprint && iterations.length > 1) {
        iterations[iterations.length - 1] = { ...iterations[iterations.length - 1], isIp: true };
    }
    return iterations;
}

function getSprintRange(sprint: PlannerSprint, ranges: Map<number, SprintRange>): { start: Date; end: Date } | null {
    if (sprint.startDate && sprint.endDate) {
        return { start: startOfDay(sprint.startDate), end: startOfDay(sprint.endDate) };
    }
    return ranges.get(sprint.id) || null;
}

/** The iteration a sprint mostly overlaps. */
export function getIterationOfSprint(range: { start: Date; end: Date } | null, iterations: PiIteration[]): string | null {
    if (!range) {
        return null;
    }
    let best: string | null = null;
    let bestDays = 0;
    for (const it of iterations) {
        const days = getOverlapDays(range.start, range.end, parseDateKey(it.startDate), parseDateKey(it.endDate));
        if (days > bestDays) {
            best = it.id;
            bestDays = days;
        }
    }
    return best;
}

function getStoryTeam(story: PlannerIssue, doc: PiDocument, data: PiData, sprintTeam: Map<number, number>): number | null {
    const sprintId = story.currentSprintId ?? story.sprintIds[story.sprintIds.length - 1];
    if (sprintId && sprintTeam.has(sprintId)) {
        return sprintTeam.get(sprintId)!;
    }
    for (const team of doc.teams) {
        const def = data.teams[team.boardId]?.team;
        if (story.teamId && def?.memberSource === 'atlassianTeam' && def.atlassianTeamId === story.teamId) {
            return team.boardId;
        }
    }
    return null;
}

function getProjectTeam(story: PlannerIssue, doc: PiDocument, data: PiData): number | null {
    const byProject = doc.teams.filter((t) => {
        const teamData = data.teams[t.boardId];
        return (teamData?.config.projectKey || teamData?.board.projectKey) === story.projectKey;
    });
    return byProject.length === 1 ? byProject[0].boardId : null;
}

function addToCell(cells: Record<string, PiFeatureCell[]>, columnId: string, featureKey: string, story: PlannerIssue | null, size: number, isPlacement: boolean) {
    const list = cells[columnId] || (cells[columnId] = []);
    let cell = list.find((c) => c.featureKey === featureKey);
    if (!cell) {
        cell = { featureKey, storyKeys: [], count: 0, estimate: 0, doneEstimate: 0, isPlacement };
        list.push(cell);
    }
    if (story) {
        cell.storyKeys.push(story.key);
        cell.count++;
        if (story.statusCategory === 'done') {
            cell.doneEstimate += size;
        }
    }
    cell.estimate += size;
}

/**
 * Program board: rows are teams and columns are the plan's iterations (or each team's own sprints).
 * A feature with stories is shown wherever its stories are. A feature without stories is shown where its stored placement is.
 */
export function buildProgramModel(doc: PiDocument, data: PiData, cadence: CadenceMode, linkTypes: DependencyLinkSettings[]): ProgramModel {
    const sprintTeam = new Map<number, number>();
    const sprintColumn = new Map<number, string>();
    const sprintById = new Map<number, PlannerSprint>();

    for (const team of doc.teams) {
        const teamData = data.teams[team.boardId];
        const sprints = (teamData?.sprints || []).filter((s) => team.sprintIds.includes(s.id));
        const ranges = getSprintRanges(sprints.filter((s) => s.state !== 'closed'));
        for (const sprint of sprints) {
            sprintTeam.set(sprint.id, team.boardId);
            sprintById.set(sprint.id, sprint);
            const columnId = cadence === 'teamSprints' ? `s${sprint.id}` : getIterationOfSprint(getSprintRange(sprint, ranges), doc.iterations) || unplannedIterationId;
            sprintColumn.set(sprint.id, columnId);
        }
    }

    const storyTeam = new Map<string, number | null>();
    const rows: PiTeamRow[] = doc.teams.map((team) => {
        const teamData = data.teams[team.boardId];
        const unit: 'points' | 'hours' = teamData && (teamData.team.planningUnit === 'hours' || teamData.estimateUnit === 'hours') ? 'hours' : 'points';
        const sprints = (teamData?.sprints || []).filter((s) => team.sprintIds.includes(s.id));
        const ranges = getSprintRanges(sprints.filter((s) => s.state !== 'closed'));
        const columns =
            cadence === 'teamSprints'
                ? sprints.map((s) => {
                      const range = getSprintRange(s, ranges);
                      return { id: `s${s.id}`, name: s.name, start: range?.start || null, end: range?.end || null, isIp: false };
                  })
                : doc.iterations.map((it) => ({ id: it.id, name: it.name, start: parseDateKey(it.startDate), end: parseDateKey(it.endDate), isIp: it.isIp }));
        return { team, data: teamData, unit, cells: {}, loads: {}, columns };
    });
    const rowMap = new Map(rows.map((r) => [r.team.boardId, r]));
    const featuresWithStories = new Set<string>();

    const featureStories = Object.values(data.stories).filter((story) => {
        const featureKey = story.epicKey || story.parentKey;
        return !!featureKey && !!data.features[featureKey];
    });
    const featureTeams = new Map<string, Set<number>>();
    for (const story of featureStories) {
        const teamId = getStoryTeam(story, doc, data, sprintTeam);
        storyTeam.set(story.key, teamId);
        if (teamId) {
            const featureKey = (story.epicKey || story.parentKey)!;
            const teams = featureTeams.get(featureKey) || new Set<number>();
            teams.add(teamId);
            featureTeams.set(featureKey, teams);
        }
    }
    for (const story of featureStories) {
        if (storyTeam.get(story.key)) {
            continue;
        }
        const teams = featureTeams.get((story.epicKey || story.parentKey)!);
        storyTeam.set(story.key, teams?.size === 1 ? [...teams][0] : getProjectTeam(story, doc, data));
    }

    for (const story of featureStories) {
        const featureKey = (story.epicKey || story.parentKey)!;
        const teamId = storyTeam.get(story.key);
        const row = teamId ? rowMap.get(teamId) : undefined;
        if (!row) {
            continue;
        }
        featuresWithStories.add(featureKey);
        const sprintId = story.sprintIds.filter((id) => sprintColumn.has(id)).pop();
        const columnId = sprintId ? sprintColumn.get(sprintId)! : unplannedIterationId;
        const size = row.unit === 'hours' ? getIssueHours(story) : getIssuePoints(story, 'points');
        addToCell(row.cells, columnId, featureKey, story, size, false);
    }

    for (const feature of Object.values(data.features)) {
        const placement = feature.featurePlacement;
        if (featuresWithStories.has(feature.key) || !placement || placement.piId !== doc.id) {
            continue;
        }
        const row = rowMap.get(placement.boardId);
        if (!row) {
            continue;
        }
        const columnId = placement.sprintId && sprintColumn.has(placement.sprintId) ? sprintColumn.get(placement.sprintId)! : unplannedIterationId;
        addToCell(row.cells, columnId, feature.key, null, placement.estimate || 0, true);
    }

    for (const row of rows) {
        if (!row.data) {
            continue;
        }
        const sprints = row.data.sprints.filter((s) => row.team.sprintIds.includes(s.id));
        const ranges = getSprintRanges(sprints.filter((s) => s.state !== 'closed'));
        for (const column of row.columns) {
            const columnSprints = sprints.filter((s) => sprintColumn.get(s.id) === column.id);
            let capacity = 0;
            for (const sprint of columnSprints) {
                const range = getSprintRange(sprint, ranges);
                const sprintCapacity = computeSprintCapacity(sprint, range ? { ...range, isDerived: false } : null, [], {
                    team: row.data.team,
                    members: row.data.members,
                    leaveIndex: row.data.leaveIndex,
                    velocity: null,
                    estimateUnit: row.data.estimateUnit,
                });
                capacity += row.unit === 'hours' ? sprintCapacity.capacityHours : sprintCapacity.capacityPoints;
            }
            const load = (row.cells[column.id] || []).reduce((sum, c) => sum + c.estimate, 0);
            row.loads[column.id] = { capacity, load, level: getCapacityLevel(load, capacity), sprints: columnSprints };
        }
    }

    const placedFeatures = new Set(rows.flatMap((r) => Object.entries(r.cells).filter(([id]) => id !== unplannedIterationId).flatMap(([, cells]) => cells.map((c) => c.featureKey))));
    const unplannedFeatures = Object.values(data.features)
        .filter((f) => f.statusCategory !== 'done' && !placedFeatures.has(f.key))
        .map((f) => f.key);

    const allIssues = { ...data.stories, ...data.features };
    const sprintOrder = new Map<number, number>();
    [...sprintById.values()].forEach((s) => {
        const columnId = sprintColumn.get(s.id) || '';
        const index = doc.iterations.findIndex((it) => it.id === columnId);
        sprintOrder.set(s.id, index >= 0 ? index : (s.startDate?.getTime() || 0) / 86400000);
    });
    const dependencies = getDependencies({
        issues: allIssues,
        linkTypes,
        sprintOrder,
        teamOf: (issue) => {
            const team = storyTeam.get(issue.key);
            return team ? String(team) : null;
        },
    });

    const featureOf = (key: string) => {
        const issue = allIssues[key];
        return issue ? (data.features[key] ? key : issue.epicKey || issue.parentKey) : null;
    };
    const featureDeps = new Map<string, { fromKey: string; toKey: string; conflict: boolean; crossTeam: boolean }>();
    for (const dep of dependencies) {
        const fromKey = featureOf(dep.blockerKey);
        const toKey = featureOf(dep.dependantKey);
        if (!fromKey || !toKey || fromKey === toKey || dep.blockerDone) {
            continue;
        }
        const id = `${fromKey}>${toKey}`;
        const existing = featureDeps.get(id);
        featureDeps.set(id, {
            fromKey,
            toKey,
            conflict: (existing?.conflict || false) || dep.conflict !== 'none',
            crossTeam: (existing?.crossTeam || false) || dep.crossTeam,
        });
    }

    return { rows, iterations: doc.iterations, unplannedFeatures, storyTeam, dependencies, featureDependencies: [...featureDeps.values()] };
}

export function getPiStatus(doc: Pick<PiDocument, 'startDate' | 'endDate'>): 'past' | 'current' | 'future' {
    const today = startOfDay(new Date());
    if (isBefore(parseDateKey(doc.endDate), today)) {
        return 'past';
    }
    return isAfter(parseDateKey(doc.startDate), today) ? 'future' : 'current';
}

export interface ExternalPlacement {
    statusCategory: StatusCategory;
    sprint: { start: Date | null; end: Date | null } | null;
}

export function getPlanSprintRanges(doc: PiDocument, data: PiData): Map<number, { start: Date; end: Date }> {
    const result = new Map<number, { start: Date; end: Date }>();
    for (const team of doc.teams) {
        const sprints = data.teams[team.boardId]?.sprints || [];
        const ranges = getSprintRanges(sprints.filter((sprint) => sprint.state !== 'closed'));
        sprints.forEach((sprint) => {
            const range = getSprintRange(sprint, ranges);
            if (range) {
                result.set(sprint.id, range);
            }
        });
    }
    return result;
}

function compareByDates(blocker: { start: Date; end: Date } | null, dependant: { start: Date; end: Date } | null): DependencyConflict {
    if (!dependant) {
        return 'none';
    }
    if (!blocker) {
        return 'unscheduled';
    }
    if (isAfter(blocker.start, dependant.start)) {
        return 'laterSprint';
    }
    return isAfter(blocker.end, dependant.start) ? 'sameSprint' : 'none';
}

export function applyExternalPlacements(dependencies: Dependency[], data: PiData, ranges: Map<number, { start: Date; end: Date }>, external: Record<string, ExternalPlacement>): Dependency[] {
    const rangeOf = (key: string) => {
        const issue = data.stories[key] || data.features[key];
        if (issue) {
            return issue.currentSprintId ? ranges.get(issue.currentSprintId) || null : null;
        }
        const sprint = external[key]?.sprint;
        return sprint?.start && sprint.end ? { start: startOfDay(sprint.start), end: startOfDay(sprint.end) } : null;
    };
    return dependencies.map((dep) => {
        const outside = [dep.blockerKey, dep.dependantKey].find((key) => !data.stories[key] && !data.features[key]);
        if (!outside || !external[outside]) {
            return dep;
        }
        const blockerDone = dep.blockerKey === outside ? external[outside].statusCategory === 'done' : dep.blockerDone;
        return { ...dep, blockerDone, conflict: blockerDone ? 'none' : compareByDates(rangeOf(dep.blockerKey), rangeOf(dep.dependantKey)) };
    });
}
