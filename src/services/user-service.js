import { ContactUsUrl, SettingsCategory, SystemUserId } from "../_constants";

export default class UserService {
    static dependencies = ["DatabaseService", "JiraService"];

    constructor($db, $jira) {
        this.$db = $db;
        this.$jira = $jira;
    }

    getUser(userId) {
        return this.$db.users.get(userId);
    }

    getAllUsers() {
        return this.$db.users.toArray();
    }

    async saveGlobalSettings(users) {
        const settingsArr = [];
        const changeSetting = (sett, user, prop, retain) => {
            const item = {
                userId: user.id,
                category: SettingsCategory.Advanced,
                name: prop,
                value: sett[prop]
            };
            settingsArr.push(item);

            if (!item.value && !retain) {
                delete item.value;
            }
        };

        await Promise.all(users.map(async u => {
            if (u.id > SystemUserId && u.deleted) {
                await this.$db.appSettings.where({ userId: u.id }).delete();
                await this.$db.users.delete(u.id);
                return;
            }

            let user = await this.getUser(u.id);
            user = { ...user };

            user.jiraUrl = u.jiraUrl;
            user.userId = u.userId;
            user.email = u.email;

            changeSetting(u, user, "openTicketsJQL");
            changeSetting(u, user, "suggestionJQL");
            changeSetting(u, user, "disableJiraUpdates");
            changeSetting(u, user, "jiraUpdatesJQL");
            changeSetting(u, user, "enableAnalyticsLogging", true);
            changeSetting(u, user, "enableExceptionLogging", true);
            changeSetting(u, user, "disableDevNotification");

            await this.$db.users.put(user);
        }));

        await this.$db.appSettings.bulkPut(settingsArr);
    }

    async saveUser(user) {
        return this.$db.users.put(user);
    }

    async getUsersList() {
        const users = await this.$db.users.where("id").notEqual(1).toArray();
        return users.map(u => ({ id: u.id, email: u.email, jiraUrl: u.jiraUrl, userId: u.userId }));
    }

    async getUserDetails(userId) {
        const currentUser = await this.getUser(userId);

        if (!currentUser) {
            return currentUser;
        }

        const feedbackUrl = `${ContactUsUrl}?entry.326955045&entry.1696159737&entry.485428648={0}&entry.879531967={1}&entry.1426640786={2}&entry.972533768={3}`;
        currentUser.jiraUrl = currentUser.jiraUrl.toString().clearEnd('/');

        //this.$session.authTokken = currentUser.dataStore;
        const sessionUser = {
            userId: currentUser.id,
            jiraUrl: currentUser.jiraUrl,
            ticketViewUrl: `${currentUser.jiraUrl}/browse/`,
            profileUrl: `${currentUser.jiraUrl}/secure/ViewProfile.jspa`,
            feedbackUrl: `${feedbackUrl}&emb=true` //&embedded=true for directly using google forms
        };

        const jiraUrlLower = currentUser.jiraUrl.toLowerCase();

        if (jiraUrlLower.indexOf('pearson') >= 0 || jiraUrlLower.indexOf('emoneyadv') >= 0) {
            sessionUser.noDonations = true;
            sessionUser.hideDonateMenu = true;
        }
        else {
            delete sessionUser.noDonations;
        }
        return sessionUser;
    }
}