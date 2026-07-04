import { useEffect, useState } from 'react';

import { inject } from '@services';

import { LoadingSpinner } from '@components';

import { StatusWiseTimeSpentTable } from './StatusWiseTimeSpentTable';
import type { StatusInfo, StatusWiseTicket, StatusWiseTimeSpentProps } from './types';

export function StatusWiseTimeSpentContent({ jql, settings, settingsChanged, setLoader, onAddWorklog }: StatusWiseTimeSpentProps) {
    const [reportData, setReportData] = useState<StatusWiseTicket[]>([]);
    const [statusList, setStatusList] = useState<StatusInfo[]>([]);
    const [loading, setLoading] = useState(false);

    const { $jira, $session } = inject('JiraService', 'SessionService');

    useEffect(() => {
        fetchData();
    }, [jql]);

    const fetchData = async () => {
        const trimmedJql = jql?.trim();

        if (!trimmedJql) {
            setReportData([]);
            setStatusList([]);
            return;
        }

        if (setLoader) setLoader(true);
        setLoading(true);

        try {
            const { CurrentUser } = $session;
            const epicNameField = (CurrentUser as any)?.epicNameField?.id;
            const storyPointField = (CurrentUser as any)?.storyPointField?.id;

            const fieldNames = [
                'key',
                'summary',
                'project',
                'status',
                'parent',
                'assignee',
                'issuetype',
                'reporter',
                'created',
                'changeLog',
                'timeestimate',
                'aggregatetimeestimate',
                'timeoriginalestimate',
                'aggregatetimeoriginalestimate',
            ];

            if (epicNameField) fieldNames.push(epicNameField);
            if (storyPointField) fieldNames.push(storyPointField);

            const tickets = await $jira.searchTickets(trimmedJql, fieldNames, undefined, { expand: ['changelog'] });
            const currentTime = new Date().getTime();

            const processedData: StatusWiseTicket[] = tickets.map((t: any) => {
                const {
                    key,
                    changelog: { histories } = { histories: [] },
                    fields: {
                        summary,
                        status,
                        issuetype,
                        assignee,
                        reporter,
                        created,
                        project,
                        parent,
                        timeestimate,
                        aggregatetimeestimate,
                        timeoriginalestimate,
                        aggregatetimeoriginalestimate,
                        [epicNameField!]: epic,
                        [storyPointField!]: storyPoint,
                    },
                } = t;

                // Process changelog to calculate time spent in each status
                const changelog: any[] = [];
                for (let ix = histories.length - 1; ix >= 0; ix--) {
                    const { created: historyCreated, items } = histories[ix];

                    items
                        .filter((i: any) => i.field === 'status')
                        .forEach((i: any) => {
                            const { fromString: from, toString: to } = i;
                            changelog.push({
                                date: new Date(historyCreated).getTime(),
                                from,
                                to,
                            });
                        });
                }

                let prevTime = new Date(created).getTime();
                const statusData: Record<string, number> = {};

                changelog.forEach((change, i) => {
                    const { date, from, to } = change;
                    statusData[from] = (statusData[from] || 0) + (date - prevTime);
                    prevTime = date;

                    // For the last entry, add time up to current
                    if (i === changelog.length - 1) {
                        statusData[to] = (statusData[to] || 0) + (currentTime - prevTime);
                    }
                });

                // Remove zero values
                Object.keys(statusData).forEach((key) => {
                    if (!statusData[key]) {
                        delete statusData[key];
                    }
                });

                return {
                    key,
                    summary,
                    status,
                    issuetype,
                    assignee,
                    reporter,
                    created,
                    project,
                    parent,
                    timeestimate,
                    aggregatetimeestimate,
                    timeoriginalestimate,
                    aggregatetimeoriginalestimate,
                    statusData,
                    changelog,
                    epic,
                    storyPoint,
                };
            });

            // Get unique project keys
            const projectKeys = [...new Set(processedData.map((t) => t.project.key))];

            // Fetch statuses for all projects
            const statusesList = await getStatuses(projectKeys);

            setReportData(processedData);
            setStatusList(statusesList);
        } catch (error) {
            console.error('Error fetching status-wise time spent data:', error);
            setReportData([]);
            setStatusList([]);
        } finally {
            if (setLoader) setLoader(false);
            setLoading(false);
        }
    };

    const getStatuses = async (projectList: string[]): Promise<StatusInfo[]> => {
        try {
            const statusesByProject = await $jira.getProjectStatuses(projectList);
            const ids: string[] = [];
            const statusList: StatusInfo[] = [];

            statusesByProject.forEach((proj: any) => {
                proj.forEach((category: any) => {
                    category.statuses.forEach((status: any) => {
                        if (ids.includes(status.id)) {
                            return;
                        }
                        const { id, name, iconUrl } = status;
                        ids.push(id);
                        statusList.push({ name, iconUrl });
                    });
                });
            });

            return statusList;
        } catch (error) {
            console.error('Error fetching statuses:', error);
            return [];
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <StatusWiseTimeSpentTable
            data={reportData}
            statusList={statusList}
            settings={settings}
            onSettingsChanged={settingsChanged}
            onAddWorklog={onAddWorklog}
        />
    );
}
