import React, { PureComponent } from 'react';

class SprintWiseWorklog extends PureComponent {
    UNSAFE_componentWillReceiveProps(change) {
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
        const userList = this.groups.union(grp => grp.users.map(u => u.name)).distinct();
        this.reportData = this.sprintDetails.map(curSprint => {
            const sprintInfo = curSprint.sprint;
            const sprintWorklogs = {};
            const sprint = {
                sprintName: sprintInfo.name, startDate: sprintInfo.startDate,
                endDate: sprintInfo.endDate, completeDate: sprintInfo.completeDate, issuetypes: [],
                worklogs: sprintWorklogs,
                completedSP: 0, incompleteSP: 0
            };
            const sprintDetails = {
                startDate: sprintInfo.startDate, endDate: sprintInfo.completeDate, sprintStatus: sprintInfo.state,
                issueDetails: {}
            };
            let ticketDet = sprintDetails.issueDetails;
            let ticketList = [];
            curSprint.contents.completedIssues.forEach(i => {
                //const cs = curSprint;
                ticketList.push(i.key);
                ticketDet[i.key] = {
                    done: i.done,
                    epic: i.epicField,
                    storyPoint: i.currentSP,
                    oldStoryPoint: i.oldSP,
                    completed: true
                };
            });

            const tickets = this.getIssueDetails(ticketList, sprintDetails, true);
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
                    const worklogs = {};
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
                            const userTotal = ((issue.worklogs[user] || {}).allTotal || 0);
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
        const worklogs = {};
        const worklogList = (fields.worklog || {}).worklogs;
        worklogList.forEach(wl => {
            const author = wl.author.name;
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
        //var issueDetails = details.issueDetails;
        //var users = this.userObject;
        const issues = this.ticketDetails.filter(i => issueList.contains(i.key))
            .map(issue => {
                //const curDetail = issueDetails[issue.key];
                const fields = issue.fields || {};
                const ticket = {
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
                        const parentWl = ticket.worklogs;
                        let estimateAll = 0;
                        ticket.subtasks.forEach(child => {
                            estimateAll += (child.estimate || 0);
                            const childWL = child.worklogs;
                            const usrs = Object.keys(childWL);
                            for (const u of usrs) {
                                const subTotal = childWL[u].allTotal;
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
                    const iDetail = details.issueDetails[issue.key];
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
            const sprintWorklogs = {};
            sprint.worklogs = sprintWorklogs;
            let sprintGrandTotal = 0;
            const sprintGroupTotal = [];
            let sprintEstimate = 0;
            sprint.issuetypes.forEach((issuetype => {
                const issueTypeWorklogs = {};
                issuetype.worklogs = issueTypeWorklogs;
                let typeGrandTotal = 0;
                const typeGroupTotal = [];
                let issueTypeEstimate = 0;
                const processIssue = (issue) => {
                    if (!this.showIncomplete && !issue.completed) {
                        return;
                    }
                    issueTypeEstimate += issue.estimateAll || 0;
                    let grandTotal = 0;
                    let grandTotalAll = 0;
                    const groupTotal = [];
                    const groupTotalAll = [];
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
                            const userTotalAll = (issue.worklogs[user.name] || {}).allTotal || 0;
                            const userTotal = (issue.worklogs[user.name] || {}).total || 0;
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