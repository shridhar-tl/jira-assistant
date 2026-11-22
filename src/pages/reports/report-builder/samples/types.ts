import type { ReportDefinition } from '@components/report-builder';
import type { ReportSample, ReportSampleCategory } from '@components/shared/report-gallery';

export type BuilderSampleCategory = 'sprints' | 'issues' | 'time' | 'releases';

export type BuilderSampleDefinition = Pick<ReportDefinition, 'datasources' | 'parameters' | 'components'> & Partial<Pick<ReportDefinition, 'variables'>>;

export interface BuilderSampleSubReport {
    key: string;
    title: string;
    description: string;
    definition: BuilderSampleDefinition & Pick<ReportDefinition, 'parentContext'>;
}

export interface BuilderSampleReport extends ReportSample<BuilderSampleDefinition, BuilderSampleCategory> {
    subReports?: BuilderSampleSubReport[];
}

export type BuilderSampleCategoryInfo = ReportSampleCategory<BuilderSampleCategory>;
