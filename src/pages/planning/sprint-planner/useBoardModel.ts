import { useMemo } from 'react';

import type { BoardData } from '../shared/board-loader';
import { computeSprintCapacity, type SprintCapacity } from '../shared/capacity';
import { getBlockingDependencies, getDependencies, type Dependency } from '../shared/dependencies';
import type { PlannerIssue, PlannerSprint, VelocitySummary } from '../shared/types';
import { summarizeVelocity } from '../shared/velocity';
import type { PlannerSettings } from './planner-settings';
import { usePlannerStore, type BoardFilters } from './store';

export interface FilterOption {
    value: string;
    label: string;
}

export interface BoardModel {
    data: BoardData;
    openSprints: PlannerSprint[];
    velocity: VelocitySummary | null;
    capacities: Map<number, SprintCapacity>;
    dependencies: Dependency[];
    blocking: Map<string, Dependency[]>;
    sprintOrder: Map<number, number>;
    isVisible: (issue: PlannerIssue) => boolean;
    filterOptions: {
        assignees: FilterOption[];
        parents: FilterOption[];
        labels: FilterOption[];
        components: FilterOption[];
        issueTypes: FilterOption[];
    };
}

export const unassignedFilterValue = '__unassigned__';
export const noParentFilterValue = '__none__';

function sortOptions(map: Map<string, string>): FilterOption[] {
    return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

function createFilter(filters: BoardFilters) {
    const text = filters.text.trim().toLowerCase();
    const sets = {
        assignees: new Set(filters.assignees),
        parents: new Set(filters.parents),
        labels: new Set(filters.labels),
        components: new Set(filters.components),
        issueTypes: new Set(filters.issueTypes),
        statusCategories: new Set<string>(filters.statusCategories),
    };

    return (issue: PlannerIssue) => {
        if (text && !issue.key.toLowerCase().includes(text) && !issue.summary.toLowerCase().includes(text)) {
            return false;
        }
        if (sets.assignees.size && !sets.assignees.has(issue.assignee?.id || unassignedFilterValue)) {
            return false;
        }
        if (sets.parents.size && !sets.parents.has(issue.epicKey || issue.parentKey || noParentFilterValue)) {
            return false;
        }
        if (sets.labels.size && !issue.labels.some((l) => sets.labels.has(l))) {
            return false;
        }
        if (sets.components.size && !issue.components.some((c) => sets.components.has(c))) {
            return false;
        }
        if (sets.issueTypes.size && !sets.issueTypes.has(issue.issueType)) {
            return false;
        }
        return !(sets.statusCategories.size && !sets.statusCategories.has(issue.statusCategory));
    };
}

export function buildBoardModel(data: BoardData, velocity: VelocitySummary | null, settings: PlannerSettings, filters: BoardFilters): BoardModel {
    const openSprints = data.sprints.filter((s) => s.state !== 'closed');
    const sprintOrder = new Map(data.sprints.map((s, index) => [s.id, index]));
    const capacities = new Map<number, SprintCapacity>();

    for (const sprint of openSprints) {
        const issues = (data.columns[String(sprint.id)] || []).map((k) => data.issues[k]).filter((i): i is PlannerIssue => !!i);
        capacities.set(
            sprint.id,
            computeSprintCapacity(sprint, data.sprintRanges.get(sprint.id) || null, issues, {
                team: data.team,
                members: data.members,
                leaveIndex: data.leaveIndex,
                velocity: velocity?.selected ?? null,
                estimateUnit: data.estimateUnit,
            }),
        );
    }

    const dependencies = getDependencies({ issues: data.issues, linkTypes: settings.dependencyLinkTypes, sprintOrder });

    const assignees = new Map<string, string>();
    const parents = new Map<string, string>();
    const labels = new Map<string, string>();
    const components = new Map<string, string>();
    const issueTypes = new Map<string, string>();
    for (const issue of Object.values(data.issues)) {
        assignees.set(issue.assignee?.id || unassignedFilterValue, issue.assignee?.displayName || 'Unassigned');
        const parentKey = issue.epicKey || issue.parentKey;
        parents.set(parentKey || noParentFilterValue, parentKey ? `${parentKey} ${data.parents[parentKey]?.summary || issue.parent?.summary || ''}`.trim() : 'No parent');
        issue.labels.forEach((l) => labels.set(l, l));
        issue.components.forEach((c) => components.set(c, c));
        issueTypes.set(issue.issueType, issue.issueType);
    }

    return {
        data,
        openSprints,
        velocity,
        capacities,
        dependencies,
        blocking: getBlockingDependencies(dependencies),
        sprintOrder,
        isVisible: createFilter(filters),
        filterOptions: {
            assignees: sortOptions(assignees),
            parents: sortOptions(parents),
            labels: sortOptions(labels),
            components: sortOptions(components),
            issueTypes: sortOptions(issueTypes),
        },
    };
}

export default function useBoardModel(): BoardModel | null {
    const data = usePlannerStore((s) => s.data);
    const velocityList = usePlannerStore((s) => s.velocity);
    const settings = usePlannerStore((s) => s.settings);
    const filters = usePlannerStore((s) => s.filters);

    const velocity = useMemo(
        () => (data && velocityList?.length ? summarizeVelocity(velocityList, data.team.velocity) : null),
        [data, velocityList],
    );

    return useMemo(() => (data ? buildBoardModel(data, velocity, settings, filters) : null), [data, velocity, settings, filters]);
}
