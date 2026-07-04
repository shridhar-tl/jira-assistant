import { EventCategory } from '@/constants';

import type AnalyticsService from './analytics-service';
import type SessionService from './session-service';
import type StorageService from './storage-service';

function UUID_generate(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function saveStringAs(content: string, extension: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default class ReportService {
    static dependencies = ['StorageService', 'SessionService', 'AnalyticsService'];

    private $storage: StorageService;
    private $session: SessionService;
    private $analytics: AnalyticsService;

    constructor($storage: StorageService, $session: SessionService, $analytics: AnalyticsService) {
        this.$storage = $storage;
        this.$session = $session;
        this.$analytics = $analytics;
    }

    deleteSavedQuery(ids: number[]): Promise<void> {
        return this.$storage.deleteReportsWithIds(ids);
    }

    deleteReport(reportId: number): Promise<void> {
        return this.$storage.deleteReportsWithIds([reportId]);
    }

    async exportQueries(ids: number[]): Promise<boolean> {
        const qrys = await this.$storage.getReportsWithIds(ids);
        await this.prepareDataForExport(qrys);

        const json = JSON.stringify({ exported: new Date(), reports: qrys });
        let fileName = qrys.length === 1 ? qrys[0].queryName : 'JA_Reports';
        fileName = `${fileName}_${new Date().format('yyyyMMdd')}.jrd`;
        saveStringAs(json, 'jrd', fileName);
        this.$analytics.trackEvent('Report definition exported', EventCategory.UserActions);
        return true;
    }

    async prepareDataForExport(qrys: any[]): Promise<any[]> {
        await Promise.all(qrys.filter((qry) => !qry.uniqueId).map((qry) => this.saveQuery(qry, true)));

        qrys.forEach((qry) => {
            delete qry.id;
            delete qry.createdBy;
        });

        return qrys;
    }

    async getReportsList(): Promise<any[]> {
        const qrys = await this.$storage.getReportsByUserId(this.$session.userId!);
        return qrys.map((q: any) => ({
            id: q.id,
            queryName: q.queryName,
            reportType: q.reportType || (q.advanced ? 'advanced' : 'custom'),
            dateCreated: q.dateCreated,
            advanced: q.advanced,
            outputCount: q.advanced ? null : q.outputFields?.length || q.fields?.length,
            isNew: !q.advanced && Array.isArray(q.fields),
        }));
    }

    getReportDefinition(id: number): Promise<any> {
        return this.$storage.getSingleReportById(id);
    }

    async saveQuery(query: any, noTrack?: boolean): Promise<number> {
        query.createdBy = this.$session.userId;
        let updateId = true;
        if (!query.uniqueId) {
            updateId = false;
            query.uniqueId = UUID_generate();
        }

        query.dateCreated = new Date();

        const reportId = query.id;
        const qry = await this.$storage.getReportByNameForValidation(query.queryName, this.$session.userId!, reportId);
        if (qry) {
            return Promise.reject({ message: `The query with the name "${query.queryName}" already exists!` });
        }

        let eventName;
        let finalReportId: number;
        if (reportId > 0) {
            if (updateId) {
                query.updateId = UUID_generate();
            }
            query.dateUpdated = new Date();
            await this.$storage.addOrUpdateReport(query);
            eventName = 'Report modified';
            finalReportId = reportId;
        } else {
            finalReportId = await this.$storage.addReport(query);
            eventName = 'Report created';
        }

        if (noTrack !== true) {
            this.$analytics.trackEvent(eventName, EventCategory.UserActions, query.advanced ? 'Report builder' : 'Custom report');
        }

        return finalReportId;
    }
}
