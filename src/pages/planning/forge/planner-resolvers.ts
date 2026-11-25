import { asUser, route } from '@forge/api';
import type Resolver from '@forge/resolver';

import { getJsonSize, maxPropertyBytes } from '../shared/property-limits';

import { ensureBoardAccess, rejectWith } from './board-access';
import { registerLeaveResolvers } from './leave-resolvers';
import { registerPiResolvers } from './pi-resolvers';

interface BoardPropertyPayload {
    boardId: number;
    propertyKey: string;
    value: unknown;
}

const writableBoardProperties = new Set(['jaPlannerTeam']);

async function writeBoardProperty({ boardId, propertyKey, value }: BoardPropertyPayload) {
    if (!writableBoardProperties.has(propertyKey) || !value || typeof value !== 'object' || Array.isArray(value)) {
        return rejectWith(400, 'Invalid board property request');
    }
    if (getJsonSize(value) > maxPropertyBytes) {
        return rejectWith(413, 'The team settings are too large to be saved in Jira (limit 32 KB).');
    }

    await ensureBoardAccess(boardId);

    const response = await asUser().requestJira(route`/rest/agile/1.0/board/${boardId}/properties/${propertyKey}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
    });

    if (response.status === 403 || response.status === 404) {
        return rejectWith(403, 'Only a board administrator can change the team settings of this board.');
    }
    if (!response.ok) {
        return rejectWith(response.status, await response.text());
    }

    return true;
}

export function registerPlannerResolvers(resolver: Resolver) {
    resolver.define('PlannerBoardProperty', (req) => writeBoardProperty(req.payload as unknown as BoardPropertyPayload));
    registerLeaveResolvers(resolver);
    registerPiResolvers(resolver);
}
