import { SystemUserId } from "../constants/common";
import { SettingsCategory } from "../constants/settings";
import BaseService from "./base-service";

const settingsToSkip = ['groups', 'disableDevNotification', 'enableAnalyticsLogging', 'enableExceptionLogging'];

export default class BackupService extends BaseService {
    static dependencies = ['StorageService', 'ReportService'];

    constructor($storage, $report) {
        super();
        this.$storage = $storage;
        this.$report = $report;
    }

    async exportBackup(settings) {
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
                const groupsFromDB = settingsFromDB.filter(s => s.category === SettingsCategory.General && s.name === 'groups')[0];
                if (Array.isArray(groupsFromDB?.value)) {
                    groups[jiraUrl] = groupsFromDB.value.map(g => {
                        const { name, timeZone, users: selUsers } = g;
                        const users = selUsers.map(u => {
                            const { costPerHour, locale, timeZone, accountId, emailAddress, displayName, avatarUrls, name } = u;
                            return { costPerHour, locale, timeZone, accountId, emailAddress, displayName, avatarUrls, name };
                        });
                        return { name, timeZone, users };
                    });
                }
            }

            if (id > SystemUserId && allowExport(id, 'reports')) {
                const reports = await this.$storage.getReportsByUserId(id);
                await this.$report.prepareDataForExport(reports);

                setLastUpdated(reports, currentTime);
                reports[jiraUrl] = reports;
            }

