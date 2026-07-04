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
    const custTicketsList = ticketsList ? ticketsList.split(',').filter((t: string) => !!t) : [];

    const fromDateStr = format(subDays(fromDate, 1), 'yyyy-MM-dd');
    const toDateStr = format(addDays(toDate, 1), 'yyyy-MM-dd');

    let jql = `(worklogAuthor in ("${userList.join('","')}") and worklogDate >= '${fromDateStr}' and worklogDate < '${toDateStr}') `;
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
        let estField = obj.fields[estimationField];
        if (estimationField === 'timeoriginalestimate') {
            estField = estField / 60 / 60;
        } else if (storyPointHour) {
            estField = estField * storyPointHour;
        }
        return estField;
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
        let parentIds: string[] = flatData.distinct((t: FlatWorklogData) => t.parentkey!);
        parentIds = parentIds.filter((t: string) => t && !flatData.some((ft: FlatWorklogData) => ft.key === t));

        if (parentIds.length) {
            const parents = await $jira.searchTickets(`key in (${parentIds.join(',')})`, ['project', estimationField]);
            const flatParents: Record<string, any> = parents
                .flatten({
                    key: true,
                    projectName: 'fields.project.name',
                    projectKey: 'fields.project.key',
                    estimate: getEstimate,
                })
                .reduce((index: Record<string, any>, ticket: any) => {
                    index[ticket.key] = ticket;
                    return index;
                }, {});

            flatData.forEach((t: FlatWorklogData) => {
                const { parentkey, key } = t;
                if (hasTickets && custTicketsList.includes(key)) {
                    return;
                }
                if (parentkey) {
                    let parentT = flatParents[parentkey];
                    if (!parentT) {
                        parentT = flatData.first((tkt: FlatWorklogData) => tkt.key === parentkey);
                        flatParents[parentkey] = parentT;
                    }
                    t.key = parentkey;
                    delete t.parentkey;
                    t.estimate = parentT?.estimate;
                }
            });
        }
    }

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
                (t: FlatWorklogData) =>
                    t.projectKey.toUpperCase() === proj.key.toUpperCase() && (!hasTickets || !custTicketsList.includes(t.key)),
            );

            const estimateUserData: (number | null)[] = [];
            const actUserData: (number | null)[] = [];

            const estimatePrj: ChartDataset = {
                label: `${proj.name} (estimate)`,
                data: estimateUserData,
                ...chartColours[colorIndex],
            };

            colorIndex++;
            const actPrj: ChartDataset = {
                label: `${proj.name} (spent)`,
                data: actUserData,
                ...chartColours[colorIndex],
            };

            userList.forEach((u: string) => {
                const usrData = projData.filter((t: FlatWorklogData) => t.author === u);
                const tktGrp = usrData.groupBy((t: FlatWorklogData) => t.key);
                const estimate = tktGrp.sum((g: any) => g.values[0].estimate);
                const actual = tktGrp.sum((g: any) => g.values.sum((t: any) => t.worklog.timespent));
                estimateUserData.push(estimate);
                actUserData.push(actual);
            });

            datasets.push(estimatePrj);
            datasets.push(actPrj);
        });
    }

    if (hasTickets) {
        const ticketData = flatData.filter(
            (t: FlatWorklogData) => custTicketsList.includes(t.parentkey!) || custTicketsList.includes(t.key),
        );

        ticketData.forEach((t: FlatWorklogData) => {
            if (custTicketsList.includes(t.key)) {
                return;
            }
            t.key = t.parentkey!;
        });

        ticketData
            .groupBy((t: FlatWorklogData) => t.key)
            .forEach((ticket: any) => {
                const projData = ticket.values;
                const estimateUserData: (number | null)[] = [];
                const actUserData: (number | null)[] = [];

                const estimatePrj: ChartDataset = {
                    label: `${ticket.key} (estimate)`,
                    data: estimateUserData,
                    backgroundColor: '',
                    borderColor: '',
                };
                const actPrj: ChartDataset = {
                    label: `${ticket.key} (spent)`,
                    data: actUserData,
                    backgroundColor: '',
                    borderColor: '',
                };

                userList.forEach((u: string) => {
                    const usrData = projData.filter((t: FlatWorklogData) => t.author === u);
                    const tktGrp = usrData.groupBy((t: FlatWorklogData) => t.key);
                    let estimate: number | null = tktGrp.sum((g: any) => g.values[0].estimate);
                    let actual: number | null = tktGrp.sum((g: any) => g.values.sum((t: any) => t.worklog.timespent));
                    if (!estimate) {
                        estimate = null;
                    }
                    if (!actual) {
                        actual = null;
                    }
                    estimateUserData.push(estimate);
                    actUserData.push(actual);
                });

                datasets.push(estimatePrj);
                datasets.push(actPrj);
            });
    }

    return {
        chartData: { labels: chartLabels, datasets },
        chartWidth,
    };
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
