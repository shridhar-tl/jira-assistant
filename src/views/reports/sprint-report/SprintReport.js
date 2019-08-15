import React, { PureComponent } from 'react';
import { inject } from '../../../services';
import $ from 'jquery';

class SprintReport extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "JiraService", "UtilsService");
        this.selectedRapidViews = this.$session.CurrentUser.rapidViews;
        this.selectedRapidIds = [];
        this.selectedSprints = [];
    }

    UNSAFE_componentWillMount() {
        this.rapidViewLoading = true;
        return this.$jira.getRapidViews().then((views) => {
            this.rapidViewLoading = false;
            this.rapidViews = views.orderBy((d) => { return d.name; }).map((d) => {
                return { name: d.name, id: d.id };
            });
            if (this.selectedRapidViews && this.selectedRapidViews.length > 0) {
                this.rapidViewChanged();
            }
        });
    }

    searchRapidView($event) {
        var query = ($event.query || '').toLowerCase();
        this.filteredRapidViews = this.rapidViews.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.id.toString().startsWith(query))
            && this.selectedRapidIds.indexOf(r.id) === -1);
    }

    rapidViewChanged() {
        this.selectedRapidIds = this.selectedRapidViews.map(r => r.id);
        this.$jira.getRapidSprintList(this.selectedRapidIds).then((sprints) => {
            this.sprints = sprints.orderByDescending(s => s.id).ForEach((s) => {
                if (!s.stateAppended) {
                    s.stateAppended = true;
                    s.name += (" - (" + s.state + ")" || "");
                }
            });
        });
        this.selectedSprints.removeAll(s => this.selectedRapidIds.indexOf(s.rapidId) === -1);
        this.sprintChanged();
    }
    searchSprints($event) {
        var query = ($event.query || '').toLowerCase();
        this.filteredSprints = this.sprints.filter(r => (r.name.toLowerCase().indexOf(query) >= 0 || r.id.toString().startsWith(query))
            && this.selectedSprintIds.indexOf(r.id) === -1);
    }
    sprintChanged() {
        this.selectedSprintIds = this.selectedSprints.map(r => r.id);
    }
    generateReport() {
        var selectedItems = this.selectedSprints;
        if (selectedItems.length === 0) {
            return;
        }
        this.isLoading = true;
        var arr = selectedItems.map((sprint) => {
            if (sprint.report) {
                return Promise.resolve(sprint.report);
            }
            return this.$jira.getRapidSprintDetails(sprint.rapidId, sprint.id).then(det => sprint.report = det);
        });
        Promise.all(arr)
            .then((result) => {
                if (this.includeWorklogs) {
                    var ticketsList = result.union(spr => spr.contents.completedIssues).distinct(t => t.key);
                    ticketsList.AddDistinctRange(result.union(spr => spr.contents.puntedIssues).distinct(t => t.key));
                    ticketsList.AddDistinctRange(result.union(spr => spr.contents.issuesNotCompletedInCurrentSprint).distinct(t => t.key));
                    return this.$jira.searchTickets('key in (' + ticketsList.join() + ') or parent in (' + ticketsList.join() + ')', ["summary", "worklog", "issuetype", "parent", "timeoriginalestimate"])
                        .then(tickets => { return { sprintDetails: result, ticketDetails: tickets }; });
                }
                return { sprintDetails: result };
            })
            .then((data) => {
                this.isLoading = false;
                this.worklogDetails = data.ticketDetails;
                var result = data.sprintDetails;
                this.sprintDetails = result;
                var getCountWithSP = (issues) => { return issues.count((issue) => { return ((issue.currentEstimateStatistic || {}).statFieldValue || {}).value; }); };
                result.forEach((sprint) => {
                    let added = 0, removed = 0, addedWithSP = 0;
                    var jiraKeysList = sprint.contents.issueKeysAddedDuringSprint;
                    var keys = Object.keys(jiraKeysList);
                    keys.forEach((key) => {
                        if (jiraKeysList[key] === true) {
                            added += 1;
                        }
                        else {
                            removed += 1;
                        }
                    });
                    var addedSP = 0, addedSPOld = 0;
                    var processAdded = (issue) => {
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
                    var link = $(sprint.lastUserToClose)
                        .attr('target', '_blank');
                    link = link.attr('href', this.$utils.mapJiraUrl(link.attr('href')));
                    sprint.lastUserToClose = $("<div/>").append(link).html();
                });
                // Show the second tab
                window.setTimeout(() => this.selectedTab = 1, 500);
            });
    }
    tabChanged(event) {
        $('.tab-sprint .ui-tabview-panel:not(.ui-helper-hidden) div.table-container').trigger('resize');
    }


    render() {
        return (
            <div>

            </div>
        );
    }
}

export default SprintReport;