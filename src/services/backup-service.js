import { SystemUserId } from "../constants/common";
import { SettingsCategory } from "../constants/settings";
import BaseService from "./base-service";

const settingsToSkip = ['groups', 'disableDevNotification', 'enableAnalyticsLogging', 'enableExceptionLogging'];

export default class BackupService extends BaseService {
    static dependencies = ['StorageService'];

    constructor($storage) {
        super();
        this.$storage = $storage;
    }

    async exportData(settings) {
        const currentTime = new Date().getTime();
        const usersFromDB = await this.$storage.getAllUsers();

        const users = [], groups = {}, reports = {}, config = {};

        const allowExport = (typeof settings !== 'object') ? () => true : (id, key) => settings[id]?.[key] || false;

        await usersFromDB.mapAsync(async u => {
            const { id, jiraUrl } = u;
            const exportGrps = allowExport(id, 'groups');
            const exportConfigs = allowExport(id, 'settings');
            const settingsFromDB = (exportGrps || exportConfigs) && await this.$storage.filterSettings({ userId: id });

            if (exportGrps) {
                const groups = settingsFromDB.filter(s => s.category === SettingsCategory.General && s.name === 'groups')[0];
                if (Array.isArray(groups?.value)) {
                    groups[jiraUrl] = groups.value.map(g => {
                        const { name, timeZone, users: selUsers } = g;
                        const users = selUsers.map(u => {
                            const { costPerHour, locale, timeZone, accountId, emailAddress } = u;
                            return { costPerHour, locale, timeZone, accountId, emailAddress };
                        });
                        return { name, timeZone, users };
                    });
                }
            }

            if (id > SystemUserId && allowExport(id, 'reports')) {
                const reports = await this.$storage.getReportsByUserId(id);
                setLastUpdated(reports, currentTime);
                reports[jiraUrl] = reports;
            }

            if (exportConfigs) {
                const { email, instId, apiUrl, userId, dateCreated, lastLogin, settingsMigrated } = u;
                const settings = settingsFromDB.filter(s => s.value && !settingsToSkip.includes(s.name));
                setLastUpdated(settings, currentTime);

                if (id > SystemUserId) {
                    users.push({ email, jiraUrl, apiUrl, userId, dateCreated, lastLogin });
                    config[jiraUrl] = settings;
                } else {
                    users.push({ id: SystemUserId, instId, settingsMigrated });
                    config[SystemUserId] = settings;
                }
            }
        });

        const exportData = { date: new Date().getTime(), version: 1 };
        if (users.length) {
            exportData.users = users;
            exportData.config = config;
        }

        if (Object.keys(groups).length) { exportData.groups = groups; }
        if (Object.keys(reports).length) { exportData.reports = reports; }

        return exportData;
    }

    async importData(data) {
        //
    }
}

function setLastUpdated(data, _ts) {
    if (Array.isArray(data)) {
        data.forEach(d => setLastUpdated(d, _ts));
    } else if (!data._ts) {
        data._ts = _ts;
    }
}