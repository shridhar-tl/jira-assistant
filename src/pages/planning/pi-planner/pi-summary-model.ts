import { isAfter, startOfDay } from 'date-fns';

import { getIssueHours, getIssuePoints } from '../shared/capacity';
import { parseDateKey } from '../shared/segments';
import type { PlannerIssue } from '../shared/types';

import { isAwaitingAnswer, type DependencyEntry } from './pi-dependency-model';
import type { PiData } from './pi-loader';
import { getPiStatus, type ProgramModel } from './pi-model';
import { getElapsedPercent, getIssueProgress, getObjectiveHealth, getPlanScope, isInPlanScope, type IssueLookup, type ObjectiveHealth, type PlanScope, type ProgressMeasure } from './pi-progress';
import type { RiskEntry } from './pi-risk-model';
import type { PiDocument, PiObjective, PiSummary } from './pi-types';
import { lowerTerm, type TermSet } from './terminology';

export interface TeamProgress {
    boardId: number;
    name: string;
    unit: 'points' | 'hours';
    total: number;
    done: number;
    inProgress: number;
    todo: number;
    percent: number;
    storyCount: number;
    overloaded: string[];
    carryOver: PlannerIssue[];
    openInPast: PlannerIssue[];
    unestimated: number;
}

export interface BurnUp {
    measure: ProgressMeasure;
    labels: string[];
    scope: number[];
    planned: number[];
    done: Array<number | null>;
}

export type HighlightView = 'board' | 'objectives' | 'dependencies' | 'risks';

export interface Highlight {
    id: string;
    text: string;
    detail?: string;
    view?: HighlightView;
}

export interface PlanHighlights {
    good: Highlight[];
    attention: Highlight[];
}

export interface ObjectiveStatus {
    objective: PiObjective;
    health: ObjectiveHealth;
    percent: number;
}

function isPlanStory(issue: PlannerIssue, scope: PlanScope): boolean {
    return !issue.isSubtask && isInPlanScope(issue, scope);
}

function plural(count: number, one: string, many: string): string {
    return `${count} ${count === 1 ? one : many}`;
}

/** Done, in progress and to-do work of each team, with the signals that its plan is slipping: overloaded iterations and carried-over stories. */
export function getTeamProgress(doc: PiDocument, data: PiData, model: ProgramModel, today = startOfDay(new Date())): TeamProgress[] {
    const planSprintIds = new Set(model.rows.flatMap((row) => Object.values(row.loads).flatMap((load) => load.sprints.map((s) => s.id))));
    const pastSprintIds = new Set(
        model.rows.flatMap((row) =>
            Object.values(row.loads)
                .flatMap((load) => load.sprints)
                .filter((s) => s.state === 'closed' || (s.endDate && isAfter(today, s.endDate)))
                .map((s) => s.id),
        ),
    );
    const scope = getPlanScope(doc);
    return model.rows.map((row) => {
        const stories = Object.values(data.stories).filter((s) => isPlanStory(s, scope) && model.storyTeam.get(s.key) === row.team.boardId);
        const sizeOf = (s: PlannerIssue) => (row.unit === 'hours' ? getIssueHours(s) : getIssuePoints(s, 'points'));
        let total = 0;
        let done = 0;
        let inProgress = 0;
        for (const story of stories) {
            const size = sizeOf(story);
            total += size;
            if (story.statusCategory === 'done') {
                done += size;
            } else if (story.statusCategory === 'indeterminate') {
                inProgress += size;
            }
        }
        const overloaded = row.columns.filter((c) => row.loads[c.id]?.level === 'over').map((c) => c.name);
        return {
            boardId: row.team.boardId,
            name: row.team.name,
            unit: row.unit,
            total,
            done,
            inProgress,
            todo: Math.max(0, total - done - inProgress),
            percent: total > 0 ? Math.round((done * 100) / total) : 0,
            storyCount: stories.length,
            overloaded,
            carryOver: stories.filter((s) => s.sprintIds.filter((id) => planSprintIds.has(id)).length > 1),
            openInPast: stories.filter((s) => s.statusCategory !== 'done' && s.currentSprintId !== null && pastSprintIds.has(s.currentSprintId)),
            unestimated: stories.filter((s) => s.statusCategory !== 'done' && sizeOf(s) === 0).length,
        };
    });
}

/**
 * Burn-up of the plan by iteration: the whole scope, the work planned to be finished by the end of each iteration and the work
 * actually finished by then. Teams estimating in points and in hours are measured alike by issue count.
 */
