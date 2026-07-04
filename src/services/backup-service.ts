import { SettingsCategory, SystemUserId } from '@/constants';

import BaseService from './base-service';
import type ReportService from './report-service';
import type StorageService from './storage-service';

export interface BackupSettings {
    [userId: string]: {
        settings?: boolean;
        groups?: boolean;
        reports?: boolean;
    };
}

interface ExportData {
    date: number;
    version: number;
    users?: any[];
    config?: any;
    groups?: any;
    reports?: any;
}

interface LogEntry {
    type: 'info' | 'error';
    message: string;
}

const settingsToSkip = ['groups', 'disableDevNotification', 'enableAnalyticsLogging', 'enableExceptionLogging'];

export default class BackupService extends BaseService {
    static dependencies = ['StorageService', 'ReportService'];

    private $storage: StorageService;
    private $report: ReportService;

    constructor($storage: StorageService, $report: ReportService) {
        super();
        this.$storage = $storage;
        this.$report = $report;
    }

    async exportBackup(settings?: BackupSettings | boolean): Promise<ExportData> {
        const currentTime = new Date().getTime();
        const usersFromDB = await this.$storage.getAllUsers();

        const users: any[] = [];
        const groups: any = {};
        const reports: any = {};
        const config: any = {};

        const allowExport =
            typeof settings !== 'object'
                ? () => true
                : (id: any, key: string) => {
                      const userSettings = settings[id];
                      if (!userSettings || typeof userSettings !== 'object') return false;
                      return (userSettings as any)[key] || false;
                  };

        for (const u of usersFromDB) {
            const { id, jiraUrl } = u;
            const exportGrps = allowExport(id, 'groups');
            const exportConfigs = allowExport(id, 'settings');
            const settingsFromDB = (exportGrps || exportConfigs) && (await this.$storage.filterSettings({ userId: id }));

            if (exportGrps && settingsFromDB) {
                const groupsFromDB = settingsFromDB.filter((s: any) => s.category === SettingsCategory.General && s.name === 'groups')[0];
                if (Array.isArray(groupsFromDB?.value)) {
                    groups[jiraUrl] = groupsFromDB.value.map((g: any) => {
                        const { name, timeZone, users: selUsers } = g;
                        const users = selUsers.map((u: any) => {
                            const { costPerHour, locale, timeZone, accountId, emailAddress, displayName, avatarUrls, name } = u;
                            return { costPerHour, locale, timeZone, accountId, emailAddress, displayName, avatarUrls, name };
                        });
                        return { name, timeZone, users };
                    });
                }
            }

            if (id > SystemUserId && allowExport(id, 'reports')) {
                const reportsFromDB = await this.$storage.getReportsByUserId(id);
                if (reportsFromDB.length) {
                    await this.$report.prepareDataForExport(reportsFromDB);

                    setLastUpdated(reportsFromDB, currentTime);
                    reports[jiraUrl] = reportsFromDB;
                }
            }

            if (exportConfigs && settingsFromDB) {
                const { email, instId, apiUrl, userId, dateCreated, lastLogin, _ts = currentTime } = u;
                const settings = settingsFromDB.filter((s: any) => s.value && !settingsToSkip.includes(s.name));
                setLastUpdated(settings, currentTime);

                if (id > SystemUserId) {
                    users.push({ id, email, jiraUrl, apiUrl, userId, dateCreated, lastLogin, _ts });
                    config[jiraUrl] = settings;
                } else {
                    users.push({ id: SystemUserId, instId });
                    config[SystemUserId] = settings;
                }
            }
        }

        const exportData: ExportData = { date: new Date().getTime(), version: 1.1 };
        if (users.length) {
            exportData.users = users;
            exportData.config = config;
        }

        if (Object.keys(groups).length) {
            exportData.groups = groups;
        }
        if (Object.keys(reports).length) {
            exportData.reports = reports;
        }

        return exportData;
    }

