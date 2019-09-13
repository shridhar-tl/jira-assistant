import React from 'react';
import { inject } from '../../../services';
import { TabView, TabPanel } from 'primereact/tabview';
import $ from 'jquery';
import RapidViewList from '../../../components/RapidViewList';
import { Checkbox, Button } from '../../../controls';
import SprintList from '../../../components/SprintList';
import SummaryView1 from './SummaryView1';
import SummaryView2 from './SummaryView2';
import SprintWiseWorklog from './SprintWiseWorklog';
import GroupEditor from "../../../dialogs/GroupEditor";
import "./Common.scss";
import VelocityChart from './VelocityChart';
import BaseGadget from "../../../gadgets/BaseGadget";
import { ExportFormat } from '../../../common/Exporter';

const notes = <div className="padding-15">
    <strong>Experimental:</strong> This report is experimental and development / bug fixes are in progress. If you encounter any issues or have any
suggestions for improvement please send us a feedback by clicking on <i className="fa fa-bug" /> icon on top right corner of the page.
<br />
    <br />
    <strong>How to use:</strong> To generate the sprint report follow the below steps
<ul>
        <li>Rapid view: This is the name of the Agile board which contains the sprint.</li>
        <li>Select one or more rapid view from the list. You can alternatively start typing the id or name of the board which will filter the list</li>
        <li>If you want to repeatedly view the sprint of selective rapid views, then add it in Settings -&gt; General -&gt; Default values tab.</li>
        <li>Once all the required rapid view is selected, sprint field will be populated with the list of available sprints.</li>
        <li>You can either click on the drop icon and select the sprint or start typing the sprint name to filter the list</li>
        <li>You can add one or more sprints in the sprint field and once done click Generate report button to generate the report</li>
        <li>Select worklog option to see the worklog added by the individual users on each ticket grouped based on sprint, issue type and tickets</li>
        <li>Add atleast 2 sprint to see the velocity chart. Having minimum of 5 sprint would give better insights on the chart.</li>
    </ul>
</div>;

class SprintReport extends BaseGadget {
    constructor(props) {
        super(props, "Sprint report", "fa fa-list-alt");
        this.isGadget = false;
        this.exportFormat = ExportFormat.XLSX;
        inject(this, "JiraService", "UserUtilsService", "SessionService", "UserGroupService");

        this.state = { disableRefresh: true, selectedRapidViews: this.$session.CurrentUser.rapidViews, selectedSprints: null };
    }

    UNSAFE_componentWillMount() {
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
                if (this.state.includeWorklogs) {
                    const ticketsList = result.union(spr => spr.contents.completedIssues).distinct(t => t.key);
                    ticketsList.addDistinctRange(result.union(spr => spr.contents.puntedIssues).distinct(t => t.key));
                    ticketsList.addDistinctRange(result.union(spr => spr.contents.issuesNotCompletedInCurrentSprint).distinct(t => t.key));
                    return this.$jira.searchTickets(`key in (${ticketsList.join()}) or parent in (${ticketsList.join()})`, ["summary", "worklog", "issuetype", "parent", "timeoriginalestimate"])
                        .then(tickets => { return { sprintDetails: result, ticketDetails: tickets }; });
                }
                return { sprintDetails: result };
            })
            .then((data) => {
                const result = data.sprintDetails;
                const getCountWithSP = (issues) => { return issues.count((issue) => { return ((issue.currentEstimateStatistic || {}).statFieldValue || {}).value; }); };
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
                    let link = $(sprint.lastUserToClose)
                        .attr('target', '_blank');
                    link = link.attr('href', this.$userutils.mapJiraUrl(link.attr('href')));
                    sprint.lastUserToClose = $("<div/>").append(link).html();
                });

                this.setState({ isLoading: false, disableRefresh: false, worklogDetails: data.ticketDetails, selectedTab: 1, sprintDetails: result });
            });
    }

    tabChanged = (e) => {
        this.setState({ selectedTab: e.index });
        //$('.tab-sprint .ui-tabview-panel:not(.ui-helper-hidden) div.table-container').trigger('resize');
    }

    rapidViewSelected = (val) => this.setState({ selectedRapidViews: val });
    sprintSelected = (val) => this.setState({ selectedSprints: val });
    incWorklogChanged = (val) => this.setState({ includeWorklogs: val });
    showGroupsDialog = (val) => this.setState({ showGroupsPopup: val });
    updateGroup = (groups) => this.setState({ groups });

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
                                            placeholder="add one or more rapid view to fetch sprints from" />
                                    </div>
                                </div>
                            </div>
                            <div className="ui-g ui-fluid">
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
                            <div className="ui-g ui-fluid">
                                <div className="ui-g-12 ui-md-5 ui-lg-4 ui-xl-3">
                                    <div className="form-group">
                                        <Checkbox checked={includeWorklogs} onChange={this.incWorklogChanged} label="Include worklog details in report for " />
                                        <span className="link" onClick={this.showGroupsDialog} disabled={includeWorklogs}> selected users</span>
                                    </div>
                                </div>
                            </div>
                            <div className="ui-g ui-fluid">
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
