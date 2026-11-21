import type { ReportDefinition } from '@components/report-builder';
import type { ReportSample, ReportSampleCategory } from '@components/shared/report-gallery';


export type BuilderSampleCategory = 'sprints' | 'issues' | 'time' | 'releases';

export type BuilderSampleDefinition = Pick<ReportDefinition, 'datasources' | 'parameters' | 'components'>;

export type BuilderSampleReport = ReportSample<BuilderSampleDefinition, BuilderSampleCategory>;

export type BuilderSampleCategoryInfo = ReportSampleCategory<BuilderSampleCategory>;
