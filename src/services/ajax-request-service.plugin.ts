import { requestJira } from '@forge/bridge';

import AjaxRequestServiceBase, { type HttpRequest } from './ajax-request-service.ts';

export default class AjaxRequestService extends AjaxRequestServiceBase {
    static dependencies = ['AppBrowserService'];

    httpFetch(url: string, request: HttpRequest): Promise<Response> {
        const { hostname, pathname, search } = new URL(url);

        if (hostname.endsWith('atlassian.net')) {
            const { method, headers, body } = request;
            return requestJira(pathname + search, { method, headers, body });
        } else {
            return super.httpFetch(url, request);
        }
    }
}
