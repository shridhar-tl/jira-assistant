import { getBoardSprints, resolveSelectedSprints, type AgileBoard, type AgileSprint, type SprintSelectionMap } from '@components';

import type { DatasourceFetchContext } from '@components/report-builder';

export type SourceMode = 'fixed' | 'expression';

function isSprintSelectionMap(value: unknown): value is SprintSelectionMap {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const entries = Object.values(value as Record<string, unknown>);
    return entries.length > 0 && entries.every((e) => e !== null && typeof e === 'object' && 'range' in (e as object));
}

function toIds(value: unknown): number[] {
    if (value === null || value === undefined || value === '') return [];
    if (Array.isArray(value)) return value.flatMap(toIds);
    if (typeof value === 'number') return Number.isFinite(value) ? [value] : [];
    if (typeof value === 'string')
        return value
            .split(',')
            .map((v) => Number(v.trim()))
            .filter((n) => Number.isFinite(n) && n > 0);
    if (typeof value === 'object' && 'id' in (value as object)) return toIds((value as { id: unknown }).id);
    return [];
}

export async function resolveSprintsFromValue(value: unknown): Promise<AgileSprint[] | number[]> {
    if (isSprintSelectionMap(value)) return resolveSelectedSprints(value);
    return toIds(value);
}

export async function resolveSprintIds(
    mode: SourceMode,
    selection: SprintSelectionMap | undefined,
    expression: string | undefined,
    context: DatasourceFetchContext,
): Promise<number[]> {
    if (mode === 'expression') {
        if (!expression?.trim()) throw new Error('Enter the expression returning the sprints.');
        const resolved = await resolveSprintsFromValue(await context.evaluate(expression));
        return resolved.map((s) => (typeof s === 'number' ? s : s.id));
    }
    return (await resolveSelectedSprints(selection)).map((s) => s.id);
}

export async function resolveBoardIds(
    mode: SourceMode,
    boards: AgileBoard[] | undefined,
    expression: string | undefined,
    context: DatasourceFetchContext,
): Promise<number[]> {
    if (mode === 'expression') {
        if (!expression?.trim()) throw new Error('Enter the expression returning the boards.');
        return toIds(await context.evaluate(expression));
    }
    return (boards ?? []).map((b) => b.id);
}

export async function loadBoardSprints(boardIds: number[], states: string[]): Promise<Array<AgileSprint & { boardId: number }>> {
    const byBoard = await getBoardSprints(boardIds, states.join(','));
    return Object.entries(byBoard).flatMap(([boardId, sprints]) => sprints.map((s) => ({ ...s, boardId: Number(boardId) })));
}
