import { useCallback, useEffect, useRef, useState } from 'react';

import { RapidView } from '@/components/shared/RapidViewList';
import { Sprint } from '@/components/shared/SprintList';

import { inject } from '@services';

import { Button, Checkbox, RapidViewList, SprintList, TabPage, TabView } from '@components';

import { distinct, getErrorMessage, isValidDate, parseISOString, union } from '@utils';

import type { Issue } from '@types';

import { EventCategory } from '@constants';

import { ExportFormat } from '../../../common/Exporter';
import GroupEditor from '../../../dialogs/GroupEditor';
import { GadgetContainer, useBaseGadget, type BaseGadgetProps } from '../../../gadgets/BaseGadget';

import { detectEstimateUnit, roundEstimate, toEstimateValue } from './estimate-unit';
import SprintReportInfo from './ReportInfo';
import { parseSprintCloser } from './sprint-closer';
import SprintWiseWorklog from './SprintWiseWorklog';
import SummaryView1 from './SummaryView1';
import SummaryView2 from './SummaryView2';
import VelocityChart from './VelocityChart';

interface SprintReportIssue {
    key: string;
}

interface SprintReportDetails {
    contents: {
        completedIssues: SprintReportIssue[];
        puntedIssues: SprintReportIssue[];
        issuesNotCompletedInCurrentSprint: SprintReportIssue[];
    };
}

interface SprintReportData {
    sprintDetails: SprintReportDetails[];
    ticketDetails?: Issue[];
}

const reportErrorMessage = 'Unable to generate the report. Look at console log for more details';

const gadgetConfig = {
    title: 'Sprint report',
    hideCSVExport: true,
    exportFormat: ExportFormat,
};

