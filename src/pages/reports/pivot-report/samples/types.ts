import type { ReportSample, ReportSampleCategory } from '@components/shared/report-gallery';

import type { PivotReportDefinition } from '../types';

export type SampleCategory = 'sprints' | 'issues' | 'time' | 'releases';

export type SampleReportDefinition = Pick<PivotReportDefinition, 'dataSourceType' | 'jql' | 'fields' | 'sprintsParameter'>;

export type PivotSampleReport = ReportSample<SampleReportDefinition, SampleCategory>;

export type PivotSampleCategory = ReportSampleCategory<SampleCategory>;
