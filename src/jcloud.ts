import { asUser } from '@forge/api';
import Resolver from '@forge/resolver';

import { defineResolver, rejectWith, ResolverError } from './common/resolver-result';
import { registerPlannerResolvers } from './pages/planning/forge/planner-resolvers';
import { registerPokerResolvers } from './pages/poker/forge/server';

interface EventsPayload {
    eventsUrl: unknown;
}

const resolver = new Resolver();

const graphOrigin = 'https://graph.microsoft.com';
const graphPathPattern =
    /^\/v1\.0\/(me|users\/[A-Za-z0-9@._%-]{1,256}|users\('[A-Za-z0-9@._%-]{1,256}'\))\/+(calendar\/calendarView|calendars|calendars\/[A-Za-z0-9=_+%-]{1,512}\/calendarView|calendars\('[A-Za-z0-9=_+%/-]{1,512}'\)\/calendarView)$/;

function toGraphEventsUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > 4096) {
        return null;
    }
    try {
        const url = new URL(value);
        return url.origin === graphOrigin && !url.username && !url.password && graphPathPattern.test(url.pathname) ? url.href : null;
    } catch {
        return null;
    }
}

defineResolver(resolver, 'AuthenticateMSO', async () => {
    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!(await mso.hasCredentials())) {
        await mso.requestCredentials();
    }
    return true;
});

defineResolver(resolver, 'GetMSOEvents', async (req) => {
    const eventsUrl = toGraphEventsUrl(((req.payload || {}) as unknown as EventsPayload).eventsUrl);
    if (!eventsUrl) {
        return rejectWith(400, 'Invalid calendar request');
    }

    const mso = asUser().withProvider('mso', 'ms-apis');
    if (!(await mso.hasCredentials())) {
        await mso.requestCredentials();
    }

    const response = await mso.fetch(eventsUrl);
    if (response.ok) {
        return response.json();
    }

    throw new ResolverError(response.status, (await response.text()) || response.statusText);
});

registerPokerResolvers(resolver);
registerPlannerResolvers(resolver);

export const handler = resolver.getDefinitions();