function SprintReport(props: BaseGadgetProps) {
    const gadgetHook = useBaseGadget({ ...props, isGadget: false }, gadgetConfig);
    const { setIsLoading, setDisableRefresh } = gadgetHook;

    const { $jira, $userutils, $session, $usergroup, $analytics, $message } = inject(
        'JiraService',
        'UserUtilsService',
        'SessionService',
        'UserGroupService',
        'AnalyticsService',
        'MessageService',
    );

    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedRapidViews, setSelectedRapidViews] = useState<any[]>($session.CurrentUser?.rapidViews || []);
    const [selectedSprints, setSelectedSprints] = useState<Sprint[]>([]);
    const [includeWorklogs, setIncludeWorklogs] = useState(false);
    const [sprintDetails, setSprintDetails] = useState<any[] | null>(null);
    const [worklogDetails, setWorklogDetails] = useState<any[] | undefined>(undefined);
    const [groups, setGroups] = useState<any[]>([]);
    const [showGroupsPopup, setShowGroupsPopup] = useState(false);
    const sprintCacheRef = useRef<Map<string, any>>(new Map());

    useEffect(() => {
        $usergroup.getUserGroups().then((g: any) => setGroups(g));
    }, [$usergroup]);

    const formatDateTime = useCallback(
        (isoValue?: string) => {
            const date = isoValue ? parseISOString(isoValue) : undefined;
            return date && isValidDate(date) ? $userutils.formatDateTime(date) : '';
        },
        [$userutils],
    );

    const refreshData = useCallback(() => {
        if (!selectedSprints || selectedSprints.length === 0) {
            return;
        }

        setIsLoading(true);

        const cache = sprintCacheRef.current;
        const arr = selectedSprints.map((sprint) => {
            const cacheKey = `${sprint.rapidId}_${sprint.id}`;
            if (cache.has(cacheKey)) {
                return Promise.resolve(cache.get(cacheKey));
            }
            return $jira.getRapidSprintDetails(sprint.rapidId, sprint.id).then((det: any) => {
                cache.set(cacheKey, det);
                return det;
            });
        });

        Promise.all(arr)
            .then((result): SprintReportData | Promise<SprintReportData> => {
                $analytics.trackEvent('Sprint report viewed', EventCategory.UserActions);

                if (includeWorklogs) {
                    const ticketKeys = distinct(
                        union(result, (spr: SprintReportDetails) => [
                            ...spr.contents.completedIssues,
                            ...spr.contents.puntedIssues,
                            ...spr.contents.issuesNotCompletedInCurrentSprint,
                        ]),
                        (t: SprintReportIssue) => t.key,
                    );
                    if (!ticketKeys.length) {
                        return { sprintDetails: result, ticketDetails: [] };
                    }
                    const keys = ticketKeys.join(',');
                    return $jira
                        .searchTickets(`key in (${keys}) or parent in (${keys})`, [
                            'summary',
                            'worklog',
                            'issuetype',
                            'parent',
                            'timeoriginalestimate',
                        ])
                        .then((tickets: Issue[]) => ({ sprintDetails: result, ticketDetails: tickets }));
                }
                return { sprintDetails: result };
            })
            .then((data: SprintReportData) => {
                const result = data.sprintDetails;
                const getCountWithSP = (issues: any[]) =>
                    issues.filter((issue) => ((issue.currentEstimateStatistic || {}).statFieldValue || {}).value).length;

                result.forEach((sprint: any) => {
                    const unit = detectEstimateUnit([
                        ...sprint.contents.completedIssues,
                        ...sprint.contents.puntedIssues,
                        ...sprint.contents.issuesNotCompletedInCurrentSprint,
                    ]);
                    const toValue = (statistic?: { value?: number } | null) => toEstimateValue(unit, statistic?.value);
                    sprint.estimateUnit = unit;
                    let added = 0;
                    let addedWithSP = 0;
                    const jiraKeysList = sprint.contents.issueKeysAddedDuringSprint;
                    const keys = Object.keys(jiraKeysList);
                    keys.forEach((key) => {
                        if (jiraKeysList[key] === true) {
                            added += 1;
                        }
                    });

                    let addedSP = 0;
                    let addedSPOld = 0;
                    const processAdded = (issue: any) => {
                        issue.addedLater = jiraKeysList[issue.key] === true;
                        issue.removedLater = jiraKeysList[issue.key] === false;
                        issue.currentSP = toValue(issue.currentEstimateStatistic?.statFieldValue);
                        issue.oldSP = toValue(issue.estimateStatistic?.statFieldValue);
                        if (issue.addedLater) {
                            addedSP += issue.currentSP;
                            addedSPOld += issue.oldSP;
                        }
                        if (issue.oldSP === issue.currentSP) {
                            delete issue.oldSP;
                            if (!issue.currentSP) {
                                delete issue.currentSP;
                            }
                        }
                        if (issue.currentSP && issue.addedLater) {
                            addedWithSP += 1;
                        }
                    };
                    sprint.contents.completedIssues.forEach(processAdded);
                    sprint.contents.puntedIssues.forEach(processAdded);
                    sprint.contents.issuesNotCompletedInCurrentSprint.forEach(processAdded);
                    addedSP = roundEstimate(addedSP);
                    addedSPOld = roundEstimate(addedSPOld);
                    sprint.addedSP = addedSP || '';
                    sprint.addedSPOld = addedSPOld && addedSPOld !== addedSP ? addedSPOld : null;
                    const completedModified = toValue(sprint.contents.completedIssuesInitialEstimateSum);
                    const completed = toValue(sprint.contents.completedIssuesEstimateSum);
                    sprint.completedSP = completed || '';
                    sprint.completedSPOld = completedModified && completedModified !== completed ? completedModified : null;
                    sprint.completedWithSP = getCountWithSP(sprint.contents.completedIssues);
                    sprint.CompletedTotal = sprint.contents.completedIssues.length;
                    const incompletedModified = toValue(sprint.contents.issuesNotCompletedInitialEstimateSum);
                    const incompleted = toValue(sprint.contents.issuesNotCompletedEstimateSum) || '';
                    sprint.incompletedSP = incompleted;
                    sprint.incompletedSPOld = incompletedModified && incompletedModified !== incompleted ? incompletedModified : null;
                    sprint.incompletedWithSP = getCountWithSP(sprint.contents.issuesNotCompletedInCurrentSprint);
                    sprint.incompletedTotal = sprint.contents.issuesNotCompletedInCurrentSprint.length;
                    const removedModified = toValue(sprint.contents.puntedIssuesInitialEstimateSum);
                    const removed = toValue(sprint.contents.puntedIssuesEstimateSum) || '';
                    sprint.removedSP = removed;
                    sprint.removedSPOld = removedModified && removedModified !== removed ? removedModified : null;
                    sprint.removedWithSP = getCountWithSP(sprint.contents.puntedIssues);
                    sprint.removedTotal = sprint.contents.puntedIssues.length;
                    sprint.addedIssues = added;
                    sprint.addedWithSP = addedWithSP;
                    sprint.removedIssues = removed;
                    const totalSPOld = roundEstimate(
                        (sprint.completedSPOld ?? (sprint.completedSP || 0)) + (sprint.incompletedSPOld ?? (sprint.incompletedSP || 0)),
                    );
                    sprint.totalIssuesSPOld = totalSPOld;
                    sprint.totalIssuesSP = roundEstimate((sprint.completedSP || 0) + (sprint.incompletedSP || 0));
                    sprint.totalIssuesCount = sprint.CompletedTotal + sprint.incompletedTotal;
                    sprint.totalIssuesWithSP = sprint.completedWithSP + sprint.incompletedWithSP;
                    if (sprint.totalIssuesSPOld === sprint.totalIssuesSP) {
                        delete sprint.totalIssuesSPOld;
                        if (!sprint.totalIssuesSP) {
                            delete sprint.totalIssuesSP;
                        }
                    }
                    sprint.estimateIssuesSPOld = roundEstimate(
                        totalSPOld + (sprint.removedSPOld ?? (sprint.removedSP || 0)) - (sprint.addedSPOld ?? (sprint.addedSP || 0)),
                    );
                    if (sprint.estimateIssuesSPOld < 0) {
                        sprint.estimateIssuesSPOld = 0;
                    }
                    sprint.estimateIssuesSP = roundEstimate(
                        (sprint.completedSP || 0) + (sprint.incompletedSP || 0) + (sprint.removedSP || 0) - (sprint.addedSP || 0),
                    );
                    sprint.estimateIssuesCount = sprint.CompletedTotal + sprint.incompletedTotal + sprint.removedTotal - sprint.addedIssues;
                    sprint.estimateIssuesWithSP =
                        sprint.completedWithSP + sprint.incompletedWithSP + sprint.removedWithSP - sprint.addedWithSP;
                    if (sprint.estimateIssuesSPOld === sprint.estimateIssuesSP) {
                        delete sprint.estimateIssuesSPOld;
                        if (!sprint.estimateIssuesSP) {
                            delete sprint.estimateIssuesSP;
                        }
                    }
                    sprint.expanded = result.length === 1;
                    if (sprint.lastUserToClose) {
                        sprint.lastUserToClose = parseSprintCloser(sprint.lastUserToClose, $userutils.mapJiraUrl);
                    }
                });

                setIsLoading(false);
                setDisableRefresh(false);
                setWorklogDetails(data.ticketDetails);
                setSelectedTab(1);
                setSprintDetails(result);
            })
            .catch((err: unknown) => {
                console.error('Error generating sprint report:', err);
                setIsLoading(false);
                $message.error(getErrorMessage(err, reportErrorMessage), 'Sprint report');
            });
    }, [selectedSprints, includeWorklogs, $jira, $analytics, $userutils, $message, setIsLoading, setDisableRefresh]);

    const sprintCount = sprintDetails ? sprintDetails.length : 0;
    const isReportDataReady = sprintDetails && sprintCount > 0;

    const handleUpdateGroup = useCallback((updatedGroups?: any[]) => {
        if (updatedGroups) {
            setGroups(updatedGroups);
        }
        setShowGroupsPopup(false);
    }, []);

    const canGenerate = selectedSprints && selectedSprints.length > 0;

    return (
        <GadgetContainer
            {...props}
            isGadget={false}
            gadgetHook={gadgetHook}
            refreshData={refreshData}
        >
            <div className="flex flex-col h-full">
                <TabView activeIndex={selectedTab} onTabChange={(e) => setSelectedTab(e.index)} preMount>
                    <TabPage header="Settings">
                        <SettingsTab
                            isReportDataReady={!!isReportDataReady}
                            selectedRapidViews={selectedRapidViews}
                            selectedSprints={selectedSprints}
                            includeWorklogs={includeWorklogs}
                            canGenerate={!!canGenerate}
                            onRapidViewChange={setSelectedRapidViews}
                            onSprintChange={setSelectedSprints}
                            onIncludeWorklogChange={setIncludeWorklogs}
                            onShowGroups={() => setShowGroupsPopup(true)}
                            onGenerate={refreshData}
                        />
                    </TabPage>
                    <TabPage header="Summary View 1" disabled={!isReportDataReady}>
                        {sprintDetails && <SummaryView1 sprintDetails={sprintDetails} formatDateTime={formatDateTime} />}
                    </TabPage>
                    <TabPage header="Summary View 2" disabled={!isReportDataReady}>
                        {sprintDetails && <SummaryView2 sprintDetails={sprintDetails} formatDateTime={formatDateTime} />}
                    </TabPage>
                    <TabPage header="Velocity Chart" disabled={!isReportDataReady || sprintCount < 2}>
                        {sprintDetails && <VelocityChart sprintDetails={sprintDetails} />}
                    </TabPage>
                    <TabPage header="Worklog Details" disabled={!isReportDataReady || !includeWorklogs}>
                        {includeWorklogs && (
                            <SprintWiseWorklog groups={groups} ticketDetails={worklogDetails} sprintDetails={sprintDetails} />
                        )}
                    </TabPage>
                </TabView>
            </div>
            {showGroupsPopup && <GroupEditor groups={groups} onHide={handleUpdateGroup} />}
        </GadgetContainer>
    );
}

