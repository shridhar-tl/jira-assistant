import { inject } from '../../../../services';
import { getBlankReportDefinition, usePivotConfig, useReportData } from '../store/pivot-config';

export function saveReport() {
    const { hasChanges, ...report } = usePivotConfig.getState();

    return saveReportToDb(report);
}

export function saveReportAs(queryName, copy) {
    const { hasChanges, ...report } = usePivotConfig.getState();
    report.queryName = queryName;

    if (copy) {
        delete report.id;
    }

    return saveReportToDb(report);
}

async function saveReportToDb(report) {
    const { id } = report;

    const { $report } = inject('ReportService');

    const newId = await $report.saveQuery(report, true);

    if (id === newId) {
        return false;
    }

    return $report.getReportDefinition(newId);
}

export async function loadReport(reportId) {
    if (!reportId) {
        usePivotConfig.setState(getBlankReportDefinition(), true);
        useReportData.setState({}, true);
        return;
    }

    const { $report } = inject('ReportService');
    const report = await $report.getReportDefinition(reportId);
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