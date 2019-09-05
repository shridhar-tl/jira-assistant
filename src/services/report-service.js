import { UUID } from "../_constants";
import { saveStringAs } from '../common/utils';

export default class ReportService {
    static dependencies = ["DatabaseService", "SessionService"];

    constructor($db, $session) {
        this.$db = $db;
        this.$session = $session;
    }

    deleteSavedQuery(ids) { return this.getSavedQueries(ids).delete(); }

    getSavedQueries(ids) { return this.$db.savedFilters.where("id").anyOf(ids); }

    exportQueries(ids) {
        return this.getSavedQueries(ids).toArray().then((qrys) => {
            return Promise.all(qrys
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
                    return true;
                });
        });
    }

    getReportsList() {
        return this.$db.savedFilters.where("createdBy").equals(this.$session.userId).toArray()
            .then((qrys) => {
                return qrys.map((q) => {
                    return {
                        id: q.id,
                        queryName: q.queryName,
                        dateCreated: q.dateCreated,
                        advanced: q.advanced,
                        filtersCount: q.advanced ? null : q.filterFields.length,
                        outputCount: q.advanced ? null : q.outputFields.length
                    };
                });
            });
    }

    getReportDefinition(id) { return this.$db.savedFilters.where("id").equals(parseInt(id)).first(); }

    saveQuery(query) {
        query.createdBy = this.$session.userId;
        let updateId = true;
        if (!query.uniqueId) {
            updateId = false;
            query.uniqueId = UUID.generate();
        }
        query.dateCreated = new Date();
        const existingQry = this.$db.savedFilters.where("queryName").equals(query.queryName);
        if (query.id > 0) {
            return existingQry.and((q) => { return q.createdBy === this.$session.userId && query.id !== q.id; })
                .first()
                .then((qry) => {
                    if (qry) {
                        return Promise.reject({ message: `The query with the name "${query.queryName}" already exists!` });
                    }
                    else {
                        if (updateId) {
                            query.updateId = UUID.generate();
                        }
                        query.dateUpdated = new Date();
                        return this.$db.savedFilters.put(query).then(() => { return query.id; });
                    }
                });
        }
        else {
            return existingQry.and((q) => { return q.createdBy === this.$session.userId; })
                .first()
                .then((qry) => {
                    if (qry) {
                        return Promise.reject({ message: `The query with the name "${query.queryName}" already exists!` });
                    }
                    else {
                        return this.$db.savedFilters.add(query).then((newQueryId) => { return newQueryId; });
                    }
                });
        }
    }
}