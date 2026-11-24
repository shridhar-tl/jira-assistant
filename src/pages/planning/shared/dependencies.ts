import type { IssueLinkRef, IssueLinkType, PlannerIssue } from './types';

export type DependencyConflict = 'none' | 'sameSprint' | 'laterSprint' | 'unscheduled' | 'outside' | 'dates';

export interface DependencyLinkType {
    name: string;
    outwardBlocks: boolean;
}

export interface Dependency {
    id: string;
    linkId: string;
    typeName: string;
    blockerKey: string;
    dependantKey: string;
    inwardKey: string;
    outwardKey: string;
    blockerDone: boolean;
    conflict: DependencyConflict;
    crossTeam: boolean;
}

export interface DependencyContext {
    issues: Record<string, PlannerIssue>;
    linkTypes: DependencyLinkType[];
    sprintOrder: Map<number, number>;
    teamOf?: (issue: PlannerIssue) => string | null;
}

export const conflictLabels: Record<DependencyConflict, string> = {
    none: 'OK',
    sameSprint: 'Blocker is planned in the same sprint',
    laterSprint: 'Blocker is planned in a later sprint',
    unscheduled: 'Blocker is not planned in any sprint',
    outside: 'Blocker is outside this plan, its sprint is not known',
    dates: 'Dependant starts before its blocker ends',
};

function getRole(link: IssueLinkRef, ownKey: string, linkType: DependencyLinkType): { blockerKey: string; dependantKey: string; inwardKey: string; outwardKey: string } {
    // On an issue, a link entry with direction 'outward' means "<this issue> <outward text> <other issue>"
    const [inwardKey, outwardKey] = link.direction === 'outward' ? [ownKey, link.issueKey] : [link.issueKey, ownKey];
    const [blockerKey, dependantKey] = linkType.outwardBlocks ? [inwardKey, outwardKey] : [outwardKey, inwardKey];
    return { blockerKey, dependantKey, inwardKey, outwardKey };
}

function getSprintIndex(issue: PlannerIssue | undefined, sprintOrder: Map<number, number>): number | null {
    if (!issue?.currentSprintId) {
        return null;
    }
    return sprintOrder.get(issue.currentSprintId) ?? null;
}

export function getDependencyConflict(blocker: PlannerIssue | undefined, blockerDone: boolean, dependant: PlannerIssue | undefined, sprintOrder: Map<number, number>): DependencyConflict {
    if (blockerDone || !dependant) {
        return 'none';
    }
    const dependantIndex = getSprintIndex(dependant, sprintOrder);
    if (dependantIndex === null) {
        return 'none';
    }
    if (!blocker) {
        return 'outside';
    }
    const blockerIndex = getSprintIndex(blocker, sprintOrder);
    if (blockerIndex === null) {
        return 'unscheduled';
    }
    if (blockerIndex === dependantIndex) {
        return 'sameSprint';
    }
    return blockerIndex > dependantIndex ? 'laterSprint' : 'none';
}

/** Dependencies between the loaded issues (and from loaded issues to issues outside the plan) from the configured link types. */
export function getDependencies(ctx: DependencyContext): Dependency[] {
    const { issues, linkTypes, sprintOrder, teamOf } = ctx;
    const typeMap = new Map(linkTypes.map((t) => [t.name.toLowerCase(), t]));
    const result = new Map<string, Dependency>();

    for (const issue of Object.values(issues)) {
        for (const link of issue.links) {
            const linkType = typeMap.get(link.typeName.toLowerCase());
            if (!linkType) {
                continue;
            }
            const roles = getRole(link, issue.key, linkType);
            const id = `${roles.blockerKey}>${roles.dependantKey}:${link.id}`;
            if (result.has(id)) {
                continue;
            }

            const blocker = issues[roles.blockerKey];
            const dependant = issues[roles.dependantKey];
            const blockerDone = blocker ? blocker.statusCategory === 'done' : roles.blockerKey === link.issueKey && link.issueStatusCategory === 'done';
            const blockerTeam = blocker && teamOf ? teamOf(blocker) : null;
            const dependantTeam = dependant && teamOf ? teamOf(dependant) : null;

            result.set(id, {
                id,
                linkId: link.id,
                typeName: link.typeName,
                ...roles,
                blockerDone,
                conflict: getDependencyConflict(blocker, blockerDone, dependant, sprintOrder),
                crossTeam: !blocker || !dependant || (!!teamOf && blockerTeam !== dependantTeam),
            });
        }
    }

    return [...result.values()];
}

export function getBlockingDependencies(dependencies: Dependency[]): Map<string, Dependency[]> {
    const map = new Map<string, Dependency[]>();
    for (const dep of dependencies) {
        if (dep.blockerDone) {
            continue;
        }
        const list = map.get(dep.dependantKey);
        if (list) {
            list.push(dep);
        } else {
            map.set(dep.dependantKey, [dep]);
        }
    }
    return map;
}

const blocksPattern = /\bblock(s|ing)?\b/i;
const dependsPattern = /\b(depends? on|is blocked by|requires|needs)\b/i;

/**
 * Link types that express a dependency, found by their names: "blocks / is blocked by" and "depends on / is a dependency of" style types.
 * The outward side blocks the other issue for "blocks", and is blocked by it for "depends on".
 */
export function detectDependencyLinkTypes(types: IssueLinkType[]): DependencyLinkType[] {
    const result: DependencyLinkType[] = [];
    for (const type of types) {
        if (dependsPattern.test(type.outward)) {
            result.push({ name: type.name, outwardBlocks: false });
        } else if (dependsPattern.test(type.inward) || (blocksPattern.test(type.outward) && !/blocked by/i.test(type.outward))) {
            result.push({ name: type.name, outwardBlocks: true });
        }
    }
    return result;
}

/** The configured link types, plus the detected ones that are not configured. A configured type keeps its configured direction. */
export function mergeDependencyLinkTypes(configured: DependencyLinkType[], detected: DependencyLinkType[]): DependencyLinkType[] {
    const names = new Set(configured.map((t) => t.name.toLowerCase()));
    return [...configured, ...detected.filter((t) => !names.has(t.name.toLowerCase()))];
}
