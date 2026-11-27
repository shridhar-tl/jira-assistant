import type JiraService from './jira-service';
import type SessionService from './session-service';
import type SettingsService from './settings-service';

function getUserName(user: any): string {
    return user?.accountId || user?.name || user?.key || user?.emailAddress || '';
}

export default class UserGroupService {
    static dependencies = ['SessionService', 'SettingsService', 'JiraService'];

    private $session: SessionService;
    private $settings: SettingsService;
    private $jira: JiraService;

    constructor($session: SessionService, $settings: SettingsService, $jira: JiraService) {
        this.$session = $session;
        this.$settings = $settings;
        this.$jira = $jira;
    }

    getUserGroups = async (): Promise<any[]> => {
        const currentUser = this.$session.CurrentUser;
        const groups = await this.$settings.getGeneralSetting(currentUser.userId!, 'groups');

        const jiraGroups = groups?.filter((g: any) => g.isJiraGroup);

        await this.fillJiraGroupMembers(jiraGroups);

        if (groups) {
            return groups;
        }

        // Dashboard widgets authenticate without loading the Jira profile, so the current user is fetched here
        if (!getUserName(currentUser.jiraUser)) {
            currentUser.jiraUser = await this.$jira.getCurrentUser();
        }
        const { jiraUser } = currentUser;
        return [{ name: 'Default group: No name set', timeZone: '', users: getUserName(jiraUser) ? [jiraUser] : [] }];
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
