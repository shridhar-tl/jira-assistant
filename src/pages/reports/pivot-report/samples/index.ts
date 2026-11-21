import activeSprintIssues from './reports/active-sprint-issues';
import activeSprintWorklogs from './reports/active-sprint-worklogs';
import bugsByComponent from './reports/bugs-by-component';
import commentActivity from './reports/comment-activity';
import dailyTimesheet from './reports/daily-timesheet';
import dueSoonByAssignee from './reports/due-soon-by-assignee';
import issuesCreatedWeekly from './reports/issues-created-weekly';
import labelsAcrossSprints from './reports/labels-across-sprints';
import openIssuesAging from './reports/open-issues-aging';
import openWorkByAssignee from './reports/open-work-by-assignee';
import releaseScope from './reports/release-scope';
import sprintStatusSummary from './reports/sprint-status-summary';
import sprintVelocity from './reports/sprint-velocity';
import storyPointsByParent from './reports/story-points-by-parent';
import teamOpenIssues from './reports/team-open-issues';
import unassignedBacklog from './reports/unassigned-backlog';
import weeklyEffortByParent from './reports/weekly-effort-by-parent';
import type { PivotSampleCategory, PivotSampleReport } from './types';

export const sampleCategories: PivotSampleCategory[] = [
    { id: 'sprints', label: 'Sprints & agile', icon: 'fa-flag-checkered' },
    { id: 'issues', label: 'Issue tracking', icon: 'fa-list-check' },
    { id: 'time', label: 'Time tracking', icon: 'fa-clock' },
    { id: 'releases', label: 'Releases & epics', icon: 'fa-rocket' },
];

export const sampleReports: PivotSampleReport[] = [
    sprintStatusSummary,
    sprintVelocity,
    labelsAcrossSprints,
    activeSprintIssues,
    openWorkByAssignee,
    teamOpenIssues,
    dueSoonByAssignee,
    openIssuesAging,
    unassignedBacklog,
    bugsByComponent,
    issuesCreatedWeekly,
    commentActivity,
    dailyTimesheet,
    weeklyEffortByParent,
    activeSprintWorklogs,
    releaseScope,
    storyPointsByParent,
];

export function getSampleReport(sampleId?: string): PivotSampleReport | undefined {
    return sampleId ? sampleReports.find(({ id }) => id === sampleId) : undefined;
}
