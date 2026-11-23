import { addDays, endOfDay, format, startOfDay, subDays } from 'date-fns';

import { EventCategory } from '@/constants/settings';
import { getUserName } from '@/utils/helpers';

import { inject } from '@services';

import { chartColours } from './chart-config';
import type { ChartDataset, ChartState, DateRange, FlatWorklogData, ProjectItem } from './types';

interface RefreshParams {
    dateRange: DateRange;
    groups: any[];
    projects: ProjectItem[];
    ticketsList: string;
    estimationField: string;
    storyPointHour: number | null;
}

interface RefreshResult {
    chartData: ChartState;
    chartWidth: number;
}

export async function fetchEstimateActualData(params: RefreshParams): Promise<RefreshResult> {
    const { $jira, $analytics } = inject('JiraService', 'AnalyticsService');

    const { dateRange, groups, estimationField, storyPointHour } = params;
    const { projects } = params;

    const fromDate = startOfDay(dateRange.fromDate!);
    const toDate = endOfDay(dateRange.toDate!);
    const fromDateMS = fromDate.getTime();
    const toDateMS = toDate.getTime();

    const users = groups.union((grps: any) => {
        grps.users.forEach((gu: any) => (gu.groupName = grps.name));
        return grps.users;
    });

    const uniqueUsers = users.distinctObj((u: any) => ({ name: getUserName(u, true), display: u.displayName }));
    const userList = uniqueUsers.map((u: any) => getUserName(u)!);
    const chartLabels = uniqueUsers.map((u: any) => u.display);

    const ticketsList = (params.ticketsList || '').trim().replace(/[\s;]/g, ',');
    const chartWidth = userList.length * 250;
    const custTicketsList = ticketsList
        ? ticketsList
              .split(',')
              .map((t: string) => t.trim().toUpperCase())
              .filter((t: string) => !!t)
        : [];

    const fromDateStr = format(subDays(fromDate, 1), 'yyyy-MM-dd');
    const toDateStr = format(addDays(toDate, 1), 'yyyy-MM-dd');

    let jql = `(worklogAuthor in ("${userList.join('","')}") and worklogDate >= '${fromDateStr}' and worklogDate <= '${toDateStr}') `;
    let addJql = '';
    let hasProject = projects && projects.length > 0;
    const hasTickets = custTicketsList.length > 0;

    if (hasProject) {
        addJql += `project in (${projects.map((p: ProjectItem) => p.key).join(',')}) `;
    }
    if (hasTickets) {
        if (addJql) {
            addJql += ' or ';
        }
        const tickets = custTicketsList.join(',');
        addJql += `key in (${tickets}) or parent in (${tickets})`;
    }
    if (addJql) {
        jql += ` and (${addJql})`;
    }

    const getEstimate = (obj: any) => {
        const value = Number(obj.fields[estimationField]) || 0;
        if (estimationField === 'timeoriginalestimate') {
            return value / 60 / 60;
        }
        return storyPointHour ? value * storyPointHour : value;
    };

    const issues = await $jira.searchTickets(jql, ['worklog', 'project', 'parent', estimationField]);

    $analytics.trackEvent('Estimate report viewed', EventCategory.UserActions);

    const flatData: FlatWorklogData[] = issues.flatten(
        {
            key: true,
            projectName: 'fields.project.name',
            projectKey: 'fields.project.key',
            parentkey: 'fields.parent.key',
            estimate: getEstimate,
            '~~worklog': {
                field: 'fields.worklog.worklogs',
                spread: false,
                props: {
                    '...author': (obj: any) => getUserName(obj.author, true),
                    date: (obj: any) => (obj.started ? new Date(obj.started) : null),
                    '...yyyyMMdd': (obj: any) => (obj.started ? parseInt(new Date(obj.started).format('yyyyMMdd')) : null),
                    timespent: (obj: any) => obj.timeSpentSeconds / 60 / 60,
                },
            },
        },
        (data: any) => userList.includes(data.author) && data.worklog.date.isBetween(fromDateMS, toDateMS),
    );

    if (estimationField !== 'timeoriginalestimate') {
        await applyParentEstimates(flatData, estimationField, getEstimate);
    }

    const ticketOf = (t: FlatWorklogData): string | undefined => custTicketsList.find((k: string) => k === t.key || k === t.parentkey);

    let selProjects = projects;
    if (!hasProject && !hasTickets) {
        hasProject = true;
        selProjects = flatData.distinctObj((t: FlatWorklogData) => ({ key: t.projectKey, name: t.projectName })) as any;
    }

    const datasets: ChartDataset[] = [];
    let colorIndex = -1;

    if (hasProject) {
        selProjects.forEach((proj: ProjectItem) => {
            colorIndex++;
            const projData = flatData.filter(
                (t: FlatWorklogData) => t.projectKey.toUpperCase() === proj.key.toUpperCase() && (!hasTickets || !ticketOf(t)),
            );
            const totals = userList.map((u: string) => getUserTotals(projData, u));

            datasets.push({ label: `${proj.name} (estimate)`, data: totals.map((t) => t.estimate), ...chartColours[colorIndex] });
            colorIndex++;
            datasets.push({ label: `${proj.name} (spent)`, data: totals.map((t) => t.actual), ...chartColours[colorIndex] });
        });
    }

    if (hasTickets) {
        flatData
            .filter((t: FlatWorklogData) => !!ticketOf(t))
            .groupBy((t: FlatWorklogData) => ticketOf(t)!)
            .forEach((ticket: { key: string; values: FlatWorklogData[] }) => {
                const totals = userList.map((u: string) => getUserTotals(ticket.values, u));
                datasets.push({
                    label: `${ticket.key} (estimate)`,
                    data: totals.map((t) => t.estimate || null),
                    backgroundColor: '',
                    borderColor: '',
                });
                datasets.push({
                    label: `${ticket.key} (spent)`,
                    data: totals.map((t) => t.actual || null),
                    backgroundColor: '',
                    borderColor: '',
                });
            });
    }

    return {
        chartData: { labels: chartLabels, datasets },
        chartWidth,
    };
}

