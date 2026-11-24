import { inject } from '@services';

import type { LeaveIndex } from '../shared/availability';
import { buildBoardLeaveIndex, loadLeave, resolveBoard, resolveTeamMembers } from '../shared/board-loader';
import { getEstimateUnit, type EstimateUnit } from '../shared/capacity';
import { detectDependencyLinkTypes, type DependencyLinkType } from '../shared/dependencies';
import { getIssueFields, mapPlannerIssue, plannerIssueProperties, type IssueMapContext } from '../shared/issue-mapper';
import { getBoardConfig, getBoardSprints, getFieldIds, getIssueLinkTypes, getIssuesByKey, searchIssuePages, type RawIssue } from '../shared/jira-api';
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
    detectedLinkTypes: DependencyLinkType[];
    loadedAt: number;
}

const defaultFeatureTypes = ['Epic'];
const maxFeatureKeys = 300;
const maxTrackedKeys = 200;
const issueKeyPattern = /^[A-Z][A-Z0-9_]+-\d+$/;

function quote(values: string[]): string {
    return values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',');
}

/** JQL for the child issues of features: the parent field on Cloud, the epic link on Data Center / Server. */
function getChildrenClause(featureKeys: string[], fieldIds: PlannerFieldIds): string {
    const { $session } = inject('SessionService');
    return fieldIds.epicLink && !$session.CurrentUser?.isAtlasCloud
        ? `cf[${fieldIds.epicLink.replace('customfield_', '')}] in (${featureKeys.join(',')})`
        : `parent in (${featureKeys.join(',')})`;
}

async function searchByKeys(keys: string[], fields: string[]): Promise<RawIssue[]> {
    try {
        return (await searchIssuePages(`key in (${keys.join(',')})`, fields, { properties: plannerIssueProperties, pageSize: keys.length })).issues;
    } catch {
        // A key that does not exist (or is not visible) fails the whole search, so each issue is read on its own
        const results = await Promise.allSettled(keys.map((key) => getIssuesByKey([key], fields, plannerIssueProperties)));
        return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    }
}

/**
 * Issues tracked by objectives, team dependencies and risks that are not part of the plan's data, with the stories of the
 * tracked issues that are features (an objective linked to an epic is measured by the stories of the epic).
 */
export async function loadTrackedIssues(keys: string[], data: PiData): Promise<Record<string, PlannerIssue>> {
    const valid = [...new Set(keys.map((k) => k.trim().toUpperCase()))].filter((k) => issueKeyPattern.test(k)).slice(0, maxTrackedKeys);
    if (!valid.length) {
        return {};
    }
    const fields = getIssueFields(data.mapContext);
    const result: Record<string, PlannerIssue> = {};
    (await searchByKeys(valid, fields)).forEach((raw) => {
        const issue = mapPlannerIssue(raw, data.mapContext);
        result[issue.key] = issue;
    });

    const parents = Object.values(result).filter((issue) => !issue.isSubtask && (issue.hierarchyLevel > 0 || data.featureTypes.includes(issue.issueType)));
    if (parents.length) {
        const children = await searchIssuePages(`${getChildrenClause(parents.map((p) => p.key), data.fieldIds)} AND issuetype not in subTaskIssueTypes() ORDER BY Rank ASC`, fields, {
            properties: plannerIssueProperties,
            maxPages: 3,
        });
        children.issues.forEach((raw) => {
            const issue = mapPlannerIssue(raw, data.mapContext);
            if (!data.stories[issue.key] && !result[issue.key]) {
                result[issue.key] = issue;
            }
        });
    }
    return result;
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
    const [fieldIds, allConfigs, linkTypes] = await Promise.all([
        getFieldIds(''),
        Promise.all(doc.teams.map((t) => getBoardConfig(t.boardId, force).catch(() => null))),
        getIssueLinkTypes(force).catch(() => []),
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
    const typeJql = `issuetype in (${quote(types)}) AND ${scopeClause}`;
    const featureJql = parentKeys.length ? `(${typeJql}) OR key in (${parentKeys.join(',')})` : typeJql;
    const featureResult = await searchIssuePages(`${featureJql} ORDER BY Rank ASC`, fields, { properties: plannerIssueProperties, maxPages: 3 });
    const features: Record<string, PlannerIssue> = {};
    featureResult.issues.forEach((raw) => {
        const issue = mapPlannerIssue(raw, mapContext);
        features[issue.key] = issue;
        delete stories[issue.key];
    });

    const featureKeys = Object.keys(features).slice(0, maxFeatureKeys);
    if (featureKeys.length) {
        const childClause = getChildrenClause(featureKeys, fieldIds);
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

    return { teams, features, stories, fieldIds, mapContext, featureTypes: types, detectedLinkTypes: detectDependencyLinkTypes(linkTypes), loadedAt: Date.now() };
}
