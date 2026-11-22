import { inject } from '@services';

import { notifyReportsListChanged } from '@components/ReportSelectList';

import { Dialog } from '@dialogs/CommonDialog';

import { getSampleReport } from '../samples';
import { getBlankReportDefinition, normalizeReportDefinition, usePivotConfig, useReportData, useSelectedItemConfig } from '../store/pivot-config';
import { resetReportParameters } from '../store/report-parameters';
import type { JiraField, PivotReportDefinition } from '../types';
import { cancelReportGeneration, generateReport } from '../viewer/generator';

import { resolveFieldReferences } from './field-references';
import { fillFieldsList } from './fields';

export async function saveReport() {
    const { hasChanges, ...report } = usePivotConfig.getState();

    return saveReportToDb(report);
}

export async function saveReportAs(queryName: string, copy?: boolean) {
    const { hasChanges, ...report } = usePivotConfig.getState();
    report.queryName = queryName;

    if (copy) {
        delete report.id;
    }

    const saved = await saveReportToDb(report);
    if (!copy && report.id) {
        usePivotConfig.setState({ queryName });
    }

    return saved;
}

async function saveReportToDb(report: PivotReportDefinition) {
    const { id } = report;

    const { $report } = inject('ReportService');

    const newId = await $report.saveQuery(report, true);
    notifyReportsListChanged();

    if (id === newId) {
        return false;
    }

    return $report.getReportDefinition(newId);
}

export function getReportsHomePath(userId: string) {
    return `/${userId}/reports/pivot`;
}

export function getReportPath(userId: string, reportId: number | string) {
    return `${getReportsHomePath(userId)}/${reportId}`;
}

export function getNewReportPath(userId: string) {
    return `${getReportsHomePath(userId)}/new`;
}

export function getSampleReportPath(userId: string, sampleId: string) {
    return `${getReportsHomePath(userId)}/sample/${sampleId}`;
}

export async function deleteReport(id: number, queryName: string): Promise<boolean> {
    try {
        await Dialog.confirmDelete(`Are you sure to delete the report named "${queryName}" permanently?`);
    } catch {
        return false;
    }

    const { $report, $message, $analytics } = inject('ReportService', 'MessageService', 'AnalyticsService');

    await $report.deleteSavedQuery([id]);
    notifyReportsListChanged();
    $message.success(`Pivot report "${queryName}" deleted successfully`);
    $analytics.trackEvent('Pivot Report Deleted', '');

    return true;
}

export interface ReportSource {
    reportId?: string;
    sampleId?: string;
}

let latestLoadId = 0;

export async function loadReport({ reportId, sampleId }: ReportSource) {
    const loadId = ++latestLoadId;
    cancelReportGeneration();
    useReportData.setState({ showParameters: false, isFetching: false, reportData: undefined, reportErrors: undefined }, true);
    useSelectedItemConfig.getState().selectItem();
    resetReportParameters();

    if (sampleId) {
        await loadSampleReport(sampleId, loadId);
        return;
    }

    if (!reportId) {
        usePivotConfig.setState(getBlankReportDefinition(), true);
        return;
    }

    const { $report, $message } = inject('ReportService', 'MessageService');
    const [report, customFields] = await Promise.all([$report.getReportDefinition(parseInt(reportId)), fillFieldsList()]);
    if (loadId !== latestLoadId) {
        return;
    }

    if (!report) {
        usePivotConfig.setState(getBlankReportDefinition(), true);
        $message.error(`The report id "${reportId}" is invalid or the report has been deleted.`, 'Report Not Found');
        return;
    }

    if (report.reportType !== 'pivot') {
        usePivotConfig.setState(getBlankReportDefinition(), true);
        $message.error(`The report "${report.queryName}" is not a valid Pivot Report.`, 'Report Incompatible');
        return;
    }

    const definition = normalizeReportDefinition(report);
    usePivotConfig.setState({ ...definition, fields: resolveFieldReferences(definition.fields, customFields) }, true);
    generateReport();
}

async function loadSampleReport(sampleId: string, loadId: number) {
    const sample = getSampleReport(sampleId);

    if (!sample) {
        usePivotConfig.setState(getBlankReportDefinition(), true);
        const { $message } = inject('MessageService');
        $message.error(`The sample report "${sampleId}" is not available.`, 'Sample Not Found');
        return;
    }

    let customFields: JiraField[];
    try {
        customFields = await fillFieldsList();
    } catch (err) {
        console.error('Unable to pull the fields of Jira to load the sample report', err);
        customFields = [];
    }

    if (loadId !== latestLoadId) {
        return;
    }

    const definition = normalizeReportDefinition({
        ...getBlankReportDefinition(),
        ...structuredClone(sample.definition),
        queryName: sample.title,
        sampleId: sample.id,
    });

    usePivotConfig.setState({ ...definition, fields: resolveFieldReferences(definition.fields, customFields) }, true);
    generateReport();
}
