import { setBoardPropertyDirect } from './jira-api';

export function writeTeamProperty<T>(boardId: number, propertyKey: string, value: T): Promise<unknown> {
    return setBoardPropertyDirect(boardId, propertyKey, value, 'The team settings');
}
