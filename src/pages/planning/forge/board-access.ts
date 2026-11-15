import { asUser, route } from '@forge/api';

export interface ResolverError {
    status: number;
    statusText: string;
    text: string;
}

export function rejectWith(status: number, text: string): Promise<never> {
    const error: ResolverError = { status, statusText: text, text };
    return Promise.reject(error);
}

export function isBoardId(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export async function ensureBoardAccess(boardId: unknown): Promise<number> {
    if (!isBoardId(boardId)) {
        return rejectWith(400, 'Invalid board');
    }
    const response = await asUser().requestJira(route`/rest/agile/1.0/board/${boardId}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        return rejectWith(response.status === 404 ? 403 : response.status, 'You do not have access to this board');
    }
    return boardId;
}
