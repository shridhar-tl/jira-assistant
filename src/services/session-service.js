export default class SessionService {
    static dependencies = ["CacheService"];

    constructor($cache) {
        this.$cache = $cache;
        this.CurrentUser = {};
    }

    getCurrentUserId() {
        let userId = this.userId;
        if (!userId) {
            userId = this.$cache.get("CurrentUserId");
            this.userId = userId;
        }
        if (!userId) {
            throw new Error({ needIntegration: true });
        }
        return userId;
    }
}
