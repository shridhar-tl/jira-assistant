import React, { PureComponent } from 'react';

class SprintWiseWorklog extends PureComponent {
    constructor(props) {
        super(props);
    }

    componentWillReceiveProps(change) {
        if (this.props.groups) {
            this.props.groups.forEach(grp => {
                grp.include = true;
                grp.users.forEach(usr => usr.include = true);
            });
        }
        if (this.ticketDetails) {
            this.processTicketData();
        }
    }

    processTicketData() {
        let userList = this.groups.union(grp => grp.users.map(u => u.name)).distinct();
        this.reportData = this.sprintDetails.map(curSprint => {
            let sprintInfo = curSprint.sprint;
            let sprintWorklogs = {};
            let sprint = {
                sprintName: sprintInfo.name, startDate: sprintInfo.startDate,
                endDate: sprintInfo.endDate, completeDate: sprintInfo.completeDate, issuetypes: [],
                worklogs: sprintWorklogs,
                completedSP: 0, incompleteSP: 0
            };
            let sprintDetails = {
                startDate: sprintInfo.startDate, endDate: sprintInfo.completeDate, sprintStatus: sprintInfo.state,
                issueDetails: {}
            };
            var ticketDet = sprintDetails.issueDetails;
            let ticketList = [];
            curSprint.contents.completedIssues.forEach(i => {
                var cs = curSprint;
                ticketList.push(i.key);
                ticketDet[i.key] = {
                    done: i.done,
                    epic: i.epicField,
                    storyPoint: i.currentSP,
                    oldStoryPoint: i.oldSP,
                    completed: true
                };
            });

            let tickets = this.getIssueDetails(ticketList, sprintDetails, true);
            // Fetch incomplete issues
            ticketList = [];
            ticketDet = {};
            sprintDetails.issueDetails = ticketDet;
            curSprint.contents.issuesNotCompletedInCurrentSprint.forEach(i => {
                ticketList.push(i.key);
                ticketDet[i.key] = {
                    done: i.done,
                    epic: i.epicField,
                    storyPoint: i.currentSP,
                    oldStoryPoint: i.oldSP,
                    completed: false
                };
            });
            tickets.addRange(this.getIssueDetails(ticketList, sprintDetails, true));
            let sprintCompletedSP = 0, sprintIncompleteSP = 0;
            sprint.issuetypes = tickets.groupBy(t => t.issuetype.name)
                .map(grp => {
                    let completedSP = 0, incompleteSP = 0;
                    let worklogs = {};
                    grp.values.forEach(issue => {
                        if (issue.completed) {
                            completedSP += (issue.storyPoint || 0);
                            sprintCompletedSP += (issue.storyPoint || 0);
                        }
                        else {
                            incompleteSP += (issue.storyPoint || 0);
                            sprintIncompleteSP += (issue.storyPoint || 0);
                        }
                        userList.forEach(user => {
                            let userTotal = ((issue.worklogs[user] || {}).allTotal || 0);
                            worklogs[user] = (worklogs[user] || 0) + userTotal;
                            sprintWorklogs[user] = (sprintWorklogs[user] || 0) + userTotal;
                        });
                    });
                    return { issuetype: grp.values[0].issuetype, issues: grp.values, completedSP, incompleteSP, worklogs: worklogs };
                });
            sprint.completedSP = sprintCompletedSP;
            sprint.incompleteSP = sprintIncompleteSP;
            return sprint;
        });
        this.updateWorklogDetails();
        //this.userList = Object.getOwnPropertyNames(this.userObject);
    }

    setUserWiseWorklog(fields) {
        let worklogs = {};
        var worklogList = (fields.worklog || {}).worklogs;
        worklogList.forEach(wl => {
            let author = wl.author.name;
            let wlObj = worklogs[author];
            if (!wlObj) {
                wlObj = { total: 0, allTotal: 0 };
                worklogs[author] = wlObj;
                //if (!users[author]) { users[author] = wl.author; }
            }
            wlObj.total += wl.timeSpentSeconds;
            wlObj.allTotal = wlObj.total;
        });
        return worklogs;
    }

