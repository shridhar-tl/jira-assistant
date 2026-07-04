import { router } from '@forge/bridge';

import WebBrowserServiceBase from './browser-dev-service';

export default class WebBrowserService extends WebBrowserServiceBase {
    openTab(url: string, _name?: string, _opts?: string): void {
        router.open(url);
    }
}
