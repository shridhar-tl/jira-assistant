export default class UserGroupService {
    static dependencies = ["AuthService", "SessionService", "UserService", 'SettingsService'];

    constructor($auth, $session, $user, $settings) {
        this.$auth = $auth;
        this.$session = $session;
        this.$user = $user;
        this.$settings = $settings;
    }

    getUserGroups = async () => {
        const currentUser = this.$session.CurrentUser;
        const groups = await this.$settings.getGeneralSetting(currentUser.userId, 'groups');

        return groups || [
            {
                name: 'Default group: No name set',
                timeZone: '',
                users: [currentUser.jiraUser]
            }
        ];
    };

    saveUserGroups(groups) {
        const currentUser = this.$session.CurrentUser;
        return this.$settings.saveGeneralSetting(currentUser.userId, 'groups', groups);
    }
}