    getIssueDetails(issueList, details, isMainTask) {
        var issueDetails = details.issueDetails;
        //var users = this.userObject;
        var issues = this.ticketDetails.filter(i => issueList.Contains(i.key))
            .map(issue => {
                let curDetail = issueDetails[issue.key];
                let fields = issue.fields || {};
                let ticket = {
                    ticketNo: issue.key,
                    summary: fields.summary,
                    status: fields.status,
                    issuetype: fields.issuetype,
                    estimate: fields.timeoriginalestimate,
                    worklogs: this.setUserWiseWorklog(fields)
                };
                if (isMainTask) {
                    ticket.subtasks = this.getIssueDetails(this.ticketDetails.filter(i => ((i.fields || {}).parent || {}).key === issue.key)
                        .map(i => i.key), details);
                    if (ticket.subtasks) {
                        let parentWl = ticket.worklogs;
                        let estimateAll = 0;
                        ticket.subtasks.forEach(child => {
                            estimateAll += (child.estimate || 0);
                            let childWL = child.worklogs;
                            let usrs = Object.keys(childWL);
                            for (let u of usrs) {
                                var subTotal = childWL[u].allTotal;
                                let parentU = parentWl[u];
                                if (!parentU) {
                                    parentU = {};
                                    parentWl[u] = parentU;
                                }
                                parentU.allTotal = (parentU.allTotal || 0) + subTotal;
                            }
                        });
                        ticket.estimateAll = estimateAll + (ticket.estimate || 0);
                    }
                    let iDetail = details.issueDetails[issue.key];
                    ticket.sprintStatus = details.sprintStatus;
                    ticket.done = iDetail.done;
                    ticket.epic = iDetail.epic;
                    ticket.storyPoint = iDetail.storyPoint;
                    ticket.oldStoryPoint = iDetail.oldStoryPoint;
                    ticket.completed = iDetail.completed;
                }
                else {
                    ticket.parent = fields.parent;
                }
                return ticket;
            });
        return issues;
    }

    updateWorklogDetails() {
        this.reportData.forEach(sprint => {
            let sprintWorklogs = {};
            sprint.worklogs = sprintWorklogs;
            let sprintGrandTotal = 0;
            let sprintGroupTotal = [];
            let sprintEstimate = 0;
            sprint.issuetypes.forEach((issuetype => {
                let issueTypeWorklogs = {};
                issuetype.worklogs = issueTypeWorklogs;
                let typeGrandTotal = 0;
                let typeGroupTotal = [];
                let issueTypeEstimate = 0;
                let processIssue = (issue) => {
                    if (!this.showIncomplete && !issue.completed) {
                        return;
                    }
                    issueTypeEstimate += issue.estimateAll || 0;
                    let grandTotal = 0;
                    let grandTotalAll = 0;
                    let groupTotal = [];
                    let groupTotalAll = [];
                    this.groups.forEach((grp, grpIdx) => {
                        if (!grp.include) {
                            return;
                        }
                        let grpTotal = 0;
                        let grpTotalAll = 0;
                        grp.users.forEach(user => {
                            if (!user.include) {
                                return;
                            }
                            let userTotalAll = (issue.worklogs[user.name] || {}).allTotal || 0;
                            let userTotal = (issue.worklogs[user.name] || {}).total || 0;
                            issueTypeWorklogs[user.name] = (issueTypeWorklogs[user.name] || 0) + userTotalAll;
                            sprintWorklogs[user.name] = (sprintWorklogs[user.name] || 0) + userTotalAll;
                            grpTotalAll += userTotalAll;
                            grpTotal += userTotal;
                        }); // End of user loop
                        grandTotal += grpTotal;
                        grandTotalAll += grpTotalAll;
                        groupTotal[grpIdx] = grpTotal;
                        groupTotalAll[grpIdx] = grpTotalAll;
                        typeGroupTotal[grpIdx] = (typeGroupTotal[grpIdx] || 0) + grpTotalAll;
                        sprintGroupTotal[grpIdx] = (sprintGroupTotal[grpIdx] || 0) + grpTotalAll;
                    }); // End of group loop
                    typeGrandTotal += grandTotalAll;
                    issue.grandTotal = grandTotal;
                    issue.grandTotalAll = grandTotalAll;
                    issue.groupTotal = groupTotal;
                    issue.groupTotalAll = groupTotalAll;
                };
                issuetype.issues.forEach(processIssue); // End of issue loop
                sprintGrandTotal += typeGrandTotal;
                issuetype.grandTotal = typeGrandTotal;
                issuetype.groupTotal = typeGroupTotal;
                issuetype.estimate = issueTypeEstimate;
                sprintEstimate += issueTypeEstimate;
            })); // End of issue type loop
            sprint.grandTotal = sprintGrandTotal;
            sprint.groupTotal = sprintGroupTotal;
            sprint.estimate = sprintEstimate;
        }); // End of sprint loop
    }

    render() {
        return (
            <div>

            </div>
        );
    }
}

export default SprintWiseWorklog;