            if (exportConfigs) {
                const { email, instId, apiUrl, userId, dateCreated, lastLogin, settingsMigrated, _ts = currentTime } = u;
                const settings = settingsFromDB.filter(s => s.value && !settingsToSkip.includes(s.name));
                setLastUpdated(settings, currentTime);

                if (id > SystemUserId) {
                    users.push({ id, email, jiraUrl, apiUrl, userId, dateCreated, lastLogin, _ts });
                    config[jiraUrl] = settings;
                } else {
                    users.push({ id: SystemUserId, instId, settingsMigrated });
                    config[SystemUserId] = settings;
                }
            }
        });

        const exportData = { date: new Date().getTime(), version: 1.1 };
        if (users.length) {
            exportData.users = users;
            exportData.config = config;
        }

        if (Object.keys(groups).length) { exportData.groups = groups; }
        if (Object.keys(reports).length) { exportData.reports = reports; }

        return exportData;
    }

    async importBackup(data, settings, changeLogin) {
        const logs = [];
        const { date, version, users, config, groups, reports } = data;
        const allowImport = (typeof settings !== 'object') ? () => true : (key, id) => !!(id ? settings[key]?.[id] : settings[key]);
        if (version !== 1.1) {
            throw new Error(`Unsupported version of backup. The minimum supported version of backup is v1.1 while you are using ${version}`);
        }
        if (date) {
            logs.push({ type: 'info', message: `Backup v${version} created on ${new Date(date).format('dd-MMM-yyyy HH:mm')}` });
        }

        if (Array.isArray(users) && allowImport('settings')) {
            let loginDate;
            await users.mapAsync(async u => {
                const { id, email, jiraUrl, apiUrl, userId, dateCreated, lastLogin } = u;
                if (!allowImport('settings', id)) { return; }

                const isSystemUser = id === SystemUserId;

                const userFromDb = !isSystemUser && await this.$storage.getUserWithNameAndJiraUrl(userId, jiraUrl);
                let usrDBId = isSystemUser && id;

                if (userFromDb) {
                    logs.push({ type: 'info', message: `Instance already found: ${userFromDb.jiraUrl} (${userId}), ${userFromDb.email}` });
                    usrDBId = userFromDb.id;
                } else if (!isSystemUser) {
                    logs.push({ type: 'info', message: `Creating Instance: ${jiraUrl}, ${userId}; ${email}` });
                    usrDBId = await this.$storage.addUser({ email, jiraUrl, apiUrl, userId, dateCreated, dateUpdated: new Date(), lastLogin });
                }

                const configToImport = config?.[jiraUrl];

                if (!Array.isArray(configToImport)) { return; }

                const settingsFromDB = await this.$storage.filterSettings({ userId: usrDBId });

                const settingsMap = settingsFromDB.reduce((obj, set) => {
                    if (set._ts > 2) {
                        set[`${set.category}_${set.name}`] = set._ts;
                    }
                    return obj;
                }, {});

                const configToStore = configToImport.filter(set => {
                    const { category, name, _ts = date } = set;
                    const tsFromDB = settingsMap[`${category}_${name}`];
                    return (!tsFromDB || tsFromDB < _ts);
                }).map(({ category, name, value, _ts = date }) => ({ userId: usrDBId, category, name, value, _ts }));

                if (changeLogin && jiraUrl && usrDBId && (!loginDate || loginDate < lastLogin?.getTime())) {
                    configToStore.push({ userId: SystemUserId, category: SettingsCategory.System, name: 'CurrentJiraUrl', value: jiraUrl, _ts: 2 });
                    configToStore.push({ userId: SystemUserId, category: SettingsCategory.System, name: 'CurrentUserId', value: usrDBId, _ts: 2 });
                    loginDate = lastLogin?.getTime();
                }

                await this.$storage.bulkPutSettings(configToStore, false);
            });
        } else {
            logs.push({ type: 'info', message: 'Settings not available in backup' });
        }

        if (typeof reports === 'object') {
            const insts = Object.keys(reports);
            await insts.mapAsync(async jiraUrl => {
                const reportsToImport = reports[jiraUrl];
                if (!Array.isArray(reportsToImport)) { return; }
                const userFromDB = (await this.$storage.filterUsers({ jiraUrl }))[0];
                if (!userFromDB) {
                    logs.push({ type: 'error', message: `Reports import skipped: No integration found for "${jiraUrl}"` });
                    return;
                }
                const usrIdFromDb = userFromDB.id;

                await reportsToImport.mapAsync(async (report) => {
                    const reportFromDB = (await this.$storage.filterReports({
                        createdBy: usrIdFromDb,
                        uniqueId: report.uniqueId,
                        queryName: report.queryName
                    }))[0];
                    if (reportFromDB?._ts <= report._ts) {
                        report.id = reportFromDB?.id;
                        report.createdBy = usrIdFromDb;
                        await this.$storage.addOrUpdateReport(report);
                    }
                });
            });
        }

        if (typeof groups === 'object') {
            const insts = Object.keys(groups);
            await insts.mapAsync(async jiraUrl => {
                const groupsToImport = groups[jiraUrl];
                if (!Array.isArray(groupsToImport)) { return; }

                const usersFromDB = (await this.$storage.filterUsers({ jiraUrl }))[0];
                if (!usersFromDB.length) {
                    logs.push({ type: 'error', message: `Groups import skipped: No integration found for "${jiraUrl}"` });
                    return;
                }

                usersFromDB.forEach(u => {
                    const usrIdFromDb = u.id;
                    this.importGroups(usrIdFromDb, groupsToImport, logs);
                });
            });
        }
        return logs;
    }

    async importGroups(usrIdFromDb, groupsToImport, logs) {
        let groupsFromDB = (await this.$storage.filterSettings({
            userId: usrIdFromDb,
            category: SettingsCategory.General,
            name: 'groups'
        }))[0];

        if (!groupsFromDB?.value) {
            groupsFromDB = {
                userId: usrIdFromDb,
                category: SettingsCategory.General,
                name: 'groups',
                value: []
            };
        }

        groupsToImport.forEach(g => {
            const { name, timeZone, users: selUsers } = g;
            let curGroup = groupsFromDB.value.filter(gfd => gfd.name?.toLowerCase() === name?.toLowerCase())[0];
            if (curGroup) {
                curGroup.timeZone = timeZone;
            } else {
                curGroup = { name, timeZone, users: [] };
                groupsFromDB.value.push(curGroup);
            }

            const curGrpUsrs = curGroup.users;

            selUsers.forEach(u => {
                const { costPerHour, locale, timeZone, accountId, emailAddress, displayName, avatarUrls, name: usrName } = u;

                const curUsr = curGrpUsrs.filter(dbu => dbu.accountId === accountId || dbu.emailAddress === emailAddress)[0];
                if (curUsr) {
                    logs.push({ type: 'info', message: `User "${emailAddress}" already exists in group "${name}"` });
                } else {
                    curGrpUsrs.push({ costPerHour, locale, timeZone, accountId, emailAddress, displayName, avatarUrls, name: usrName });
                }
            });
        });

        await this.$storage.addOrUpdateSetting(groupsFromDB);
    }
}

function setLastUpdated(data, _ts) {
    if (Array.isArray(data)) {
        data.forEach(d => setLastUpdated(d, _ts));
    } else if (!data._ts) {
        data._ts = _ts;
    }
}