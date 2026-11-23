import { inject } from '@services';

import type { LeaveIndex } from '../shared/availability';
import { buildBoardLeaveIndex, loadLeave, resolveBoard, resolveTeamMembers } from '../shared/board-loader';
import { getEstimateUnit, type EstimateUnit } from '../shared/capacity';
import { getIssueFields, mapPlannerIssue, plannerIssueProperties, type IssueMapContext } from '../shared/issue-mapper';
import { getBoardConfig, getBoardSprints, getFieldIds, searchIssuePages, type RawIssue } from '../shared/jira-api';
import { parseDateKey } from '../shared/segments';
import { loadTeamDefinitions } from '../shared/team-store';
import type { BoardConfig, PlannerBoard, PlannerFieldIds, PlannerIssue, PlannerSprint, TeamDefinition, TeamMember } from '../shared/types';

import type { PiDocument } from './pi-types';

export interface PiTeamData {
    board: PlannerBoard;
    config: BoardConfig;
    team: TeamDefinition;
    members: TeamMember[];
    sprints: PlannerSprint[];
    leaveIndex: LeaveIndex;
    estimateUnit: EstimateUnit;
}

export interface PiData {
    teams: Record<number, PiTeamData>;
    features: Record<string, PlannerIssue>;
    stories: Record<string, PlannerIssue>;
    fieldIds: PlannerFieldIds;
    mapContext: IssueMapContext;
    featureTypes: string[];
    loadedAt: number;
}

const defaultFeatureTypes = ['Epic'];
const maxFeatureKeys = 300;

function quote(values: string[]): string {
    return values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',');
}

/** All sprints of the teams (active, future and closed), cached. Used to match sprints to a plan and to place stories. */
export async function loadTeamSprints(boardIds: number[], force?: boolean): Promise<Record<number, PlannerSprint[]>> {
    const lists = await Promise.all(boardIds.map((id) => getBoardSprints(id, ['active', 'closed', 'future'], force, true).catch(() => [] as PlannerSprint[])));
    return boardIds.reduce<Record<number, PlannerSprint[]>>((result, id, index) => {
        result[id] = lists[index];
        return result;
    }, {});
}

/**
 * Loads the data of a plan. Requests: board configuration, sprint list and team settings of each team (cached), one search for the stories
 * in the plan's sprints, one for the features in scope (and the parents of those stories) and one for the other stories of those features.
 */
export async function loadPiData(doc: PiDocument, featureTypes: string[], force?: boolean): Promise<PiData> {
    const [fieldIds, allConfigs] = await Promise.all([
        getFieldIds(''),
        Promise.all(doc.teams.map((t) => getBoardConfig(t.boardId, force).catch(() => null))),
    ]);
    const configs = allConfigs.filter((c): c is BoardConfig => !!c);
    const boardIds = configs.map((c) => c.boardId);
    const [teamDefs, sprintLists, boards] = await Promise.all([
        loadTeamDefinitions(boardIds, force),
        loadTeamSprints(boardIds, force),
        Promise.all(configs.map((config) => resolveBoard(config.boardId, config))),
    ]);

    const mapContext: IssueMapContext = { fieldIds, estimationFieldId: configs[0]?.estimationFieldId || null, rollupSubtasks: true };
    const fields = [...new Set([...getIssueFields(mapContext), ...configs.map((c) => c.estimationFieldId).filter((f): f is string => !!f)])];
    const types = featureTypes.length ? featureTypes : defaultFeatureTypes;
    const projectKeys = [...new Set(configs.map((c, i) => c.projectKey || boards[i].projectKey).filter((k): k is string => !!k))];

    const sprintIds = doc.teams.filter((t) => boardIds.includes(t.boardId)).flatMap((t) => t.sprintIds);
    const stories: Record<string, PlannerIssue> = {};
    const addStories = (issues: RawIssue[]) =>
        issues.forEach((raw) => {
            const issue = mapPlannerIssue(raw, mapContext);
            stories[issue.key] = issue;
        });

    if (sprintIds.length) {
        const sprintResult = await searchIssuePages(`sprint in (${sprintIds.join(',')}) AND issuetype not in subTaskIssueTypes() ORDER BY Rank ASC`, fields, {
            properties: plannerIssueProperties,
            maxPages: 5,
        });
        addStories(sprintResult.issues);
    }

    const parentKeys = [...new Set(Object.values(stories).map((s) => s.epicKey || s.parentKey).filter((k): k is string => !!k))].slice(0, maxFeatureKeys);
    const scopeClause = [
        projectKeys.length ? `project in (${quote(projectKeys)})` : '',
        `(statusCategory != Done OR updated >= "${doc.startDate}")`,
    ]
        .filter(Boolean)
        .join(' AND ');
    const featureJql = `issuetype in (${quote(types)}) AND ((${scopeClause})${parentKeys.length ? ` OR key in (${parentKeys.join(',')})` : ''})`;
    const featureResult = await searchIssuePages(`${featureJql} ORDER BY Rank ASC`, fields, { properties: plannerIssueProperties, maxPages: 3 });
    const features: Record<string, PlannerIssue> = {};
    featureResult.issues.forEach((raw) => {
        const issue = mapPlannerIssue(raw, mapContext);
        features[issue.key] = issue;
        delete stories[issue.key];
    });

    const featureKeys = Object.keys(features).slice(0, maxFeatureKeys);
    const { $session } = inject('SessionService');
    if (featureKeys.length) {
        const childClause =
            fieldIds.epicLink && !$session.CurrentUser?.isAtlasCloud
                ? `cf[${fieldIds.epicLink.replace('customfield_', '')}] in (${featureKeys.join(',')})`
                : `parent in (${featureKeys.join(',')})`;
        const outsideSprints = sprintIds.length ? ` AND (sprint is EMPTY OR sprint not in (${sprintIds.join(',')}))` : '';
        const childResult = await searchIssuePages(`${childClause} AND issuetype not in subTaskIssueTypes()${outsideSprints} ORDER BY Rank ASC`, fields, {
            properties: plannerIssueProperties,
            maxPages: 3,
        });
        addStories(childResult.issues);
    }

    const storyList = Object.values(stories);
    const teams: Record<number, PiTeamData> = {};
    await Promise.all(
        boardIds.map(async (boardId, index) => {
            const team = teamDefs[boardId];
            const sprints = sprintLists[boardId] || [];
            const teamSprintIds = new Set(sprints.map((s) => s.id));
            const teamStories = storyList.filter((s) => s.sprintIds.some((id) => teamSprintIds.has(id)));
            const members = await resolveTeamMembers(team, teamStories);
            const leave = await loadLeave(boardId, team, members, [{ start: parseDateKey(doc.startDate), end: parseDateKey(doc.endDate) }], { readCalendars: false });
            teams[boardId] = {
                board: boards[index],
                config: configs[index],
                team,
                members,
                sprints,
                leaveIndex: buildBoardLeaveIndex(leave),
                estimateUnit: getEstimateUnit(configs[index].estimationFieldId),
            };
        }),
    );

    return { teams, features, stories, fieldIds, mapContext, featureTypes: types, loadedAt: Date.now() };
}