interface SettingsTabProps {
    isReportDataReady: boolean;
    selectedRapidViews: any[];
    selectedSprints: Sprint[];
    includeWorklogs: boolean;
    canGenerate: boolean;
    onRapidViewChange: (val: RapidView[]) => void;
    onSprintChange: (val: any[]) => void;
    onIncludeWorklogChange: (val: boolean) => void;
    onShowGroups: () => void;
    onGenerate: () => void;
}

function SettingsTab({
    isReportDataReady,
    selectedRapidViews,
    selectedSprints,
    includeWorklogs,
    canGenerate,
    onRapidViewChange,
    onSprintChange,
    onIncludeWorklogChange,
    onShowGroups,
    onGenerate,
}: SettingsTabProps) {
    return (
        <>
            <SprintReportInfo />
            <div className={`px-6 pb-6 space-y-5 ${isReportDataReady ? 'hidden' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <label className="md:col-span-2 font-semibold text-sm">Rapid View</label>
                    <div className="md:col-span-4">
                        <RapidViewList
                            value={selectedRapidViews}
                            onChange={onRapidViewChange as any}
                            placeholder="Add one or more rapid view to fetch sprints from"
                            multiple={true}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <label className="md:col-span-2 font-semibold text-sm">Sprints</label>
                    <div className="md:col-span-4">
                        <SprintList
                            value={selectedSprints}
                            rapidViews={selectedRapidViews}
                            onChange={onSprintChange}
                            placeholder="Add one or more sprint to view report"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={includeWorklogs}
                        onChange={(e) => onIncludeWorklogChange(e.value)}
                        label="Include worklog details in report for"
                    />
                    <span className="text-blue-500 hover:text-blue-700 cursor-pointer underline text-sm" onClick={onShowGroups}>
                        selected users
                    </span>
                </div>

                <div>
                    <Button
                        label="Generate Report"
                        leftIcon={<i className="fa fa-play-circle" />}
                        disabled={!canGenerate}
                        onClick={onGenerate}
                    />
                </div>
            </div>
        </>
    );
}

export default SprintReport;
