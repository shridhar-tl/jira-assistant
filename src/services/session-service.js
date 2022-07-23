export default class SessionService {
    static dependencies = ["SettingsService"];

    constructor($settings) {
        this.$settings = $settings;
        this.CurrentUser = {};
    }

    async getCurrentUserId() {
        let userId = this.userId;
        if (!userId) {
            userId = await this.$settings.get("CurrentUserId");
            this.userId = userId;
        }
        if (!userId) {
            throw new Error({ needIntegration: true });
        }
        return userId;
    }
}
