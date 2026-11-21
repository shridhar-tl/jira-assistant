import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router';

import { inject } from '@services';

import { ReportGallery, type SampleReportItem, type SavedReportItem } from '@components';

import { getSampleReport, sampleCategories, sampleReports } from '../samples';
import type { JiraField, SavedPivotReport } from '../types';
import { deleteReport, getNewReportPath, getReportPath, getSampleReportPath } from '../utils/common';
import { fillFieldsList, useFieldsList } from '../utils/fields';
import { getRequirementTags, getStructureTags, getUnavailableFieldNames } from '../utils/report-summary';

const pageDescription =
    'Summarize your Jira issues, sprints and worklogs with rows and columns grouped the way you need. Open one of your reports, create a new one or start from a sample.';

const samplesHelpText =
    'Samples work with any Jira. They ask for the projects, boards or period while generating the report. A sample is saved as your own report only when you save it.';

export default function PivotReportHome() {
    const { userId = '' } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const savedReports = useSavedReports();
    const samples = useSampleItems();

    const createReport = useCallback(() => navigate(getNewReportPath(userId)), [navigate, userId]);
    const openReport = useCallback(({ id }: SavedReportItem) => navigate(getReportPath(userId, id)), [navigate, userId]);
    const openSample = useCallback(({ id }: SampleReportItem) => navigate(getSampleReportPath(userId, id)), [navigate, userId]);

    return (
        <ReportGallery
            title="Pivot reports"
            description={pageDescription}
            icon="fa-table-cells"
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

function toSavedReportItem(report: SavedPivotReport): SavedReportItem {
    const tags = [...getStructureTags(report), ...getRequirementTags(report)];
    const sampleTitle = getSampleReport(report.sampleId)?.title;

    if (sampleTitle) {
        tags.push({ icon: 'fa-wand-magic-sparkles', label: `From sample "${sampleTitle}"` });
    }

    return { id: report.id, name: report.queryName, dateCreated: report.dateCreated, dateUpdated: report.dateUpdated, tags };
}

function getTime(value?: Date | string) {
    return value ? new Date(value).getTime() || 0 : 0;
}

async function getSavedReportItems(): Promise<SavedReportItem[]> {
    const { $report } = inject('ReportService');
    const reports = await $report.getReportDefinitions<SavedPivotReport>('pivot');
    const sorted = [...reports].sort((a, b) => getTime(b.dateUpdated || b.dateCreated) - getTime(a.dateUpdated || a.dateCreated));

    return sorted.map(toSavedReportItem);
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

    const remove = useCallback(async ({ id, name }: SavedReportItem) => {
        if (await deleteReport(id, name)) {
            setItems(await getSavedReportItems());
        }
    }, []);

    return { items, remove };
}

function useSampleItems(): SampleReportItem[] {
    const [customFields, setCustomFields] = useState<JiraField[]>([]);
    const fieldsMap = useFieldsList(({ fieldsMap }) => fieldsMap);

    useEffect(() => {
        let active = true;

        fillFieldsList()
            .then((fields) => active && setCustomFields(fields))
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
                tags: getRequirementTags(definition, getUnavailableFieldNames(definition.fields, customFields, fieldsMap)),
            })),
        [customFields, fieldsMap],
    );
}
