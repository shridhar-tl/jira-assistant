import type AuthService from './auth-service';
import type JiraService from './jira-service';
import type SessionService from './session-service';
import type SettingsService from './settings-service';
import type UserService from './user-service';

function getUserName(user: any): string {
    return user?.accountId || user?.name || user?.key || user?.emailAddress || '';
}

export default class UserGroupService {
    static dependencies = ['AuthService', 'SessionService', 'UserService', 'SettingsService', 'JiraService'];

    private $auth: AuthService;
    private $session: SessionService;
    private $user: UserService;
    private $settings: SettingsService;
    private $jira: JiraService;

    constructor($auth: AuthService, $session: SessionService, $user: UserService, $settings: SettingsService, $jira: JiraService) {
        this.$auth = $auth;
        this.$session = $session;
        this.$user = $user;
        this.$settings = $settings;
        this.$jira = $jira;
    }

    getUserGroups = async (): Promise<any[]> => {
        const currentUser = this.$session.CurrentUser;
        const groups = await this.$settings.getGeneralSetting(currentUser.userId!, 'groups');

        const jiraGroups = groups?.filter((g: any) => g.isJiraGroup);

        await this.fillJiraGroupMembers(jiraGroups);

        return (
            groups || [
                {
                    name: 'Default group: No name set',
                    timeZone: '',
                    users: getUserName(currentUser.jiraUser) ? [currentUser.jiraUser] : [],
                },
            ]
        );
    };

    async fillJiraGroupMembers(jiraGroups: any[]): Promise<void> {
        if (!jiraGroups?.length) {
            return;
        }

        for (const grp of jiraGroups) {
            grp.users = await this.$jira.getGroupMembers(grp.id);

            if (grp.userProps) {
                grp.users.forEach((u: any) => {
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

    saveUserGroups(groups: any[]): Promise<void> {
        const currentUser = this.$session.CurrentUser;
        groups = groups.map((g: any) => {
            const { name, id, isJiraGroup, users, timeZone } = g;
            const grp: any = { name, id, isJiraGroup, timeZone, users };
            if (isJiraGroup) {
                const userProps: any = {};
                let saveUserProps = false;

                grp.users.forEach((u: any) => {
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
            } else {
                delete grp.isJiraGroup;
                delete grp.id;
            }
            return grp;
        });
        return this.$settings.saveGeneralSetting(currentUser.userId!, 'groups', groups);
    }
}
