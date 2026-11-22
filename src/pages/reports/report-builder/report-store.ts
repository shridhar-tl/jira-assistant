import { inject } from '@services';

import type { AvailableSubReport, ReportComponent, ReportDefinition, SubReportComponentProps, SubReportHooks } from '@components/report-builder';
import { notifyReportsListChanged } from '@components/ReportSelectList';

import { createSampleSubReportDefinition, isSampleSubReportId } from './samples';

export const builderReportType = 'builder';

export interface SavedBuilderReport {
    id?: number;
    queryName: string;
    reportType: typeof builderReportType;
    definition: ReportDefinition;
    /** Id of the sample the report was created from. */
    sampleId?: string;
    uniqueId?: string;
    dateCreated?: Date;
    dateUpdated?: Date;
}

interface ReportListItem {
    id: number;
    queryName: string;
    reportType: string;
}

const duplicateNamePattern = /already exists/i;
const sampleSubReportReadOnly = 'This sub-report belongs to a sample. Save the sample as your own report first, then change its sub-report.';
const maxNameAttempts = 20;

export function isBuilderReport(value: unknown): value is SavedBuilderReport {
    const r = value as SavedBuilderReport | null;
    return !!r && r.reportType === builderReportType && !!r.definition && typeof r.definition === 'object';
}

export async function loadBuilderReport(id: number): Promise<SavedBuilderReport | null> {
    const { $report } = inject('ReportService');
    const report = await $report.getReportDefinition(id);
    return isBuilderReport(report) ? report : null;
}

export async function listBuilderReports(): Promise<ReportListItem[]> {
    const { $report } = inject('ReportService');
    const reports = (await $report.getReportsList()) as ReportListItem[];
    return reports.filter((r) => r.reportType === builderReportType).sort((a, b) => a.queryName.localeCompare(b.queryName));
}

export async function saveBuilderReport(report: SavedBuilderReport): Promise<number> {
    const { $report } = inject('ReportService');
    const toSave: SavedBuilderReport = {
        ...report,
        definition: {
            ...report.definition,
            metadata: { ...report.definition.metadata, title: report.queryName, updatedAt: new Date().toISOString() },
        },
    };
    const id = await $report.saveQuery(toSave);
    notifyReportsListChanged();
    return id;
}

async function saveWithUniqueName(definition: ReportDefinition): Promise<{ id: number; name: string }> {
    const baseName = definition.metadata.title?.trim() || 'Sub-report';
    for (let attempt = 1; attempt <= maxNameAttempts; attempt++) {
        const name = attempt === 1 ? baseName : `${baseName} ${attempt}`;
        try {
            const id = await saveBuilderReport({ queryName: name, reportType: builderReportType, definition });
            return { id, name };
        } catch (err) {
            const message = (err as { message?: string } | null)?.message ?? '';
            if (!duplicateNamePattern.test(message)) throw err;
        }
    }
    throw new Error(`Unable to find a free report name for "${baseName}".`);
}

export function toAvailableSubReports(reports: ReportListItem[], excludeId?: number): AvailableSubReport[] {
    return reports.filter((r) => r.id !== excludeId).map((r) => ({ id: String(r.id), label: r.queryName }));
}

export async function resolveSubReportDefinition(subReportId: string): Promise<ReportDefinition | null> {
    if (isSampleSubReportId(subReportId)) return createSampleSubReportDefinition(subReportId);
    const id = Number(subReportId);
    if (!Number.isFinite(id) || id <= 0) return null;
    return (await loadBuilderReport(id))?.definition ?? null;
}

function sampleSubReportIds(components: ReportComponent[], out = new Set<string>()): Set<string> {
    for (const component of components) {
        const subReportId = component.type === 'sub-report' ? (component.props as unknown as SubReportComponentProps).subReportId : undefined;
        if (subReportId && isSampleSubReportId(subReportId)) out.add(subReportId);
        if (component.children) sampleSubReportIds(component.children, out);
    }
    return out;
}

function replaceSubReportIds(components: ReportComponent[], savedIds: Map<string, string>): ReportComponent[] {
    return components.map((component) => {
        const props = component.props as unknown as SubReportComponentProps;
        const savedId = component.type === 'sub-report' ? savedIds.get(props.subReportId) : undefined;
        return {
            ...component,
            ...(savedId && { props: { ...component.props, subReportId: savedId } }),
            ...(component.children && { children: replaceSubReportIds(component.children, savedIds) }),
        };
    });
}

export async function saveSampleSubReports(definition: ReportDefinition): Promise<ReportDefinition> {
    const savedIds = new Map<string, string>();
    for (const subReportId of sampleSubReportIds(definition.components)) {
        const subReport = await createSampleSubReportDefinition(subReportId);
        if (!subReport) continue;
        const { id } = await saveWithUniqueName({ ...subReport, id: crypto.randomUUID() });
        savedIds.set(subReportId, String(id));
    }
    return savedIds.size === 0 ? definition : { ...definition, components: replaceSubReportIds(definition.components, savedIds) };
}

export function createSubReportHooks(onListChanged: () => void): Required<SubReportHooks> {
    return {
        resolveSubReport: resolveSubReportDefinition,
        onSaveSubReport: async (subReportId, definition) => {
            if (isSampleSubReportId(subReportId)) throw new Error(sampleSubReportReadOnly);
            const existing = await loadBuilderReport(Number(subReportId));
            if (!existing) throw new Error('The sub-report no longer exists.');
            await saveBuilderReport({ ...existing, definition });
            onListChanged();
        },
        onCreateSubReport: async (definition) => {
            const { id, name } = await saveWithUniqueName(definition);
            onListChanged();
            return { id: String(id), label: name };
        },
    };
}
