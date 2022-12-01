import { ContactUsUrl } from "../constants/urls";
import { SettingsCategory } from "../constants/settings";
import { SystemUserId } from "../constants/common";
import { getUserName } from '../common/utils';

export default class UserService {
    static dependencies = ["SettingsService", "StorageService"];

    constructor($settings, $storage) {
        this.$settings = $settings;
        this.$storage = $storage;
    }

    getUser(userId) { return this.$storage.getUser(userId); }

    getAllUsers() { return this.$storage.getAllUsers(); }

    async saveGlobalSettings(users) {
        const settingsArr = [];
        const changeSetting = (sett, user, prop, retain, category) => {
            const item = {
                userId: user.id,
                category: category || SettingsCategory.Advanced,
                name: prop,
                value: sett[prop]
            };
            settingsArr.push(item);

            if (!item.value && !retain) {
                delete item.value;
            }
        };

        await Promise.all(users.map(async u => {
            const intgUser = u.id > SystemUserId;
            if (intgUser && u.deleted) {
                await this.$storage.deleteAllSettingsWithUserId(u.id);
                await this.$storage.deleteUser(u.id);
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
            if (!intgUser) {
                changeSetting(u, user, "enableAnalyticsLogging", true);
                changeSetting(u, user, "enableExceptionLogging", true);
                changeSetting(u, user, "disableDevNotification");
                changeSetting(u, user, "useWebVersion", false, SettingsCategory.System);
            }

            await this.$storage.addOrUpdateUser(user);
        }));

        await this.$storage.bulkPutSettings(settingsArr);
    }

    /* Commented out as no reference is found
    async saveUser(user) {
        return this.$storage.addOrUpdateUser(user);
    }*/

    async getUsersList() {
        const users = (await this.$storage.getAllUsers()).filter(u => u.id !== 1);
        return users.map(u => ({ id: u.id, email: u.email, jiraUrl: u.jiraUrl, apiUrl: u.apiUrl, userId: u.userId }));
    }

    async getUserDetails(userId) {
        const currentUser = await this.getUser(userId);

        if (!currentUser) {
            return currentUser;
        }

        const feedbackUrl = `${ContactUsUrl}?name={0}&email={1}&javersion={2}&browser={3}&entry.326955045&entry.1696159737&entry.485428648={0}&entry.879531967={1}&entry.1426640786={2}&entry.972533768={3}`;
        currentUser.jiraUrl = currentUser.jiraUrl.toString().clearEnd('/');
        if (currentUser.apiUrl) {
            currentUser.apiUrl = currentUser.apiUrl.toString().clearEnd('/');
        }
        //this.$session.authTokken = currentUser.dataStore;
        const sessionUser = {
            userId: currentUser.id,
            jiraUrl: currentUser.jiraUrl,
            profileUrl: `${currentUser.jiraUrl}/secure/ViewProfile.jspa`,
            feedbackUrl: `${feedbackUrl}&emb=true` //&embedded=true for directly using google forms
        };

        if (currentUser.apiUrl) {
            sessionUser.apiUrl = currentUser.apiUrl;
        }

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


    async getUserFromDB(root, name, email) {
        let user = await this.$storage.getUserWithNameAndJiraUrl(name, root);

        if (!user && email) {
            user = await this.$storage.getUserWithEmailAndJiraUrl(email, root);
        }

        return user;
    }

    async createUser(profile, root, options) {
        const name = getUserName(profile);
        const email = profile.emailAddress;
        const optIsObj = options && typeof options === 'object';
        const apiUrl = !optIsObj ? options : undefined;

        if (!optIsObj) {
            options = undefined;
        }

        let user = await this.getUserFromDB(root, name, email);
        if (!user) {
            user = {
                jiraUrl: root,
                userId: name,
                email: email,
                lastLogin: new Date(),
                dateCreated: new Date(),
                ...options
            };

            if (apiUrl) {
                user.authType = 'O';
                user.apiUrl = apiUrl;
            }

            const id = await this.$storage.addUser(user);

            const defaultSettings = [
                { userId: id, category: SettingsCategory.General, name: 'dateFormat', value: 'dd-MMM-yyyy', _ts: 2 },
                { userId: id, category: SettingsCategory.General, name: 'timeFormat', value: ' hh:mm:ss tt', _ts: 2 },
                { userId: id, category: SettingsCategory.General, name: 'minHours', value: 8, _ts: 2 },
                { userId: id, category: SettingsCategory.General, name: 'maxHours', value: 8, _ts: 2 },
                { userId: id, category: SettingsCategory.General, name: 'startOfDay', value: '09:00', _ts: 2 },
                { userId: id, category: SettingsCategory.General, name: 'endOfDay', value: '17:00', _ts: 2 },
                { userId: id, category: SettingsCategory.General, name: 'startOfWeek', value: 1, _ts: 2 },
                { userId: SystemUserId, category: SettingsCategory.System, name: 'CurrentJiraUrl', value: root, _ts: 2 },
                { userId: SystemUserId, category: SettingsCategory.System, name: 'CurrentUserId', value: id, _ts: 2 },
            ];

            await this.$storage.bulkPutSettings(defaultSettings, false);

            return id;
        }
        else {
            user.jiraUrl = root;
            user.userId = name;
            user.email = email;
            user.lastLogin = new Date();

            if (apiUrl) {
                user.authType = 'O';
                user.apiUrl = apiUrl;
            } else if (options) {
                user.authType = options.authType;
                user.uid = options.uid;
                user.pwd = options.pwd;
                delete user.apiUrl;
            } else {
                delete user.apiUrl;
                delete user.authType;
                delete user.uid;
                delete user.pwd;
            }

            await this.$storage.addOrUpdateUser(user);

            return user.id;
        }
    }
}