import type { AppSetting, SavedFilter, SettingsCategory, User, Worklog } from '@types';

import type DatabaseService from './database-service';

export default class StorageService {
    static availableMethods =
        'getPendingWorklogByUserId,getWorklogsWithIds,getSingleWorklogWithId,getWorklogsBetween,filterWorklogs,addOrUpdateWorklog,' +
        'addWorklog,deleteWorklog,getReportsWithIds,getReportsByUserId,getSingleReportById,filterReports,getReportByNameForValidation,addOrUpdateReport,addReport,' +
        'deleteReportsWithIds,getAllUsers,getUser,getUserWithNameAndJiraUrl,getUserWithEmailAndJiraUrl,filterUsers,addUser,addOrUpdateUser,deleteUser,' +
        'filterSettings,getSetting,addOrUpdateSetting,bulkPutSettings,deleteSetting,deleteAllSettingsWithUserId';

    static dependencies = ['DatabaseService'];

    private $db: DatabaseService;

    constructor($db: DatabaseService) {
        this.$db = $db;
    }

    getPendingWorklogByUserId(userId: string | number): Promise<Worklog[]> {
        return this.$db.worklogs
            .where('createdBy')
            .equals(userId)
            .and((w: any) => !w.isUploaded)
            .toArray();
    }

    getWorklogsWithIds(ids: number[]): Promise<Worklog[]> {
        return this.$db.worklogs.where('id').anyOf(ids).toArray();
    }

    getSingleWorklogWithId(id: number): Promise<Worklog | undefined> {
        return this.$db.worklogs.where('id').equals(parseInt(id.toString())).first();
    }

    getWorklogsBetween(fromDate: Date, toDate: Date, userId: string | number): Promise<Worklog[]> {
        return this.$db.worklogs
            .where('dateStarted')
            .between(fromDate, toDate, true, true)
            .and((w: any) => w.createdBy === userId)
            .toArray();
    }

    filterWorklogs(filter: Record<string, any>): Promise<Worklog[]> {
        return this.$db.worklogs.where(filter).toArray();
    }

    async addOrUpdateWorklog(entry: Worklog): Promise<number> {
        setLastUpdated(entry);
        return await this.$db.worklogs.put(entry);
    }

    async addWorklog(entry: Omit<Worklog, 'id'>): Promise<number> {
        setLastUpdated(entry);
        return await this.$db.worklogs.add(entry as any);
    }

    deleteWorklog(id: number): Promise<void> {
        return this.$db.worklogs.delete(id);
    }

    private _getReportsWithIds(ids: number[]) {
        return this.$db.savedFilters.where('id').anyOf(ids);
    }

    getReportsWithIds(ids: number[]): Promise<SavedFilter[]> {
        return this._getReportsWithIds(ids).toArray();
    }

    getReportsByUserId(userId: string | number): Promise<SavedFilter[]> {
        return this.$db.savedFilters.where('createdBy').equals(userId).toArray();
    }

    getSingleReportById(id: number): Promise<SavedFilter | undefined> {
        return this.$db.savedFilters.where('id').equals(parseInt(id.toString())).first();
    }

    filterReports(filter: Record<string, any>): Promise<SavedFilter[]> {
        return this.$db.savedFilters.where(filter).toArray();
    }

    getReportByNameForValidation(name: string, userId: string | number, excludeId?: number): Promise<SavedFilter | undefined> {
        const parsedExcludeId = excludeId ? parseInt(excludeId.toString()) : 0;
        const filter =
            parsedExcludeId > 0
                ? (q: SavedFilter) => q.createdBy === userId && parsedExcludeId !== q.id
                : (q: SavedFilter) => q.createdBy === userId;

        return this.$db.savedFilters.where('queryName').equals(name).and(filter).first();
    }

    async addOrUpdateReport(report: SavedFilter): Promise<number> {
        setLastUpdated(report);
        return await this.$db.savedFilters.put(report);
    }

    async addReport(report: SavedFilter): Promise<number> {
        setLastUpdated(report);
        return await this.$db.savedFilters.add(report);
    }

    async deleteReportsWithIds(ids: number[]): Promise<void> {
        await this._getReportsWithIds(ids).delete();
    }

    getAllUsers(): Promise<User[]> {
        return this.$db.users.toArray();
    }

    getUser(userId: number): Promise<User | undefined> {
        return this.$db.users.get(userId);
    }

    getUserWithNameAndJiraUrl(name: string, url: string): Promise<User | undefined> {
        if (!name) {
            return Promise.resolve(undefined);
        }

        const normalizedUrl = url.toLowerCase();

        return this.$db.users
            .where('userId')
            .equalsIgnoreCase(name)
            .and((u: any) => u.jiraUrl.toLowerCase() === normalizedUrl)
            .first();
    }

    getUserWithEmailAndJiraUrl(email: string, url: string): Promise<User | undefined> {
        const normalizedEmail = email.toLowerCase();
        const normalizedUrl = url.toLowerCase();

        return this.$db.users
            .filter((u: any) => (u.email || '').toLowerCase() === normalizedEmail && u.jiraUrl.toLowerCase() === normalizedUrl)
            .first();
    }

    filterUsers(filter: Record<string, any>): Promise<User[]> {
        return this.$db.users.where(filter).toArray();
    }

    async addUser(user: User): Promise<number> {
        setLastUpdated(user);
        return await this.$db.users.add(user);
    }

    async addOrUpdateUser(user: User): Promise<number> {
        setLastUpdated(user);
        return await this.$db.users.put(user);
    }

    async deleteUser(userId: number): Promise<void> {
        return await this.$db.users.delete(userId);
    }

    filterSettings(filter: Record<string, any>): Promise<AppSetting[]> {
        return this.$db.appSettings.where(filter).toArray();
    }

    getSetting(userId: number, category: SettingsCategory, name: string): Promise<AppSetting | undefined> {
        return this.$db.appSettings.get([userId, category, name]);
    }

    async addOrUpdateSetting(setting: AppSetting): Promise<void> {
        setLastUpdated(setting);
        await this.$db.appSettings.put(setting);
    }

    bulkPutSettings(arr: AppSetting[], updateTS?: boolean): Promise<void> {
        if (updateTS !== false) {
            arr.forEach(setLastUpdated);
        }
        return this.$db.appSettings.bulkPut(arr);
    }

    async deleteSetting(userId: number, category: SettingsCategory, name: string): Promise<void> {
        return await this.$db.appSettings.delete([userId, category, name]);
    }

    async deleteAllSettingsWithUserId(userId: number): Promise<number> {
        return await this.$db.appSettings.where('userId').equals(userId).delete();
    }
}

function setLastUpdated(data: any, _ts?: number) {
    if (Array.isArray(data)) {
        data.forEach((d) => setLastUpdated(d, new Date().getTime()));
    } else {
        data._ts = _ts || new Date().getTime();
    }
}
