import type { Dependency } from './dependencies';

export type UnplacedReason = 'unestimated' | 'tooLarge' | 'horizon' | 'dependency';

export interface ForecastSprint {
    id: string;
    name: string;
    capacity: number;
    committed: number;
    isVirtual: boolean;
    sprintId: number | null;
}

export interface ForecastItem {
    key: string;
    size: number | null;
}

export interface ForecastPlacement {
    key: string;
    sprintKey: string;
    size: number;
}

export interface ForecastResult {
    sprints: (ForecastSprint & { planned: number; items: string[] })[];
    placements: ForecastPlacement[];
    unplaced: { key: string; reason: UnplacedReason }[];
}

export const unplacedReasonLabels: Record<UnplacedReason, string> = {
    unestimated: 'Not estimated',
    tooLarge: 'Larger than the capacity of any sprint',
    horizon: 'Beyond the planning horizon',
    dependency: 'Its blocker is not planned within the horizon',
};

/**
 * Projects the ranked backlog into the upcoming sprints. Each item goes into the earliest sprint that still has room
 * for it (and, with dependency awareness, that is later than the sprints of its blockers).
 */
export function forecastBacklog(
    items: ForecastItem[],
    sprints: ForecastSprint[],
    blockers: Map<string, Dependency[]>,
    existingSprintOf: (key: string) => string | null,
    dependencyAware: boolean,
): ForecastResult {
    const state = sprints.map((s) => ({ ...s, planned: 0, items: [] as string[] }));
    const indexByKey = new Map(state.map((s, i) => [s.id, i]));
    const placedIndex = new Map<string, number>();
    const placements: ForecastPlacement[] = [];
    const unplaced: { key: string; reason: UnplacedReason }[] = [];
    const maxCapacity = Math.max(0, ...state.map((s) => s.capacity));

    for (const item of items) {
        if (item.size === null) {
            unplaced.push({ key: item.key, reason: 'unestimated' });
            continue;
        }
        if (item.size > maxCapacity && maxCapacity > 0) {
            unplaced.push({ key: item.key, reason: 'tooLarge' });
            continue;
        }

        let minIndex = 0;
        if (dependencyAware) {
            let blockedOutside = false;
            for (const dep of blockers.get(item.key) || []) {
                const blockerIndex = placedIndex.get(dep.blockerKey) ?? indexByKey.get(existingSprintOf(dep.blockerKey) || '');
                if (blockerIndex === undefined) {
                    blockedOutside = true;
                } else {
                    minIndex = Math.max(minIndex, blockerIndex + 1);
                }
            }
            if (blockedOutside) {
                unplaced.push({ key: item.key, reason: 'dependency' });
                continue;
            }
        }

        let target = -1;
        for (let i = minIndex; i < state.length; i++) {
            const sprint = state[i];
            if (sprint.committed + sprint.planned + item.size <= sprint.capacity) {
                target = i;
                break;
            }
        }

        if (target < 0) {
            unplaced.push({ key: item.key, reason: 'horizon' });
            continue;
        }

        state[target].planned += item.size;
        state[target].items.push(item.key);
        placedIndex.set(item.key, target);
        placements.push({ key: item.key, sprintKey: state[target].id, size: item.size });
    }

    return { sprints: state, placements, unplaced };
}

/** Next sprint name following the numbering of the last sprint, for example "Team Sprint 12" → "Team Sprint 13". */
export function getNextSprintName(lastName: string | undefined, offset: number, boardName: string): string {
    const match = lastName ? /^(.*?)(\d+)(\D*)$/.exec(lastName) : null;
    if (match) {
        return `${match[1]}${Number(match[2]) + offset}${match[3]}`;
    }
    return `${boardName} Sprint ${offset}`;
}
