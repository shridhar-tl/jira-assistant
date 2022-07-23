export default class StorageService {
    // This class gets proxied when accessed as webapp
    // When new method is added or method name is changed in this class, this list has to be updated with the method name
    static availableMethods = "getPendingWorlogByUserId,getWorklogsWithIds,getSingleWorklogWithId,getWorklogsBetween,addOrUpdateWorklog,"
        + "addWorklog,deleteWorklog,getReportsWithIds,getReportsByUserId,getSingleReportById,getReportByNameForValidation,addOrUpdateReport,addReport,"
        + "deleteReportsWithIds,getAllUsers,getUser,getUserWithNameAndJiraUrl,getUserWithEmailAndJiraUrl,addUser,addOrUpdateUser,deleteUser,"
        //+ "setCache,getCache,removeCache,clearCache,getAllCachedValues"
        + "filterSettings,getSetting,addOrUpdateSetting,bulkPutSettings,deleteSetting,deleteAllSettingsWithUserId";

    static dependencies = ["DatabaseService"];

    constructor($db) {
        this.$db = $db;
    }

    //#region Worklog table operations
    getPendingWorlogByUserId(userId) {
        return this.$db.worklogs.where("createdBy").equals(userId).and((w) => !w.isUploaded).toArray();
    }

    getWorklogsWithIds(ids) {
        return this.$db.worklogs.where("id").anyOf(ids).toArray();
    }

    getSingleWorklogWithId(id) {
        return this.$db.worklogs.where("id").equals(parseInt(id)).first();
    }

    getWorklogsBetween(fromDate, toDate, userId) {
        return this.$db.worklogs.where("dateStarted").between(fromDate, toDate, true, true)
            .and((w) => w.createdBy === userId).toArray();
    }

    async addOrUpdateWorklog(entry) {
        return await this.$db.worklogs.put(entry);
    }

    async addWorklog(entry) {
        return await this.$db.worklogs.add(entry);
    }

    deleteWorklog(id) {
        return this.$db.worklogs.delete(id);
    }

    /* Commented as no reference was found
    deleteWorklogsBefore(date) {
        return this.$db.worklogs.where("dateStarted").below(date).delete();
    }*/

    //#endregion

    //#region savedFilters table operations
    _getReportsWithIds(ids) {
        return this.$db.savedFilters.where("id").anyOf(ids);
    }

    getReportsWithIds(ids) {
        return this._getReportsWithIds(ids).toArray();
    }

    getReportsByUserId(userId) {
        return this.$db.savedFilters.where("createdBy").equals(userId).toArray();
    }

    getSingleReportById(id) {
        return this.$db.savedFilters.where("id").equals(parseInt(id)).first();
    }

    getReportByNameForValidation(name, userId, excludeId) {
        excludeId = parseInt(excludeId);
        const filter = excludeId > 0 ?
            (q) => q.createdBy === userId && excludeId !== q.id
            : (q) => q.createdBy === userId;

        return this.$db.savedFilters.where("queryName")
            .equals(name).and(filter).first();
    }

    async addOrUpdateReport(report) {
        return await this.$db.savedFilters.put(report);
    }

    async addReport(report) {
        return await this.$db.savedFilters.add(report);
    }

    deleteReportsWithIds(ids) {
        return this._getReportsWithIds(ids).delete();
    }
    //#endregion

    //#region user table operations
    getAllUsers() { return this.$db.users.toArray(); }

    getUser(userId) { return this.$db.users.get(userId); }

    getUserWithNameAndJiraUrl(name, url) {
        url = url.toLowerCase();

        return this.$db.users.where("userId").equalsIgnoreCase(name)
            .and((u) => u.jiraUrl.toLowerCase() === url).first();
    }

    getUserWithEmailAndJiraUrl(email, url) {
        email = email.toLowerCase();
        url = url.toLowerCase();

        return this.$db.users
            .filter((u) => (u.email || "").toLowerCase() === email && u.jiraUrl.toLowerCase() === url).first();
    }

    async addUser(user) { return await this.$db.users.add(user); }
    async addOrUpdateUser(user) { return await this.$db.users.put(user); }
    async deleteUser(userId) { return await this.$db.users.delete(userId); }
    //#endregion

    //#region appsettings table operations
    filterSettings(filter) {
        return this.$db.appSettings.where(filter).toArray();
    }

    getSetting(userId, category, name) {
        return this.$db.appSettings.get([userId, category, name]);
    }

    addOrUpdateSetting(setting) {
        return this.$db.appSettings.put(setting);
    }

    bulkPutSettings(arr) {
        return this.$db.appSettings.bulkPut(arr);
    }

    deleteSetting(userId, category, id) {
        return this.$db.appSettings.delete([userId, category, id]);
    }

    deleteAllSettingsWithUserId(userId) {
        return this.$db.appSettings.where({ userId }).delete();
    }
    //#endregion

    /*
    //#region Local cache storage operations
    // All thesese functions are async considering the futurestic perspective of using API calls instead
    // if this data has to be synced, then sync only items which do not have expires property
    async setCache(key, value, expires, raw) {
        return set(localStorage, key, value, expires, raw);
    }

    async getCache(key, raw) {
        return get(localStorage, key, raw);
    }

    async removeCache(key) {
        return this.setCache(key, null, null);
    }

    async clearCache() {
        localStorage.clear();
    }

    getAllCachedValues() {
        return new Promise((resolve) => {
            const len = localStorage.length;
            const result = {};
            for (let i = 0; i < len; i++) {
                const key = localStorage.key(i);
                result[key] = get(localStorage, key, true);
            }
            resolve(result);
        });
    }
    //#endregion
    */
}
