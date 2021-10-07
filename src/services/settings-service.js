import { dateFormats, DefaultEndOfDay, DefaultStartOfDay, DefaultWorkingDays, SettingsCategory, SystemUserId, timeFormats } from "../_constants";

const userSpecificSettings = [
    'allowClosedTickets',
    'favTicketList', 'meetingTicket',
    'groups', 'dataStore', 'outlookStore',

    'googleIntegration', 'outlookIntegration',
    'projects', 'rapidViews', 'storyPointField', 'epicNameField',
    'launchAction',

    'disableJiraUpdates', 'jiraUpdatesJQL',
    'suggestionJQL', 'openTicketsJQL',

    // 'notifyBefore','autoLaunch', 'autoUpload','checkUpdates','highlightVariance',
    //'uploadLogBy','trackBrowser', 'team','taskLogEnabled','pruneInterval','notifyWL',
];

const advancedSettArr = [
    'disableJiraUpdates', 'jiraUpdatesJQL',
    'suggestionJQL', 'openTicketsJQL',
    'disableDevNotification',
    'enableExceptionLogging',
    'enableAnalyticsLogging',
];

const genericSettings = [
    'hideDonateMenu',
    'disableDevNotification',
    'enableExceptionLogging',
    'enableAnalyticsLogging',
    'dateFormat',
    'timeFormat',
    'startOfWeek',
    'workingDays',
    'startOfDay',
    'endOfDay',
    'maxHours',
    'commentLength',
];

const settingsDefaultValues = {
    workingDays: DefaultWorkingDays,
    dateFormat: dateFormats[0],
    timeFormat: timeFormats[0],
    maxHours: 8,
    commentLength: 5,
    startOfDay: DefaultStartOfDay,
    endOfDay: DefaultEndOfDay
};

class SettingsService {
    static dependencies = ["DatabaseService"];

    constructor($db) {
        this.$db = $db;
    }

    getAllSettings = async (userId, category) => {
        const settings = await this.$db.appSettings
            .where({ userId, category })
            .toArray();

        return settings.reduce((obj, cur) => {
            obj[cur.name] = cur.value;
            return obj;
        }, {});
    }

    getSetting = async (userId, category, name) => {
        const sett = await this.$db.appSettings.get([userId, category, name]);
        return sett?.value;
    }

    getGeneralSettings = async (userId) => {
        const userSettings = await this.getAllSettings(userId, SettingsCategory.General);
        const globalSettings = await this.getAllSettings(SystemUserId, SettingsCategory.General);

        const result = { ...globalSettings, ...userSettings };

        result.hasGoogleCredentials = !!result.dataStore;
        result.hasOutlookCredentials = !!result.outlookStore;

        return result;
    }

    getAdvancedSettings = async (userId) => {
        const userSettings = await this.getAllSettings(userId, SettingsCategory.Advanced);
        let globalSettings = {};

        if (userId !== SystemUserId) { // ToDo: If condition need to be removed once system user is removed
            globalSettings = await this.getAllSettings(SystemUserId, SettingsCategory.Advanced);
        }

        const result = { ...globalSettings, ...userSettings };

        return result;
    }

    getGeneralSetting = async (userId, name) => {
        let value = await this.getSetting(userId, SettingsCategory.General, name);

        // If setting is not available for user, take from system
        if (value === undefined) {
            value = await this.getSetting(SystemUserId, SettingsCategory.General, name);
        }

        return value || settingsDefaultValues[name];
    }

    getPageSettings = (userId, name) =>
        this.getAllSettings(userId, SettingsCategory.PageSettings, name);

    getDashboards = async (userId) => {
        let boards = await this.$db.appSettings
            .where({ userId, category: SettingsCategory.Dashboard })
            .toArray();

        if (boards.length) {
            boards = boards.map(({ value }) => value).filter(Boolean);
        }

        if (!boards.length) {
            boards = [
                {
                    isQuickView: true,
                    layout: 1,
                    name: 'Default',
                    icon: 'fa fa-tachometer',
                    widgets: [
                        { name: 'myOpenTickets' },
                        { name: 'myBookmarks' },
                        { name: 'dateWiseWorklog' },
                        { name: 'pendingWorklog' },
                    ]
                }
            ];
        }

        return boards;
    }

    deleteDashboard = (userId, id) => this.$db.appSettings.delete([userId, SettingsCategory.Dashboard, id]);

    saveSetting = async (userId, category, name, value) =>
        this.$db.appSettings.put({ userId, category, name, value });

    saveGeneralSetting = (userId, name, value) =>
        this.saveSetting(userId, SettingsCategory.General, name, value);

    savePageSetting = (userId, name, value) =>
        this.saveSetting(userId, SettingsCategory.PageSettings, name, value);

    migrateSettings = async () => {
        const users = await this.$db.users.toArray();

        const systemUser = users.filter(u => u.id === SystemUserId)[0];

        if (systemUser?.settingsMigrated) {
            console.log('Settings already migrated');
            return;
        }

        const { instId, dateCreated: installDate } = systemUser || {};

        const settingsArr = [
            {
                userId: SystemUserId,
                category: SettingsCategory.System,
                name: 'instId', value: instId
            },
            {
                userId: SystemUserId,
                category: SettingsCategory.System,
                name: 'installDate', value: installDate
            }
        ];

        const globalSettings = {};

        users.forEach(user => {
            const userSettings = {};
            const dashboards = user['dashboards'];
            const pageSettings = user['settings'];

            genericSettings.forEach(name => {
                let value = user[name];

                // This is to overcome string stored as String class
                if (typeof value === 'string') {
                    value = value.toString();
                }

                if (value !== undefined) {
                    if (globalSettings[name] === undefined) {
                        globalSettings[name] = value;
                    } else if (value !== globalSettings[name]) {
                        userSettings[name] = value;
                    }
                }
            });

            const userId = user.id;

            // For system user no need to proceed further
            if (userId === SystemUserId) {
                return;
            }

            userSpecificSettings.forEach(name => {
                let value = user[name];

                // This is to overcome string stored as String class
                if (typeof value === 'string') {
                    value = value.toString();
                }

                if (value !== undefined) {
                    userSettings[name] = value;
                }
            });

            // Prepare user settings for storing
            Object.keys(userSettings).forEach(name => {
                const value = userSettings[name];
                settingsArr.push({
                    userId,
                    category: advancedSettArr.indexOf(name) >= 0 ? SettingsCategory.Advanced : SettingsCategory.General,
                    name, value
                });
            });

            if (Array.isArray(dashboards)) {
                let time = new Date().getTime();
                dashboards.forEach((value) => {
                    value.id = time++;
                    settingsArr.push({
                        userId,
                        category: SettingsCategory.Dashboard,
                        name: value.id, value
                    });
                });
            }

            if (pageSettings && typeof pageSettings === 'object') {
                Object.keys(pageSettings).forEach(name => {
                    settingsArr.push({
                        userId,
                        category: SettingsCategory.PageSettings,
                        name, value: pageSettings[name]
                    });
                });
            }
        });

        // Prepare global settings for storing
        Object.keys(globalSettings).forEach(name => {
            const value = globalSettings[name];
            settingsArr.push({
                userId: SystemUserId,
                category: advancedSettArr.indexOf(name) >= 0 ? SettingsCategory.Advanced : SettingsCategory.General,
                name, value
            });
        });

        await this.$db.appSettings.bulkPut(settingsArr);

        if (systemUser) {
            systemUser.settingsMigrated = true;
            await this.$db.users.put(systemUser);
        }

        console.log('Settings migrated successfully');
    }
}

export default SettingsService;