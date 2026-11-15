import { buildBoardLeaveIndex, getBoardFilterJql, loadLeave, resolveBoard, resolveTeamMembers } from './board-loader';
import { computeSprintCapacity, getEstimateUnit, getSprintRanges, type EstimateUnit, type SprintCapacity } from './capacity';
import { getIssueFields, mapPlannerIssue, plannerIssueProperties, type IssueMapContext } from './issue-mapper';
import { getBoardConfig, getBoardSprints, getFieldIds, searchIssuePages } from './jira-api';
import { loadTeamDefinition } from './team-store';
import type { PlannerBoard, PlannerSprint, TeamDefinition } from './types';
import { loadVelocity, summarizeVelocity } from './velocity';

export interface ActiveSprintCapacity {
    board: PlannerBoard;
    sprint: PlannerSprint | null;
    capacity: SprintCapacity | null;
    team: TeamDefinition;
    estimateUnit: EstimateUnit;
}

/**
 * Commitment against capacity of a board's active sprint. Requests: board configuration, field list, sprint list and team settings
 * (all cached), velocity (cached per closed sprint) and one search for the active sprint's issues.
 */
export async function loadActiveSprintCapacity(boardId: number): Promise<ActiveSprintCapacity> {
    const [config, fieldIds, team] = await Promise.all([getBoardConfig(boardId), getFieldIds(''), loadTeamDefinition(boardId)]);
    const board = await resolveBoard(boardId, config);
    const estimateUnit = getEstimateUnit(config.estimationFieldId);
    const sprints = await getBoardSprints(boardId, ['active'], false, true);
    const sprint = sprints.sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0))[0] || null;
    if (!sprint) {
        return { board, sprint: null, capacity: null, team, estimateUnit };
    }

    const mapContext: IssueMapContext = { fieldIds, estimationFieldId: config.estimationFieldId, rollupSubtasks: true };
    const filterJql = getBoardFilterJql(config);
    const [{ issues: rawIssues }, velocityList] = await Promise.all([
        searchIssuePages(`sprint = ${sprint.id}${filterJql ? ` AND ${filterJql}` : ''} AND issuetype not in subTaskIssueTypes()`, getIssueFields(mapContext), {
            properties: plannerIssueProperties,
            maxPages: 3,
        }),
        loadVelocity(config, fieldIds).catch(() => []),
    ]);

    const issues = rawIssues.map((raw) => mapPlannerIssue(raw, mapContext));
    const members = await resolveTeamMembers(team, issues);
    const range = getSprintRanges([sprint]).get(sprint.id) || null;
    const leave = await loadLeave(boardId, team, members, range ? [range] : []);
    const velocity = velocityList.length ? summarizeVelocity(velocityList, team.velocity).selected : null;

    const capacity = computeSprintCapacity(sprint, range, issues, {
        team,
        members,
        leaveIndex: buildBoardLeaveIndex(leave),
        velocity,
        estimateUnit,
    });

    return { board, sprint, capacity, team, estimateUnit };
}
