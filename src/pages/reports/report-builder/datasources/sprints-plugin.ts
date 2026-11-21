import { FlagIcon } from 'fluxo-ui/icons';

import type { AgileBoard } from '@components';

import type { DatasetField, DatasourcePlugin } from '@components/report-builder';

import { openConfigureDialog } from './configure-dialog-store';
import { loadBoardSprints, resolveBoardIds, type SourceMode } from './sprint-resolution';

export const sprintsDatasourceType = 'jira-sprints';

export const sprintStates = ['active', 'closed', 'future'] as const;
export type SprintStateName = (typeof sprintStates)[number];

export interface SprintsDatasourceConfig {
    boardMode: SourceMode;
    boards: AgileBoard[];
    boardExpression?: string;
    states: SprintStateName[];
    lastCount?: number;
}

const sprintFields: DatasetField[] = [
    { name: 'id', type: 'number' },
    { name: 'name', type: 'string' },
    { name: 'state', type: 'string' },
    { name: 'boardId', type: 'number' },
    { name: 'boardName', type: 'string' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'completeDate', type: 'date' },
    { name: 'durationDays', type: 'number' },
];

function toTime(value: unknown): number {
    if (!value) return 0;
    const t = new Date(value as string | Date).getTime();
    return Number.isNaN(t) ? 0 : t;
}

export const sprintsDatasourcePlugin: DatasourcePlugin = {
    type: sprintsDatasourceType,
    name: 'Sprints',
    description: 'Sprints of agile boards with their dates and state.',
    icon: FlagIcon,
    category: 'Jira',
    initialConfig: () => ({ boardMode: 'fixed', boards: [], states: ['active', 'closed'] }),
    configure: (request) => openConfigureDialog('sprints', request),
    describe: (config) => {
        const cfg = config as unknown as SprintsDatasourceConfig;
        const source =
            cfg.boardMode === 'expression'
                ? `Boards from ${cfg.boardExpression || '(no expression)'}`
                : (cfg.boards ?? []).map((b) => b.name).join(', ') || 'No boards';
        return `${source} · ${(cfg.states ?? []).join(', ')}${cfg.lastCount ? ` · last ${cfg.lastCount}` : ''}`;
    },
    fetch: async (config, context) => {
        const cfg = config as unknown as SprintsDatasourceConfig;
        const boardIds = await resolveBoardIds(cfg.boardMode, cfg.boards, cfg.boardExpression, context);
        if (boardIds.length === 0) return { rows: [], fields: sprintFields };
        const states = cfg.states?.length ? cfg.states : ['active', 'closed'];
        const sprints = await loadBoardSprints(boardIds, states);
        const boardNames = new Map((cfg.boards ?? []).map((b) => [b.id, b.name]));
        const byBoard = new Map<number, typeof sprints>();
        for (const s of sprints) {
            const list = byBoard.get(s.boardId);
            if (list) list.push(s);
            else byBoard.set(s.boardId, [s]);
        }
        const rows = Array.from(byBoard.values())
            .flatMap((list) => {
                const ordered = [...list].sort((a, b) => toTime(a.startDate) - toTime(b.startDate));
                return cfg.lastCount && cfg.lastCount > 0 ? ordered.slice(-cfg.lastCount) : ordered;
            })
            .map((s) => {
                const start = toTime(s.startDate);
                const end = toTime(s.completeDate || s.endDate);
                return {
                    id: s.id,
                    name: s.name,
                    state: s.state,
                    boardId: s.boardId,
                    boardName: boardNames.get(s.boardId) ?? '',
                    startDate: s.startDate ?? null,
                    endDate: s.endDate ?? null,
                    completeDate: s.completeDate ?? null,
                    durationDays: start && end ? Math.round((end - start) / 86400000) : null,
                };
            });
        return { rows, fields: sprintFields };
    },
    inferSchema: () => sprintFields,
};
