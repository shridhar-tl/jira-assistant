import React, { useCallback, useEffect, useRef, useState } from 'react';

import GroupEditor from '@/dialogs/GroupEditor';
import { GadgetContainer, useBaseGadget } from '@/gadgets/BaseGadget';

import { inject } from '@services';

import { TabView, TabPage } from '@components';

import ChartPanel from './ChartPanel';
import { fetchEstimateActualData, loadProjects, searchProjectInList } from './data-utils';
import SettingsPanel from './SettingsPanel';
import type { ChartState, DateRange, ProjectItem } from './types';

export default function EstimateActualReport() {
    const { $session } = inject('SessionService');

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

    const $this = useRef<any>({});
    $this.current.groups = groups;
    $this.current.dateRange = dateRange;
    $this.current.projects = projects;
    $this.current.ticketsList = ticketsList;
    $this.current.estimationField = estimationField;
    $this.current.storyPointHour = storyPointHour;

    const gadgetHook = useBaseGadget({ isGadget: false }, { title: 'Estimate vs Actual report', hideMenu: true });
    const { setIsLoading } = gadgetHook;

    useEffect(() => {
        inject('UserGroupService')
            .$usergroup.getUserGroups()
            .then((g: any) => setGroups(g || []));
        loadProjects().then((list) => {
            setProjectsList(list);
            setFilteredProjectsList(list);
        });
    }, []);

    const validateData = useCallback(() => {
        const dr = $this.current.dateRange;
        const gr = $this.current.groups;
        return !dr?.fromDate || !gr?.length;
    }, []);

    const refreshData = useCallback(async () => {
        const cur = $this.current;
        setIsLoading(true);
        setChartData({ labels: [], datasets: [] });

        try {
            const result = await fetchEstimateActualData({
                dateRange: cur.dateRange,
                groups: cur.groups,
                projects: cur.projects,
                ticketsList: cur.ticketsList,
                estimationField: cur.estimationField,
                storyPointHour: cur.storyPointHour,
            });

            setChartData(result.chartData);
            setChartWidth(result.chartWidth);
            setSelectedTab(1);
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading]);

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
                    <TabView activeIndex={selectedTab} onTabChange={handleTabChange}>
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
                                disableGenerate={validateData()}
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
