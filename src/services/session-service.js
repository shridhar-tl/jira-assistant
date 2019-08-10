export default class SessionService {
    static dependencies = ["CacheService"];

    constructor($cache) {
        this.$cache = $cache;
        this.CurrentUser = {};
    }

    getCurrentUserId() {
        var userId = this.userId;
        if (!userId) {
            userId = this.$cache.get("CurrentUserId");
            this.userId = userId;
        }
        if (!userId) {
            throw new Error({ needIntegration: true });
        }
        return userId;
    }

    canActivate() {
        console.log('Checking if the user is authenticated');
        if (!this.authenticated) {
            var redirectUrl = '/index.html#/pages/' + (this.needIntegration ? 'integrate' : 'p401');
            console.log('Access forbidden to module. Navigating to:-', redirectUrl);
            window.location.replace(redirectUrl);
        }
        return this.authenticated;
    }
    canActivateChild() {
        console.log('Checking if the user is authenticated - Child modules');
        return this.authenticated;
    }
}
