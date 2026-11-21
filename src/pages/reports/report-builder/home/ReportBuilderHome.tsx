import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router';

import { inject } from '@services';

import { ReportGallery, type ReportTag, type SampleReportItem, type SavedReportItem } from '@components';

import { notifyReportsListChanged } from '@components/ReportSelectList';

import { Dialog } from '@dialogs/CommonDialog';

import { loadJiraFields, type JiraFieldMeta } from '../config/jira-fields';
import { builderReportType, type SavedBuilderReport } from '../report-store';
import { getSampleReport, sampleCategories, sampleReports } from '../samples';
import { getMissingSampleFields } from '../samples/custom-fields';
import type { BuilderSampleDefinition } from '../samples/types';

const pageDescription =
    'Design reports with tables, charts and sub-reports from Jira issues, sprints, worklogs, files and more. Open one of your reports, create a new one or start from a sample.';

const samplesHelpText =
    'Samples work with any Jira. They ask for the projects, sprints, boards or period when they run. A sample is saved as your own report only when you save it.';

function countLabel(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function getStructureTags(definition: BuilderSampleDefinition): ReportTag[] {
    const tags: ReportTag[] = [
        { icon: 'fa-database', label: countLabel(definition.datasources.length, 'datasource') },
        { icon: 'fa-shapes', label: countLabel(definition.components.length, 'component') },
    ];
    if (definition.parameters.length > 0) {
        tags.push({
            icon: 'fa-sliders',
            label: countLabel(definition.parameters.length, 'parameter'),
            title: definition.parameters.map((p) => p.label).join(', '),
        });
    }
    return tags;
}

function getRequirementTags(definition: BuilderSampleDefinition, jiraFields: JiraFieldMeta[] | undefined): ReportTag[] {
    if (!jiraFields) return [];
    return getMissingSampleFields(definition, jiraFields).map((name): ReportTag => ({
        icon: 'fa-triangle-exclamation',
        label: `No "${name}" field`,
        title: `Your Jira has no "${name}" field, so its values stay empty in this report.`,
        tone: 'warning',
    }));
}

function getTime(value?: Date | string) {
    return value ? new Date(value).getTime() || 0 : 0;
}

function toSavedReportItem(report: SavedBuilderReport & { id: number }): SavedReportItem {
    const tags = getStructureTags(report.definition);
    const sampleTitle = getSampleReport(report.sampleId)?.title;
    if (sampleTitle) tags.push({ icon: 'fa-wand-magic-sparkles', label: `From sample "${sampleTitle}"` });
    return { id: report.id, name: report.queryName, dateCreated: report.dateCreated, dateUpdated: report.dateUpdated, tags };
}

async function getSavedReportItems(): Promise<SavedReportItem[]> {
    const { $report } = inject('ReportService');
    const reports = await $report.getReportDefinitions<SavedBuilderReport>(builderReportType);
    return reports
        .filter((r): r is SavedBuilderReport & { id: number } => typeof r.id === 'number' && !!r.definition)
        .sort((a, b) => getTime(b.dateUpdated || b.dateCreated) - getTime(a.dateUpdated || a.dateCreated))
        .map(toSavedReportItem);
}

function useSavedReports() {
    const [items, setItems] = useState<SavedReportItem[]>();

    useEffect(() => {
        let active = true;
        getSavedReportItems().then((list) => active && setItems(list));
        return () => {
            active = false;
        };
    }, []);

    const remove = useCallback(({ id, name }: SavedReportItem) => {
        Dialog.confirmDelete(`Are you sure to delete the report "${name}" permanently?`, 'Delete report').then(async () => {
            const { $report, $message } = inject('ReportService', 'MessageService');
            await $report.deleteReport(id);
            notifyReportsListChanged();
            $message.success('Report deleted successfully');
            setItems(await getSavedReportItems());
        });
    }, []);

    return { items, remove };
}

function useSampleItems(): SampleReportItem[] {
    const [jiraFields, setJiraFields] = useState<JiraFieldMeta[]>();

    useEffect(() => {
        let active = true;
        loadJiraFields()
            .then((list) => active && setJiraFields(list))
            .catch((err) => console.error('Unable to pull the fields to verify the sample reports', err));
        return () => {
            active = false;
        };
    }, []);

    return useMemo(
        () =>
            sampleReports.map(({ id, title, description, category, icon, definition }) => ({
                id,
                title,
                description,
                category,
                icon,
                tags: [...getStructureTags(definition), ...getRequirementTags(definition, jiraFields)],
            })),
        [jiraFields],
    );
}

export default function ReportBuilderHome() {
    const { userId = '' } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const savedReports = useSavedReports();
    const samples = useSampleItems();
    const basePath = `/${userId}/reports/builder`;

    const createReport = useCallback(() => navigate(`${basePath}/new`), [navigate, basePath]);
    const openReport = useCallback(({ id }: SavedReportItem) => navigate(`${basePath}/${id}`), [navigate, basePath]);
    const openSample = useCallback(({ id }: SampleReportItem) => navigate(`${basePath}/sample/${id}`), [navigate, basePath]);

    return (
        <ReportGallery
            title="Report Builder"
            description={pageDescription}
            icon="fa-pen-ruler"
            savedReports={savedReports.items}
            samples={samples}
            categories={sampleCategories}
            samplesHelpText={samplesHelpText}
            onCreate={createReport}
            onOpenReport={openReport}
            onDeleteReport={savedReports.remove}
            onOpenSample={openSample}
        />
    );
}
