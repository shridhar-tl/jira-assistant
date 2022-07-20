import { UUID, EventCategory } from "../_constants";
import { saveStringAs } from '../common/utils';

export default class ReportService {
    static dependencies = ["StorageService", "SessionService", "AnalyticsService"];

    constructor($storage, $session, $analytics) {
        this.$storage = $storage;
        this.$session = $session;
        this.$analytics = $analytics;
    }

    deleteSavedQuery(ids) { return this.deleteReportsWithIds(ids); }

    /* Commented as no reference exists for this method
    getSavedQueries(ids) { return this.$storage._getReportsWithIds(ids); }
    */

    exportQueries(ids) {
        return this.$storage.getReportsWithIds(ids).then((qrys) => Promise.all(qrys
            .filter(qry => !qry.uniqueId)
            .map(qry => this.saveQuery(qry)))
            .then(() => {
                qrys.forEach(qry => {
                    delete qry.id;
                    delete qry.createdBy;
                });
                const json = JSON.stringify({ exported: new Date(), reports: qrys });
                let fileName = qrys.length === 1 ? qrys[0].queryName : "JA_Reports";
                fileName = `${fileName}_${new Date().format('yyyyMMdd')}.jrd`;
                saveStringAs(json, "jrd", fileName);
                this.$analytics.trackEvent("Report definition exported", EventCategory.UserActions);
                return true;
            }));
    }

    getReportsList() {
        return this.$storage.getReportsByUserId(this.$session.userId)
            .then((qrys) => qrys.map((q) => ({
                id: q.id,
                queryName: q.queryName,
                dateCreated: q.dateCreated,
                advanced: q.advanced,
                outputCount: q.advanced ? null : (q.outputFields?.length || q.fields?.length),
                isNew: !q.advanced && Array.isArray(q.fields)
            })));
    }

    getReportDefinition(id) { return this.$storage.getSingleReportById(id); }

    async saveQuery(query) {
        query.createdBy = this.$session.userId;
        let updateId = true;
        if (!query.uniqueId) {
            updateId = false;
            query.uniqueId = UUID.generate();
        }

        query.dateCreated = new Date();

        let reportId = query.id;
        const qry = await this.$storage.getReportByNameForValidation(query.queryName, this.$session.userId, reportId);
        if (qry) {
            return Promise.reject({ message: `The query with the name "${query.queryName}" already exists!` });
        }

        let eventName;
        if (reportId > 0) {
            if (updateId) {
                query.updateId = UUID.generate();
            }
            query.dateUpdated = new Date();
            await this.$storage.addOrUpdateReport(query);
            eventName = "Report modified";
        }
        else {
            reportId = await this.$storage.addReport(query);
            eventName = "Report created";
        }

        this.$analytics.trackEvent(eventName, EventCategory.UserActions, query.advanced ? "Report builder" : "Custom report");
        return reportId;
    }
}