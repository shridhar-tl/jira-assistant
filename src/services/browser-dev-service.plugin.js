import { router } from '@forge/bridge';
import WebBrowserServiceBase from './browser-dev-service.js';

export default class WebBrowserService extends WebBrowserServiceBase {
    openTab(url, name, opts) {
        router.open(url);
    }
}