import { inject } from '@services';

import { createHttpDatasourcePlugin, type HttpDatasourceRequest } from '@components/report-builder';

const jiraPathPattern = /^\/rest\//i;
const relativeOnlyMessage =
    'Enter a Jira REST API path starting with /rest/, e.g. /rest/api/3/project. Other web addresses are not allowed.';

interface AjaxError {
    response?: string;
    status?: number;
    error?: { errorMessages?: string[] };
}

function toError(err: unknown): Error {
    const e = err as AjaxError;
    const messages = e?.error?.errorMessages;
    if (messages?.length) return new Error(messages.join(' '));
    if (e?.response) return new Error(e.response);
    return err instanceof Error ? err : new Error('The Jira request failed.');
}

function parseBody(body: string | undefined): unknown {
    if (!body?.trim()) return undefined;
    try {
        return JSON.parse(body);
    } catch {
        throw new Error('The request body must be valid JSON.');
    }
}

async function requestJira(req: HttpDatasourceRequest): Promise<unknown> {
    if (!jiraPathPattern.test(req.url)) throw new Error(relativeOnlyMessage);
    const { $ajax } = inject('AjaxService');
    try {
        return await $ajax.request(req.method, `~${req.url}`, parseBody(req.body), req.headers, true);
    } catch (err) {
        throw toError(err);
    }
}

export const jiraRestDatasourcePlugin = createHttpDatasourcePlugin({
    request: requestJira,
    name: 'Jira REST API',
    description: 'Call any Jira REST API path (e.g. /rest/api/3/project) with your current Jira sign-in.',
});
