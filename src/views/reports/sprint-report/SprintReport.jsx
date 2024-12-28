import React from 'react';
import { inject } from '../../../services';
import { TabView, TabPanel } from 'primereact/tabview';
import RapidViewList from '../../../components/RapidViewList';
import { Checkbox, Button } from '../../../controls';
import SprintList from '../../../components/SprintList';
import SummaryView1 from './SummaryView1';
import SummaryView2 from './SummaryView2';
import SprintWiseWorklog from './SprintWiseWorklog';
import GroupEditor from "../../../dialogs/GroupEditor";
import VelocityChart from './VelocityChart';
import BaseGadget from "../../../gadgets/BaseGadget";
import { ExportFormat } from '../../../common/Exporter';
import { EventCategory } from '../../../constants/settings';
import "./Common.scss";

const notes = <div className="padding-15">
    <strong>Experimental Notice:</strong> This report is currently in an experimental phase, and development and bug fixes are actively underway.
    If you encounter any issues or have suggestions for improvement, please provide us with your feedback by clicking the <i className="fa fa-phone" /> icon
    located in the top right corner of the page.
    <br />
    <br />
    <strong>How to Use:</strong> To generate the sprint report, follow these steps:
    <ul>
        <li><strong>Rapid View:</strong> This refers to the name of the Agile board containing the sprint.</li>
        <li>Select one or more Rapid Views from the list. Alternatively, you can start typing the ID or name of the board, and the list will filter accordingly.</li>
        <li>If you frequently view sprints for specific Rapid Views, consider adding them to Settings → General → Default Values tab for quicker access.</li>
        <li>Once you've selected the necessary Rapid Views, the sprint field will populate with available sprints.</li>
        <li>You can either click the dropdown icon to select a sprint or begin typing the sprint name to filter the options.</li>
        <li>Add one or more sprints to the sprint field, and when you're ready, click the "Generate Report" button to generate the report.</li>
        <li>Select the "Worklog" option to view individual user worklogs for each ticket, organized by sprint, issue type, and tickets.</li>
        <li>To see the velocity chart, ensure you have added at least two sprints. For more insightful chart data, consider having a minimum of five sprints.</li>
    </ul>
</div>
    ;

class SprintReport extends BaseGadget {
    constructor(props) {
        super(props, "Sprint report", "fa fa-list-alt");
        this.isGadget = false;
        this.exportFormat = ExportFormat.XLSX;
        this.hideCSVExport = true;
        inject(this, "JiraService", "UserUtilsService", "SessionService", "UserGroupService", "AnalyticsService");

        this.state = { disableRefresh: true, selectedRapidViews: this.$session.CurrentUser.rapidViews, selectedSprints: null, selectedTab: 0 };
    }

    componentDidMount() {
        super.componentDidMount();
        this.$usergroup.getUserGroups().then(groups => this.setState({ groups }));
    }