export function getBurnUp(doc: PiDocument, data: PiData, model: ProgramModel, sprintEnds: Map<number, Date>, today = startOfDay(new Date())): BurnUp {
    const scope = getPlanScope(doc);
    const stories = Object.values(data.stories).filter((s) => isPlanStory(s, scope) && model.storyTeam.get(s.key));
    const units = new Set(model.rows.map((r) => r.unit));
    const measure: ProgressMeasure = units.size > 1 ? 'count' : getIssueProgress(stories.map((s) => s.key), data.stories, sprintEnds).measure;
    const sizeOf = (s: PlannerIssue) => (measure === 'points' ? getIssuePoints(s, 'points') : measure === 'hours' ? getIssueHours(s) : 1);
    const scopeTotal = stories.reduce((sum, s) => sum + sizeOf(s), 0);
    const iterations = doc.iterations;
    const round = (value: number) => Math.round(value * 10) / 10;

    return {
        measure,
        labels: iterations.map((it) => it.name),
        scope: iterations.map(() => round(scopeTotal)),
        planned: iterations.map((it) => {
            const end = parseDateKey(it.endDate);
            return round(
                stories.reduce((sum, s) => {
                    const sprintEnd = s.currentSprintId ? sprintEnds.get(s.currentSprintId) : undefined;
                    const finishedBy = s.statusCategory === 'done' && s.resolutionDate ? s.resolutionDate : sprintEnd;
                    return finishedBy && !isAfter(startOfDay(finishedBy), end) ? sum + sizeOf(s) : sum;
                }, 0),
            );
        }),
        done: iterations.map((it) => {
            if (isAfter(parseDateKey(it.startDate), today)) {
                return null;
            }
            const end = parseDateKey(it.endDate);
            const cutoff = isAfter(end, today) ? today : end;
            return round(stories.reduce((sum, s) => (s.statusCategory === 'done' && s.resolutionDate && !isAfter(startOfDay(s.resolutionDate), cutoff) ? sum + sizeOf(s) : sum), 0));
        }),
    };
}

export function getObjectiveStatuses(doc: PiDocument, issues: IssueLookup, sprintEnds: Map<number, Date>): ObjectiveStatus[] {
    const scope = getPlanScope(doc);
    return doc.objectives.map((objective) => {
        const progress = getIssueProgress(objective.issueKeys, issues, sprintEnds, scope);
        return { objective, health: getObjectiveHealth(progress, doc), percent: progress.percent };
    });
}

