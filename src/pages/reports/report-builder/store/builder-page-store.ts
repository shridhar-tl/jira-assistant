import { create } from 'zustand';

import { inject } from '@services';

import { createEmptyDefinition, type AvailableSubReport, type ReportDefinition } from '@components/report-builder';
import { notifyReportsListChanged } from '@components/ReportSelectList';

import {
    builderReportType,
    listBuilderReports,
    loadBuilderReport,
    saveBuilderReport,
    toAvailableSubReports,
    type SavedBuilderReport,
} from '../report-store';
import { createSampleDefinition, getSampleReport } from '../samples';

export type BuilderPageMode = 'design' | 'view';

interface BuilderPageState {
    report: SavedBuilderReport;
    isDirty: boolean;
    isLoading: boolean;
    mode: BuilderPageMode;
    loadToken: number;
    subReports: AvailableSubReport[];
}

const untitledName = 'Untitled report';

let savedSnapshot = '';

function snapshotOf(definition: ReportDefinition): string {
    return JSON.stringify({ ...definition, metadata: { ...definition.metadata, updatedAt: undefined } });
}

function markSaved(definition: ReportDefinition): ReportDefinition {
    savedSnapshot = snapshotOf(definition);
    return definition;
}

function blankReport(): SavedBuilderReport {
    return { queryName: '', reportType: builderReportType, definition: markSaved(createEmptyDefinition(untitledName)) };
}

export const useBuilderPage = create<BuilderPageState>(() => ({
    report: blankReport(),
    isDirty: false,
    isLoading: false,
    mode: 'design',
    loadToken: 0,
    subReports: [],
}));

let latestLoad = 0;

export async function refreshSubReports(): Promise<void> {
    const reports = await listBuilderReports();
    useBuilderPage.setState(({ report }) => ({ subReports: toAvailableSubReports(reports, report.id) }));
}

export async function loadPageSample(sampleId: string): Promise<void> {
    const loadId = ++latestLoad;
    const sample = getSampleReport(sampleId);
    if (!sample) {
        const { $message } = inject('MessageService');
        $message.error(`The sample report "${sampleId}" does not exist.`, 'Sample not found');
        await loadPageReport(undefined);
        return;
    }

    useBuilderPage.setState({ isLoading: true });
    const definition = await createSampleDefinition(sample);
    if (loadId !== latestLoad) return;

    useBuilderPage.setState(({ loadToken }) => ({
        report: { queryName: sample.title, reportType: builderReportType, sampleId, definition: markSaved(definition) },
        isDirty: false,
        isLoading: false,
        mode: 'view',
        loadToken: loadToken + 1,
    }));
    await refreshSubReports();
}

export async function loadPageReport(reportId: number | undefined, keepMode?: boolean): Promise<void> {
    const loadId = ++latestLoad;
    if (!reportId) {
        useBuilderPage.setState(({ loadToken }) => ({
            report: blankReport(),
            isDirty: false,
            isLoading: false,
            mode: 'design',
            loadToken: loadToken + 1,
        }));
        await refreshSubReports();
        return;
    }

    useBuilderPage.setState({ isLoading: true });
    const report = await loadBuilderReport(reportId);
    if (loadId !== latestLoad) return;

    if (!report) {
        const { $message } = inject('MessageService');
        $message.error(`The report id "${reportId}" is invalid, is not a Report Builder report or has been deleted.`, 'Report not found');
        useBuilderPage.setState(({ loadToken }) => ({
            report: blankReport(),
            isDirty: false,
            isLoading: false,
            mode: 'design',
            loadToken: loadToken + 1,
        }));
        await refreshSubReports();
        return;
    }

    useBuilderPage.setState(({ loadToken, mode }) => ({
        report: { ...report, definition: markSaved(report.definition) },
        isDirty: false,
        isLoading: false,
        mode: keepMode ? mode : 'view',
        loadToken: loadToken + 1,
    }));
    await refreshSubReports();
}

export function updateDefinition(definition: ReportDefinition): void {
    useBuilderPage.setState(({ report }) =>
        report.definition === definition ? {} : { report: { ...report, definition }, isDirty: snapshotOf(definition) !== savedSnapshot },
    );
}

export function setPageMode(mode: BuilderPageMode): void {
    useBuilderPage.setState({ mode });
}

export async function savePageReport(queryName?: string, asCopy?: boolean): Promise<number> {
    const { report } = useBuilderPage.getState();
    const toSave: SavedBuilderReport = { ...report, queryName: queryName ?? report.queryName };
    if (asCopy) delete toSave.id;
    const id = await saveBuilderReport(toSave);
    useBuilderPage.setState({
        report: {
            ...toSave,
            id,
            definition: markSaved({ ...toSave.definition, metadata: { ...toSave.definition.metadata, title: toSave.queryName } }),
        },
        isDirty: false,
    });
    await refreshSubReports();
    return id;
}

export async function deletePageReport(): Promise<void> {
    const { report } = useBuilderPage.getState();
    if (!report.id) return;
    const { $report } = inject('ReportService');
    await $report.deleteReport(report.id);
    notifyReportsListChanged();
}
