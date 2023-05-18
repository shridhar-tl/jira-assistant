import { ApiUrls } from '../constants/api-urls';

export default class ConfluenceService {
    static dependencies = ["AjaxService", "CacheService", "MessageService", "SessionService"];

    constructor($ajax, $jaCache, $message, $session) {
        this.$ajax = $ajax;
        this.$jaCache = $jaCache;
        this.$message = $message;
        this.$session = $session;
        this.runningRequests = {};
    }

    async getSpaces() {
        let result = await this.$jaCache.session.getPromise('wiki_spaces');

        if (result) {
            return result;
        }

        let startAt = 0, maxLoop = 15;
        let data = null;

        do {
            data = await this.$ajax.get(ApiUrls.wiki_spaces, startAt);
            startAt = data.limit + data.start;

            if (!result) { result = data.results; }
            else {
                result.values.push(...data.results);
            }
        } while (result.length < data.size && --maxLoop > 0);

        result = result
            .map(({ id, key, name }) => ({ id, key, name })) // type, status
            .sortBy(s => s.name);

        this.$jaCache.session.set('wiki_spaces', result, 10);

        return result;
    }

    async getCalendars(workspaces) {
        const getCalendar = async (workspaceKey) => {
            let result = await this.$jaCache.session.getPromise(`calendars_${workspaceKey}`);

            if (result) {
                return result;
            }

            result = await this.$ajax.get(ApiUrls.wiki_calendars);

            this.$jaCache.session.set(`calendars_${workspaceKey}`, result, 10);

            return { key: workspaceKey, result };
        };

        if (Array.isArray(workspaces)) {
            return Promise.all(workspaces.map(getCalendar));
        } else if (workspaces && typeof workspaces === 'string') {
            return getCalendar(workspaces);
        }
    }
}