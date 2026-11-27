import { useCallback, useEffect, useMemo, useState } from 'react';

import GroupEditor from '@/dialogs/GroupEditor';
import { GadgetContainer, useBaseGadget } from '@/gadgets/BaseGadget';

import { inject } from '@services';

import { TabView, TabPage } from '@components';

import { getErrorMessage } from '@utils';


import ChartPanel from './ChartPanel';
import { fetchEstimateActualData, loadProjects, searchProjectInList } from './data-utils';
import SettingsPanel from './SettingsPanel';
import type { ChartState, DateRange, ProjectItem } from './types';

const reportErrorMessage = 'Unable to generate the report. Look at console log for more details';

export default function EstimateActualReport() {
    const { $session, $message, $usergroup } = useMemo(() => inject('SessionService', 'MessageService', 'UserGroupService'), []);

    const [selectedTab, setSelectedTab] = useState(0);
    const [groups, setGroups] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState<DateRange>({});
    const [projects, setProjects] = useState<ProjectItem[]>($session.CurrentUser.projects || []);
    const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
    const [filteredProjectsList, setFilteredProjectsList] = useState<ProjectItem[]>([]);
    const [ticketsList, setTicketsList] = useState('');
    const [estimationField, setEstimationField] = useState('timeoriginalestimate');
    const [storyPointHour, setStoryPointHour] = useState<number | null>(null);
    const [chartData, setChartData] = useState<ChartState>({ labels: [], datasets: [] });
    const [chartWidth, setChartWidth] = useState(0);
    const [showGroupsPopup, setShowGroupsPopup] = useState(false);

    const storyPointField = ($session.CurrentUser.storyPointField || ({} as any)).id;

    const gadgetHook = useBaseGadget({ isGadget: false }, { title: 'Estimate vs Actual report', hideMenu: true });
    const { setIsLoading } = gadgetHook;

    useEffect(() => {
        $usergroup.getUserGroups().then((g: any) => setGroups(g || []));
        loadProjects().then((list) => {
            setProjectsList(list);
            setFilteredProjectsList(list);
        });
    }, [$usergroup]);

    const disableGenerate = !dateRange?.fromDate || !groups?.length;

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        setChartData({ labels: [], datasets: [] });

        try {
            const result = await fetchEstimateActualData({
                dateRange,
                groups,
                projects,
                ticketsList,
                estimationField,
                storyPointHour,
            });

            setChartData(result.chartData);
            setChartWidth(result.chartWidth);
            setSelectedTab(1);
        } catch (err: unknown) {
            console.error('Error generating estimate vs actual report:', err);
            $message.error(getErrorMessage(err, reportErrorMessage), 'Estimate vs Actual');
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, $message, dateRange, groups, projects, ticketsList, estimationField, storyPointHour]);

    const handleGroupsChanged = useCallback((updatedGroups?: any[]) => {
        setShowGroupsPopup(false);
        if (updatedGroups) {
            setGroups(updatedGroups);
        }
    }, []);

    const handleProjectFilter = useCallback(
        (query: string) => {
            const filtered = searchProjectInList(projectsList, projects, query);
            setFilteredProjectsList(filtered);
        },
        [projectsList, projects],
    );

    const handleTabChange = useCallback((e: any) => {
        setSelectedTab(e.index);
    }, []);

    return (
        <>
            <div className="page-container">
                <GadgetContainer
                    isGadget={false}
                    gadgetHook={gadgetHook}
                    refreshData={refreshData}
                >
                    <TabView scrollable activeIndex={selectedTab} onTabChange={handleTabChange}>
                        <TabPage header="Settings">
                            <SettingsPanel
                                groups={groups}
                                dateRange={dateRange}
                                projects={projects}
                                projectsList={filteredProjectsList}
                                ticketsList={ticketsList}
                                estimationField={estimationField}
                                storyPointField={storyPointField}
                                storyPointHour={storyPointHour}
                                disableGenerate={disableGenerate}
                                onShowGroups={() => setShowGroupsPopup(true)}
                                onDateChange={setDateRange}
                                onProjectsChange={setProjects}
                                onTicketsChange={setTicketsList}
                                onEstimationFieldChange={setEstimationField}
                                onStoryPointHourChange={setStoryPointHour}
                                onGenerate={refreshData}
                                onProjectFilter={handleProjectFilter}
                            />
                        </TabPage>
                        <TabPage header="Chart" disabled={!chartData.datasets?.length}>
                            <ChartPanel chartData={chartData} chartWidth={chartWidth} />
                        </TabPage>
                    </TabView>
                </GadgetContainer>
            </div>

            {showGroupsPopup && <GroupEditor groups={groups} onHide={handleGroupsChanged} />}
        </>
    );
}