/** Estimate of the distinct issues the user logged time on, and the time the user logged on them. */
function getUserTotals(rows: FlatWorklogData[], user: string): { estimate: number; actual: number } {
    const userRows = rows.filter((t) => t.author === user);
    const estimates = new Map<string, number>();
    userRows.forEach((t) => {
        if (!estimates.has(t.key)) {
            estimates.set(t.key, t.estimate || 0);
        }
    });
    return {
        estimate: [...estimates.values()].reduce((total, value) => total + value, 0),
        actual: userRows.reduce((total, t) => total + t.worklog.timespent, 0),
    };
}

/** Story points are set on the parent, so the time logged on a sub-task is counted for its parent with the estimate of the parent. */
async function applyParentEstimates(
    flatData: FlatWorklogData[],
    estimationField: string,
    getEstimate: (obj: any) => number,
): Promise<void> {
    const { $jira } = inject('JiraService');
    const estimates = new Map<string, number>();
    flatData.forEach((t) => {
        if (!t.parentkey && !estimates.has(t.key)) {
            estimates.set(t.key, t.estimate);
        }
    });

    const missingParents = [...new Set(flatData.map((t) => t.parentkey).filter((k): k is string => !!k && !estimates.has(k)))];
    if (missingParents.length) {
        const parents = await $jira.searchTickets(`key in (${missingParents.join(',')})`, ['project', estimationField]);
        parents.forEach((parent: any) => estimates.set(parent.key, getEstimate(parent)));
    }

    flatData.forEach((t) => {
        if (t.parentkey) {
            t.key = t.parentkey;
            delete t.parentkey;
            t.estimate = estimates.get(t.key) || 0;
        }
    });
}

export async function loadProjects(): Promise<ProjectItem[]> {
    const { $jira } = inject('JiraService');
    const projects = await $jira.getProjects();
    return projects.map((d: any) => ({ name: d.name, key: d.key, id: d.id })).orderBy((d: ProjectItem) => d.name);
}

export function searchProjectInList(
    projectsList: ProjectItem[],
    selectedProjects: ProjectItem[] | undefined,
    query: string,
): ProjectItem[] {
    query = (query || '').toLowerCase();
    return projectsList.filter(
        (r: ProjectItem) =>
            (r.name.toLowerCase().indexOf(query) >= 0 || r.key.toLowerCase().startsWith(query) || r.id.toString().startsWith(query)) &&
            (!selectedProjects || !selectedProjects.some((v: ProjectItem) => v.id === r.id)),
    );
}
