import { invoke } from '@forge/bridge';

/**
 * On Forge the board property is written by the app after the resolver verifies that the user can see the board,
 * so any member of the team can edit the team settings without needing board administration.
 */
export function writeTeamProperty<T>(boardId: number, propertyKey: string, value: T): Promise<unknown> {
    return invoke('PlannerBoardProperty', { boardId, propertyKey, value });
}
