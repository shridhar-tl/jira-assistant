import { EDGE_STORE_URL } from '../constants/urls';

import ChromeBrowserService from './browser-chrome-service';

export default class EdgeBrowserService extends ChromeBrowserService {
    getStoreUrl(): string {
        return EDGE_STORE_URL;
    }
}
