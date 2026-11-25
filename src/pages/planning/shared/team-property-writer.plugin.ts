import { invoke } from '@forge/bridge';

export function writeTeamProperty<T>(boardId: number, propertyKey: string, value: T): Promise<unknown> {
    return invoke('PlannerBoardProperty', { boardId, propertyKey, value });
}
