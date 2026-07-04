import { inject } from '@services';

import { notifyReportsListChanged } from '@components/ReportSelectList';

import { getBlankReportDefinition, usePivotConfig, useReportData } from '../store/pivot-config';
import type { PivotReportDefinition } from '../types';

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

    return saveReportToDb(report);
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
    if (!reportId) {
        usePivotConfig.setState(getBlankReportDefinition(), true);
        useReportData.setState({ showParameters: false, isFetching: false, reportData: undefined, reportErrors: undefined }, true);
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

    usePivotConfig.setState(report, true);
}