/** What goes well and what needs attention in the plan, worded for a quick read in a planning sync. */
export function getPlanHighlights(
    doc: PiDocument,
    teams: TeamProgress[],
    objectives: ObjectiveStatus[],
    dependencies: DependencyEntry[],
    risks: RiskEntry[],
    linkConflicts: number,
    terms: TermSet,
): PlanHighlights {
    const objective = lowerTerm(terms.objective);
    const objectivesTerm = lowerTerm(terms.objectives);
    const risk = lowerTerm(terms.risk);
    const risksTerm = lowerTerm(terms.risks);
    const good: Highlight[] = [];
    const attention: Highlight[] = [];
    const elapsed = getElapsedPercent(doc);

    for (const team of teams) {
        if (team.total > 0 && elapsed > 0 && team.percent >= elapsed) {
            good.push({ id: `ahead-${team.boardId}`, text: `${team.name} is on pace`, detail: `${team.percent}% done with ${elapsed}% of the time gone`, view: 'board' });
        } else if (team.total > 0 && elapsed >= 25 && team.percent < elapsed - 20) {
            attention.push({ id: `behind-${team.boardId}`, text: `${team.name} is behind`, detail: `${team.percent}% done with ${elapsed}% of the time gone`, view: 'board' });
        }
        if (team.overloaded.length) {
            attention.push({ id: `over-${team.boardId}`, text: `${team.name} is over capacity`, detail: team.overloaded.join(', '), view: 'board' });
        }
        if (team.openInPast.length) {
            attention.push({
                id: `past-${team.boardId}`,
                text: `${team.name} has ${plural(team.openInPast.length, 'open story', 'open stories')} in finished sprints`,
                detail: team.openInPast.slice(0, 5).map((s) => s.key).join(', '),
                view: 'board',
            });
        }
        if (team.carryOver.length) {
            attention.push({
                id: `carry-${team.boardId}`,
                text: `${team.name} carried over ${plural(team.carryOver.length, 'story', 'stories')}`,
                detail: team.carryOver.slice(0, 5).map((s) => s.key).join(', '),
                view: 'board',
            });
        }
        if (team.unestimated > 0) {
            attention.push({ id: `est-${team.boardId}`, text: `${team.name} has ${plural(team.unestimated, 'story', 'stories')} without an estimate`, view: 'board' });
        }
    }

    const achieved = objectives.filter((o) => o.health === 'achieved').length;
    const onTrack = objectives.filter((o) => o.health === 'onTrack').length;
    const behind = objectives.filter((o) => o.health === 'atRisk' || o.health === 'missed');
    const untracked = objectives.filter((o) => o.health === 'untracked' && o.objective.committed).length;
    if (achieved) {
        good.push({ id: 'obj-achieved', text: `${plural(achieved, objective, objectivesTerm)} achieved`, view: 'objectives' });
    }
    if (onTrack) {
        good.push({ id: 'obj-track', text: `${plural(onTrack, `${objective} is`, `${objectivesTerm} are`)} on track`, view: 'objectives' });
    }
    if (behind.length) {
        attention.push({ id: 'obj-risk', text: `${plural(behind.length, `${objective} is`, `${objectivesTerm} are`)} at risk`, detail: behind.slice(0, 3).map((o) => o.objective.text).join(' · '), view: 'objectives' });
    }
    if (untracked) {
        attention.push({ id: 'obj-untracked', text: `${plural(untracked, `committed ${objective} has`, `committed ${objectivesTerm} have`)} no linked work`, detail: `Link issues to see progress on the ${objectivesTerm} view`, view: 'objectives' });
    }

    const delivered = dependencies.filter((d) => d.health === 'delivered').length;
    const late = dependencies.filter((d) => d.health === 'late' || d.health === 'declined');
    const depRisk = dependencies.filter((d) => d.health === 'atRisk');
    const unanswered = dependencies.filter((d) => d.isProvidedHere && isAwaitingAnswer(d)).length;
    if (delivered) {
        good.push({ id: 'dep-delivered', text: `${plural(delivered, 'dependency', 'dependencies')} delivered`, view: 'dependencies' });
    }
    if (late.length) {
        attention.push({ id: 'dep-late', text: `${plural(late.length, 'dependency is', 'dependencies are')} late or declined`, detail: late.slice(0, 3).map((d) => d.dependency.title).join(' · '), view: 'dependencies' });
    }
    if (depRisk.length) {
        attention.push({ id: 'dep-risk', text: `${plural(depRisk.length, 'dependency is', 'dependencies are')} at risk`, detail: depRisk.slice(0, 3).map((d) => d.dependency.title).join(' · '), view: 'dependencies' });
    }
    if (unanswered) {
        attention.push({ id: 'dep-answer', text: `${plural(unanswered, 'dependency waits', 'dependencies wait')} for our answer`, view: 'dependencies' });
    }
    if (linkConflicts) {
        attention.push({ id: 'dep-links', text: `${plural(linkConflicts, 'blocker is', 'blockers are')} planned after the work it blocks`, view: 'dependencies' });
    }

    const overdue = risks.filter((r) => r.due === 'overdue').length;
    const toAccept = risks.filter((r) => r.isOnUs && r.awaitingAcceptance).length;
    const declined = risks.filter((r) => r.isOwn && r.risk.acceptance?.status === 'declined').length;
    const closed = risks.filter((r) => r.due === 'closed').length;
    if (closed) {
        good.push({ id: 'risk-closed', text: `${plural(closed, risk, risksTerm)} resolved or mitigated`, view: 'risks' });
    }
    if (overdue) {
        attention.push({ id: 'risk-overdue', text: `${plural(overdue, `${risk} is`, `${risksTerm} are`)} overdue`, view: 'risks' });
    }
    if (toAccept) {
        attention.push({ id: 'risk-accept', text: `${plural(toAccept, `${risk} waits`, `${risksTerm} wait`)} for our acceptance`, view: 'risks' });
    }
    if (declined) {
        attention.push({ id: 'risk-declined', text: `${plural(declined, `${risk} was`, `${risksTerm} were`)} declined by the other team`, view: 'risks' });
    }
    if (!risks.length && !dependencies.length && doc.teams.length > 1) {
        attention.push({ id: 'nothing-raised', text: `No ${risksTerm} or dependencies raised yet`, detail: 'Cross-team work usually has some. Raise them so they can be tracked.' });
    }
    return { good, attention };
}

/** The plan of the ART to summarise: the one in progress, else the next one, else the latest. */
export function getDefaultArtPlan(plans: PiSummary[]): PiSummary | null {
    const sorted = [...plans].sort((a, b) => a.startDate.localeCompare(b.startDate));
    return sorted.find((p) => getPiStatus(p) === 'current') || sorted.find((p) => getPiStatus(p) === 'future') || sorted[sorted.length - 1] || null;
}
