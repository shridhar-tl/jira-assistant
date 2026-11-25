import { invokeResolver } from '../../../common/invoke-resolver.plugin';

export function writeTeamProperty<T>(boardId: number, propertyKey: string, value: T): Promise<unknown> {
    return invokeResolver('PlannerBoardProperty', { boardId, propertyKey, value });
}
