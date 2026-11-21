import { inject } from '@services';

import { notifyReportsListChanged } from '@components/ReportSelectList';

import { getBlankReportDefinition, normalizeReportDefinition, usePivotConfig, useReportData, useSelectedItemConfig } from '../store/pivot-config';
import type { PivotReportDefinition } from '../types';
import { cancelReportGeneration } from '../viewer/generator';

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

export async function loadReport(reportId?: string) {
    cancelReportGeneration();
    useReportData.setState({ showParameters: false, isFetching: false, reportData: undefined, reportErrors: undefined }, true);
    useSelectedItemConfig.getState().selectItem();

    if (!reportId) {
        usePivotConfig.setState(getBlankReportDefinition(), true);
        return;
    }

    const { $report } = inject('ReportService');
    const report = await $report.getReportDefinition(parseInt(reportId));
    const { $message } = inject('MessageService');

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

    usePivotConfig.setState(normalizeReportDefinition(report), true);
}
