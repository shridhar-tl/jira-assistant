import { createEmptyDefinition, type ReportDefinition } from '@components/report-builder';

import { loadJiraFields } from '../config/jira-fields';

import { resolveSampleFields } from './custom-fields';
import boardSprints from './reports/board-sprints';
import bugsByPriority from './reports/bugs-by-priority';
import componentHealth from './reports/component-health';
import createdVsResolved from './reports/created-vs-resolved';
import dueSoon from './reports/due-soon';
import effortByProject from './reports/effort-by-project';
import epicProgress from './reports/epic-progress';
import estimateVsActual from './reports/estimate-vs-actual';
import issueAging from './reports/issue-aging';
import labelsOverview from './reports/labels-overview';
import myOpenWork from './reports/my-open-work';
import myTimesheet from './reports/my-timesheet';
import openIssuesByStatus from './reports/open-issues-by-status';
import releaseScope from './reports/release-scope';
import sprintCarryOver from './reports/sprint-carry-over';
import sprintIssueMix from './reports/sprint-issue-mix';
import sprintStatusSummary from './reports/sprint-status-summary';
import sprintWorkload from './reports/sprint-workload';
import statusDrillDown from './reports/status-drill-down';
import teamTimesheet from './reports/team-timesheet';
import unassignedBacklog from './reports/unassigned-backlog';
import worklogDiary from './reports/worklog-diary';
import type { BuilderSampleCategoryInfo, BuilderSampleReport } from './types';

export const sampleCategories: BuilderSampleCategoryInfo[] = [
    { id: 'sprints', label: 'Sprints & agile', icon: 'fa-flag-checkered' },
    { id: 'issues', label: 'Issue tracking', icon: 'fa-list-check' },
    { id: 'time', label: 'Time tracking', icon: 'fa-clock' },
    { id: 'releases', label: 'Releases & epics', icon: 'fa-rocket' },
];

export const sampleReports: BuilderSampleReport[] = [
    sprintStatusSummary,
    sprintWorkload,
    sprintIssueMix,
    sprintCarryOver,
    boardSprints,
    openIssuesByStatus,
    statusDrillDown,
    myOpenWork,
    unassignedBacklog,
    issueAging,
    bugsByPriority,
    createdVsResolved,
    dueSoon,
    labelsOverview,
    myTimesheet,
    teamTimesheet,
    effortByProject,
    estimateVsActual,
    worklogDiary,
    releaseScope,
    epicProgress,
    componentHealth,
];

export function getSampleReport(sampleId?: string): BuilderSampleReport | undefined {
    return sampleId ? sampleReports.find(({ id }) => id === sampleId) : undefined;
}

/** A fresh definition of the sample, with its custom fields matched to the fields of the connected Jira. */
export async function createSampleDefinition(sample: BuilderSampleReport): Promise<ReportDefinition> {
    const base = createEmptyDefinition(sample.title);
    const definition: ReportDefinition = {
        ...base,
        metadata: { ...base.metadata, description: sample.description },
        ...structuredClone(sample.definition),
    };
    return resolveSampleFields(definition, await loadJiraFields());
}