    async importBackup(data: ExportData, settings?: BackupSettings, changeLogin?: boolean): Promise<LogEntry[]> {
        const logs: LogEntry[] = [];
        const { date, version, users, config, groups, reports } = data;
        const allowImport =
            typeof settings !== 'object'
                ? () => true
                : (key: string, id?: any) => {
                      if (!id) return !!(settings as any)[key];
                      const keySettings = (settings as any)[key];
                      if (!keySettings || typeof keySettings !== 'object') return false;
                      return !!keySettings[id];
                  };

        if (version !== 1.1) {
            throw new Error(
                `Unsupported version of backup. The minimum supported version of backup is v1.1 while you are using ${version}`,
            );
        }

        if (date) {
            logs.push({ type: 'info', message: `Backup v${version} created on ${new Date(date).format('dd-MMM-yyyy HH:mm')}` });
        }

        if (Array.isArray(users) && allowImport('settings')) {
            let loginDate: number | undefined;

            for (const u of users) {
                const { id, email, jiraUrl, apiUrl, userId, dateCreated, lastLogin } = u;
                if (!allowImport('settings', id)) {
                    continue;
                }

                const isSystemUser = id === SystemUserId;

                const userFromDb = !isSystemUser && (await this.$storage.getUserWithNameAndJiraUrl(userId, jiraUrl));
                let usrDBId = isSystemUser && id;

                if (userFromDb) {
                    logs.push({ type: 'info', message: `Instance already found: ${userFromDb.jiraUrl} (${userId}), ${userFromDb.email}` });
                    usrDBId = userFromDb.id;
                } else if (!isSystemUser) {
                    logs.push({ type: 'info', message: `Creating Instance: ${jiraUrl}, ${userId}; ${email}` });
                    usrDBId = await this.$storage.addUser({
                        email,
                        jiraUrl,
                        apiUrl,
                        userId,
                        dateCreated,
                        dateUpdated: new Date(),
                        lastLogin,
                    } as any);
                }

                const configToImport = config?.[jiraUrl];

                if (!Array.isArray(configToImport)) {
                    continue;
                }

                const settingsFromDB = await this.$storage.filterSettings({ userId: usrDBId });

                const settingsMap: any = settingsFromDB.reduce((obj: any, set: any) => {
                    if (set._ts > 2) {
                        obj[`${set.category}_${set.name}`] = set._ts;
                    }
                    return obj;
                }, {});

                const configToStore = configToImport
                    .filter((set: any) => {
                        const { category, name, _ts = date } = set;
                        const tsFromDB = settingsMap[`${category}_${name}`];
                        return !tsFromDB || tsFromDB < _ts;
                    })
                    .map(({ category, name, value, _ts = date }: any) => ({ userId: usrDBId, category, name, value, _ts }));

                if (changeLogin && jiraUrl && usrDBId && (!loginDate || loginDate < lastLogin?.getTime?.())) {
                    configToStore.push({
                        userId: SystemUserId,
                        category: SettingsCategory.System,
                        name: 'CurrentUserId',
                        value: usrDBId,
                        _ts: 2,
                    });
                    loginDate = lastLogin?.getTime?.();
                }

                await this.$storage.bulkPutSettings(configToStore, false);
            }
        } else {
            logs.push({ type: 'info', message: 'Settings not available in backup' });
        }

        if (typeof reports === 'object') {
            const insts = Object.keys(reports);
            for (const jiraUrl of insts) {
                const reportsToImport = reports[jiraUrl];
                if (!Array.isArray(reportsToImport)) {
                    continue;
                }
                const userFromDB = (await this.$storage.filterUsers({ jiraUrl }))[0];
                if (!userFromDB) {
                    logs.push({ type: 'error', message: `Reports import skipped: No integration found for "${jiraUrl}"` });
                    continue;
                }
                const usrIdFromDb = userFromDB.id;

                for (const report of reportsToImport) {
                    const reportFromDB = (
                        await this.$storage.filterReports({
                            createdBy: usrIdFromDb,
                            uniqueId: report.uniqueId,
                            queryName: report.queryName,
                        })
                    )[0];
                    if (!reportFromDB?._ts || reportFromDB._ts <= report._ts) {
                        report.id = reportFromDB?.id;
                        report.createdBy = usrIdFromDb;
                        await this.$storage.addOrUpdateReport(report);
                    }
                }
            }
        }

        if (typeof groups === 'object') {
            const insts = Object.keys(groups);
            for (const jiraUrl of insts) {
                const groupsToImport = groups[jiraUrl];
                if (!Array.isArray(groupsToImport)) {
                    continue;
                }

                const usersFromDB = await this.$storage.filterUsers({ jiraUrl });
                if (!usersFromDB.length) {
                    logs.push({ type: 'error', message: `Groups import skipped: No integration found for "${jiraUrl}"` });
                    continue;
                }

                for (const u of usersFromDB) {
                    const usrIdFromDb = u.id;
                    await this.importGroups(usrIdFromDb, groupsToImport, logs);
                }
            }
        }
        return logs;
    }

    async importGroups(usrIdFromDb: number, groupsToImport: any[], logs: LogEntry[]): Promise<void> {
        let groupsFromDB = (
            await this.$storage.filterSettings({
                userId: usrIdFromDb,
                category: SettingsCategory.General,
                name: 'groups',
            })
        )[0];

        if (!groupsFromDB?.value) {
            groupsFromDB = {
                userId: usrIdFromDb,
                category: SettingsCategory.General as any,
                name: 'groups',
                value: [],
            };
        }

        groupsToImport.forEach((g: any) => {
            const { name, timeZone, users: selUsers } = g;
            let curGroup = groupsFromDB.value.filter((gfd: any) => gfd.name?.toLowerCase() === name?.toLowerCase())[0];
            if (curGroup) {
                curGroup.timeZone = timeZone;
            } else {
                curGroup = { name, timeZone, users: [] };
                groupsFromDB.value.push(curGroup);
            }

            const curGrpUsrs = curGroup.users;

            selUsers.forEach((u: any) => {
                const { costPerHour, locale, timeZone, accountId, emailAddress, displayName, avatarUrls, name: usrName } = u;

                const curUsr = curGrpUsrs.filter(
                    (dbu: any) => (accountId && dbu.accountId === accountId) || (emailAddress && dbu.emailAddress === emailAddress),
                )[0];
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

function setLastUpdated(data: any, _ts: number): void {
    if (Array.isArray(data)) {
        data.forEach((d: any) => setLastUpdated(d, _ts));
    } else if (!data._ts) {
        data._ts = _ts;
    }
}
