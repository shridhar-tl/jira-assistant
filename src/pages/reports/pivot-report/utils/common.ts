import { inject } from '@services';

import { notifyReportsListChanged } from '@components/ReportSelectList';

import { getBlankReportDefinition, normalizeReportDefinition, usePivotConfig, useReportData, useSelectedItemConfig } from '../store/pivot-config';
import { resetReportParameters } from '../store/report-parameters';
import type { PivotReportDefinition } from '../types';
import { cancelReportGeneration } from '../viewer/generator';

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

let latestLoadId = 0;

export async function loadReport(reportId?: string) {
    const loadId = ++latestLoadId;
    cancelReportGeneration();
    useReportData.setState({ showParameters: false, isFetching: false, reportData: undefined, reportErrors: undefined }, true);
    useSelectedItemConfig.getState().selectItem();
    resetReportParameters();

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
}
