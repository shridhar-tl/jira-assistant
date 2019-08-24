export default class UserGroupService {
    static dependencies = ["AuthService", "SessionService", "UserService"];

    constructor($auth, $session, $user) {
        this.$auth = $auth;
        this.$session = $session;
        this.$user = $user;
    }

    getUserGroups() {
        return this.$auth.getCurrentUser().then(u => {
            let groups = u.groups;
            if (!groups && u.team && u.team.length > 0) {
                groups = [{ name: 'My Team', users: u.team }];
            }
            return groups || [{ name: 'Default group: No name set', timeZone: '', users: [this.$session.CurrentUser.jiraUser] }];
        });
    }

    saveUserGroups(groups) {
        return this.$auth.getCurrentUser().then(u => {
            u.groups = groups;
            return this.$user.saveUser(u);
        });
    }
}