import { getUserName } from "../common/utils";

export default class UserGroupService {
    static dependencies = ["AuthService", "SessionService", "UserService", 'SettingsService', 'JiraService'];

    constructor($auth, $session, $user, $settings, $jira) {
        this.$auth = $auth;
        this.$session = $session;
        this.$user = $user;
        this.$settings = $settings;
        this.$jira = $jira;
    }

    getUserGroups = async () => {
        const currentUser = this.$session.CurrentUser;
        const groups = await this.$settings.getGeneralSetting(currentUser.userId, 'groups');

        const jiraGroups = groups?.filter(g => g.isJiraGroup);

        // This call will mutate the group object with the list of jira users
        await this.fillJiraGroupMembers(jiraGroups);

        return groups || [
            {
                name: 'Default group: No name set',
                timeZone: '',
                users: [currentUser.jiraUser]
            }
        ];
    };

    async fillJiraGroupMembers(jiraGroups) {
        if (!jiraGroups?.length) {
            return;
        }

        for (const grp of jiraGroups) {
            grp.users = await this.$jira.getGroupMembers(grp.id);

            if (grp.userProps) {
                grp.users.forEach(u => {
                    const uProp = grp.userProps[getUserName(u)];
                    if (uProp) {
                        u.timeZone = uProp.timeZone;
                        u.costPerHour = uProp.costPerHour;
                    }
                });

                delete grp.userProps;
            }
        }
    }

    saveUserGroups(groups) {
        const currentUser = this.$session.CurrentUser;
        groups = groups.map(g => {
            const { name, id, isJiraGroup, users, timeZone } = g;
            const grp = { name, id, isJiraGroup, timeZone, users };
            if (isJiraGroup) {
                // Jira user will be pulled from Jira every time. So local props has to be saved at group level
                const userProps = {};
                let saveUserProps = false;

                grp.users.forEach(u => {
                    const { timeZone, costPerHour } = u;
                    if (timeZone || costPerHour) {
                        saveUserProps = true;
                        userProps[getUserName(u)] = { timeZone, costPerHour };
                    }
                });

                if (saveUserProps) {
                    grp.userProps = userProps;
                }

                delete grp.users;
            }
            else {
                delete grp.isJiraGroup;
                delete grp.id;
            }
            return grp;
        });
        return this.$settings.saveGeneralSetting(currentUser.userId, 'groups', groups);
    }
}