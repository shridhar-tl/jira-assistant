export interface SprintCapacitySettings {
    boardIds: number[];
    showMembers: boolean;
}

export function normalizeSprintCapacitySettings(stored?: Partial<SprintCapacitySettings> | null): SprintCapacitySettings {
    return {
        boardIds: Array.isArray(stored?.boardIds) ? stored.boardIds.filter((id) => Number.isInteger(id)) : [],
        showMembers: stored?.showMembers !== false,
    };
}
