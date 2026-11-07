import { publish, signRealtimeToken } from '@forge/realtime';
import type Resolver from '@forge/resolver';

import { pokerResolverFunction, pokerTokenResolverFunction } from '../constants';
import type { PokerRequest } from '../protocol';
import { createForgeEntityGateway } from './entity-gateway';
import { createForgePokerAdapter } from './forge-room-store';
import { createPokerHandlers, type PokerCallContext } from './handlers';
import { createRealtimePublisher, type RealtimeApi } from './realtime-publisher';

const forgeRealtimeApi: RealtimeApi = {
    async publish(channel, payload, options) {
        const result = await publish(channel, payload, options);
        return { errors: result.errors };
    },
    async signToken(channel, claims, permissions) {
        const [first, ...rest] = permissions;
        const result = await signRealtimeToken(channel, claims, [first, ...rest]);
        return { token: result.token, expiresAt: result.expiresAt, errors: result.errors };
    },
};

export function registerPokerResolvers(resolver: Resolver): void {
    const adapter = createForgePokerAdapter({ gateway: createForgeEntityGateway() });
    const publisher = createRealtimePublisher({ api: forgeRealtimeApi });
    const handlers = createPokerHandlers({ adapter, publisher });

    resolver.define(pokerResolverFunction, (req) => handlers.handle(req.payload as PokerRequest, req.context as PokerCallContext));

    resolver.define(pokerTokenResolverFunction, async (req) => {
        const { roomId } = req.payload as { roomId: string };
        const accountId = (req.context as PokerCallContext).accountId;
        if (!accountId || !(await adapter.findSidByKey(roomId, accountId))) {
            return { ok: false, code: 'FORBIDDEN', message: 'You are not a member of this room.' };
        }
        return { ok: true, data: await publisher.subscribeToken(roomId) };
    });
}