    refreshData = () => {
        const { selectedSprints } = this.state;

        if (selectedSprints && selectedSprints.length === 0) {
            return;
        }

        this.setState({ isLoading: true });

        const arr = selectedSprints.map((sprint) => {
            if (sprint.report) {
                return Promise.resolve(sprint.report);
            }
            return this.$jira.getRapidSprintDetails(sprint.rapidId, sprint.id).then(det => sprint.report = det);
        });
        Promise.all(arr)
            .then((result) => {
                this.$analytics.trackEvent("Sprint report viewed", EventCategory.UserActions);

                if (this.state.includeWorklogs) {
                    const ticketsList = result.union(spr => spr.contents.completedIssues).distinct(t => t.key);
                    ticketsList.addDistinctRange(result.union(spr => spr.contents.puntedIssues).distinct(t => t.key));
                    ticketsList.addDistinctRange(result.union(spr => spr.contents.issuesNotCompletedInCurrentSprint).distinct(t => t.key));
                    return this.$jira.searchTickets(`key in (${ticketsList.join()}) or parent in (${ticketsList.join()})`, ["summary", "worklog", "issuetype", "parent", "timeoriginalestimate"])
                        .then(tickets => ({ sprintDetails: result, ticketDetails: tickets }));
                }
                return { sprintDetails: result };
            })
            .then((data) => {
                const result = data.sprintDetails;
                const getCountWithSP = (issues) => issues.count((issue) => ((issue.currentEstimateStatistic || {}).statFieldValue || {}).value);
                // eslint-disable-next-line complexity
                result.forEach((sprint) => {
                    let added = 0, removed = 0, addedWithSP = 0;
                    const jiraKeysList = sprint.contents.issueKeysAddedDuringSprint;
                    const keys = Object.keys(jiraKeysList);
                    keys.forEach((key) => {
                        if (jiraKeysList[key] === true) {
                            added += 1;
                        }
                        else {
                            removed += 1;
                        }
                    });
                    let addedSP = 0, addedSPOld = 0;
                    const processAdded = (issue) => {
                        issue.addedLater = jiraKeysList[issue.key] === true;
                        issue.removedLater = jiraKeysList[issue.key] === false;
                        issue.currentSP = ((issue.currentEstimateStatistic || {}).statFieldValue || {}).value || 0;
                        issue.oldSP = ((issue.estimateStatistic || {}).statFieldValue || {}).value || 0;
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
                    sprint.addedSP = addedSP || '';
                    sprint.addedSPOld = addedSPOld && addedSPOld !== addedSP ? addedSPOld : null;
                    const completedModified = sprint.contents.completedIssuesInitialEstimateSum.value;
                    const completed = sprint.contents.completedIssuesEstimateSum.value;
                    sprint.completedSP = completed || '';
                    sprint.completedSPOld = completedModified && completedModified !== completed ? completedModified : null;
                    sprint.completedWithSP = getCountWithSP(sprint.contents.completedIssues);
                    sprint.CompletedTotal = sprint.contents.completedIssues.length;
                    const incompletedModified = sprint.contents.issuesNotCompletedInitialEstimateSum.value;
                    const incompleted = sprint.contents.issuesNotCompletedEstimateSum.value || '';
                    sprint.incompletedSP = incompleted;
                    sprint.incompletedSPOld = incompletedModified && incompletedModified !== incompleted ? incompletedModified : null;
                    sprint.incompletedWithSP = getCountWithSP(sprint.contents.issuesNotCompletedInCurrentSprint);
                    sprint.incompletedTotal = sprint.contents.issuesNotCompletedInCurrentSprint.length;
                    const removedModified = sprint.contents.puntedIssuesInitialEstimateSum.value;
                    removed = sprint.contents.puntedIssuesEstimateSum.value || ''; // ToDo: Need to check
                    sprint.removedSP = removed;
                    sprint.removedSPOld = removedModified && removedModified !== removed ? removedModified : null;
                    sprint.removedWithSP = getCountWithSP(sprint.contents.puntedIssues);
                    sprint.removedTotal = sprint.contents.puntedIssues.length;
                    sprint.addedIssues = added;
                    sprint.addedWithSP = addedWithSP;
                    sprint.removedIssues = removed;
                    sprint.totalIssuesSPOld = (sprint.completedSPOld || 0) + (sprint.incompletedSPOld || 0);
                    sprint.totalIssuesSP = (sprint.completedSP || 0) + (sprint.incompletedSP || 0);
                    sprint.totalIssuesCount = sprint.CompletedTotal + sprint.incompletedTotal;
                    sprint.totalIssuesWithSP = sprint.completedWithSP + sprint.incompletedWithSP;
                    if (sprint.totalIssuesSPOld === sprint.totalIssuesSP) {
                        delete sprint.totalIssuesSPOld;
                        if (!sprint.totalIssuesSP) {
                            delete sprint.totalIssuesSP;
                        }
                    }
                    //(completed + not completed  + removed) - added
                    // Issue with sprint 21 & 22
                    sprint.estimateIssuesSPOld = ((sprint.completedSPOld || 0) + (sprint.incompletedSPOld || 0) + (sprint.removedSP || 0)) - (sprint.addedSP || 0);
                    if (sprint.estimateIssuesSPOld < 0) {
                        sprint.estimateIssuesSPOld = 0;
                    }
                    sprint.estimateIssuesSP = ((sprint.completedSP || 0) + (sprint.incompletedSP || 0) + (sprint.removedSP || 0)) - (sprint.addedSP || 0);
                    sprint.estimateIssuesCount = (sprint.CompletedTotal + sprint.incompletedTotal + sprint.removedTotal) - sprint.addedIssues;
                    sprint.estimateIssuesWithSP = (sprint.completedWithSP + sprint.incompletedWithSP + sprint.removedWithSP) - sprint.addedWithSP;
                    if (sprint.estimateIssuesSPOld === sprint.estimateIssuesSP) {
                        delete sprint.estimateIssuesSPOld;
                        if (!sprint.estimateIssuesSP) {
                            delete sprint.estimateIssuesSP;
                        }
                    }
                    sprint.expanded = result.length === 1;
                    if (sprint.lastUserToClose) {
                        const div = document.createElement('div');
                        div.innerHTML = sprint.lastUserToClose;
                        const link = div.childNodes[0];
                        if (link) {
                            link.setAttribute('target', '_blank');
                            link.setAttribute('href', this.$userutils.mapJiraUrl(link.attributes['href']?.value));
                            sprint.lastUserToClose = div.innerHTML;
                        }
                    }
                });

                this.setState({ isLoading: false, disableRefresh: false, worklogDetails: data.ticketDetails, selectedTab: 1, sprintDetails: result });
            });
    };

    tabChanged = (e) => {
        this.setState({ selectedTab: e.index });
        //$('.tab-sprint .ui-tabview-panel:not(.ui-helper-hidden) div.table-container').trigger('resize');
    };

    rapidViewSelected = (val) => this.setState({ selectedRapidViews: val });
    sprintSelected = (val) => this.setState({ selectedSprints: val });
    incWorklogChanged = (val) => this.setState({ includeWorklogs: val });
    showGroupsDialog = () => this.setState({ showGroupsPopup: true });
    updateGroup = (groups) => this.setState({ groups: groups || this.state.groups, showGroupsPopup: false });

    formatDateTime = (val) => this.$userutils.formatDateTime(val);

    render() {
        const {
            state: { selectedTab, selectedRapidViews, sprintDetails, selectedSprints, includeWorklogs, showGroupsPopup, groups, worklogDetails }
        } = this;

        const sprintCount = sprintDetails ? sprintDetails.length : 0;

        const isReportDataReady = sprintDetails && sprintCount > 0;

        return super.renderBase(
            <div className="sprint-report">
                <TabView renderActiveOnly={false} activeIndex={selectedTab} onTabChange={this.tabChanged}>
                    <TabPanel header="Settings">
                        {notes}
                        <div className={isReportDataReady ? 'fs-hide pad-22' : 'pad-22'}>
                            <div className="ui-g ui-fluid">
                                <div className="ui-g-12 ui-md-2 ui-lg-2 ui-xl-1">
                                    <strong>Rapid view</strong>
                                </div>
                                <div className="ui-g-12 ui-md-5 ui-lg-4 ui-xl-3">
                                    <div className="form-group">
                                        <RapidViewList value={selectedRapidViews} onChange={this.rapidViewSelected}
                                            placeholder="add one or more rapid view to fetch sprints from" multiple={true} />
                                    </div>
                                </div>
                            </div>
                            <div className="ui-g ui-fluid py-3">
                                <div className="ui-g-12 ui-md-2 ui-lg-2 ui-xl-1">
                                    <strong>Sprints</strong>
                                </div>
                                <div className="ui-g-12 ui-md-5 ui-lg-4 ui-xl-3">
                                    <div className="form-group">
                                        <SprintList value={selectedSprints} rapidViews={selectedRapidViews} onChange={this.sprintSelected}
                                            placeholder="add one or more sprint to view report" />
                                    </div>
                                </div>
                            </div>
                            <div className="ui-g ui-fluid py-2">
                                <div className="ui-g-12 ui-md-5 ui-lg-4 ui-xl-3">
                                    <div className="form-group">
                                        <Checkbox checked={includeWorklogs} onChange={this.incWorklogChanged} label="Include worklog details in report for " />
                                        <span className="link" onClick={this.showGroupsDialog} disabled={includeWorklogs}> selected users</span>
                                    </div>
                                </div>
                            </div>
                            <div className="ui-g ui-fluid py-3">
                                <div className="ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                                    <Button className="ui-button-primary" disabled={!selectedSprints || selectedSprints.length === 0}
                                        icon="fa fa-play-circle" label="Generate report" onClick={this.refreshData} />
                                </div>
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel header="Summary view 1" disabled={!isReportDataReady}>
                        {sprintDetails && <SummaryView1 sprintDetails={sprintDetails} formatDateTime={this.formatDateTime} />}
                    </TabPanel>
                    <TabPanel header="Summary view 2" disabled={!isReportDataReady}>
                        {sprintDetails && <SummaryView2 sprintDetails={sprintDetails} formatDateTime={this.formatDateTime} />}
                    </TabPanel>
                    <TabPanel header="Velocity chart" disabled={!isReportDataReady || sprintCount < 2}>
                        {sprintDetails && <VelocityChart sprintDetails={sprintDetails} />}
                    </TabPanel>
                    <TabPanel header="Worklog details" disabled={!isReportDataReady || !includeWorklogs}>
                        {includeWorklogs && <SprintWiseWorklog groups={groups} ticketDetails={worklogDetails} sprintDetails={sprintDetails} />}
                    </TabPanel>
                </TabView>
                {showGroupsPopup && <GroupEditor groups={groups} onHide={this.updateGroup} />}
            </div>
        );
    }
}

export default SprintReport;
