import { EDGE_STORE_URL } from '../constants/urls';
import ChromeBrowserService from './browser-chrome-service';

export default class AppBrowserService extends ChromeBrowserService {
    getStoreUrl() { return EDGE_STORE_URL; }
}
