import React, { PureComponent, Fragment } from 'react';
import { ScrollableTable, THead, TBody } from "../../../components/ScrollableTable";
import { Checkbox } from '../../../controls';
import { inject } from '../../../services';

class SprintWiseWorklog extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "UtilsService");
        this.convertSecs = this.$utils.convertSecs;
        this.state = { showSubtask: false, showIncomplete: false, excludeNonSprintHrs: false };
    }


    UNSAFE_componentWillMount() {
        this.updateGroups(this.props.groups);
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.groups !== this.state.groups) {
            this.updateGroups(props.groups);
        }
    }

    updateGroups(groups) {
        groups.forEach(grp => {
            grp.include = true;
            grp.users.forEach(usr => usr.include = true);
        });

        if (this.props.ticketDetails) {
            this.processTicketData(groups);
        }
    }

    processTicketData(groups) {
        const userList = groups.union(grp => grp.users.map(u => u.name)).distinct();
        const reportData = this.props.sprintDetails.map(curSprint => {
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
        this.updateWorklogDetails(reportData, groups);

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
        const issues = this.props.ticketDetails.filter(i => issueList.contains(i.key))
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
                    ticket.subtasks = this.getIssueDetails(this.props.ticketDetails.filter(i => ((i.fields || {}).parent || {}).key === issue.key)
                        .map(i => i.key), details);
                    if (ticket.subtasks) {
                        const parentWl = ticket.worklogs;
                        let estimateAll = 0;
                        ticket.subtasks.forEach(child => {
                            estimateAll += (child.estimate || 0);
                            const childWL = child.worklogs;
                            const usrs = Object.keys(childWL);
                            usrs.forEach(u => {
                                const subTotal = childWL[u].allTotal;
                                let parentU = parentWl[u];
                                if (!parentU) {
                                    parentU = {};
                                    parentWl[u] = parentU;
                                }
                                parentU.allTotal = (parentU.allTotal || 0) + subTotal;
                            });
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

    updateWorklogDetails = (reportData, groups) => {
        if (!reportData) {
            reportData = this.state.reportData;
        }

        if (!groups) {
            groups = [...this.state.groups];
        }

        reportData = reportData.map(sprint => {
            sprint = { ...sprint };

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
                    if (!this.state.showIncomplete && !issue.completed) {
                        return;
                    }
                    issueTypeEstimate += issue.estimateAll || 0;
                    let grandTotal = 0;
                    let grandTotalAll = 0;
                    const groupTotal = [];
                    const groupTotalAll = [];
                    this.props.groups.forEach((grp, grpIdx) => {
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

            return sprint;
        }); // End of sprint loop

        this.setState({ reportData, groups });
    }

    toggleSubTasks = (val) => {
        this.setState({ showSubtask: val });
        this.updateWorklogDetails();
    }

    toggleNonSprintHrs = (val) => {
        this.setState({ excludeNonSprintHrs: val });
        this.updateWorklogDetails();
    }

    toggleShowIncomplete = (val) => {
        this.setState({ showIncomplete: val });
        this.updateWorklogDetails();
    }

    toggleGroupSelection = (grp, chk) => {
        grp.include = chk;
        this.updateWorklogDetails();
    }

    toggleUserSelection = (user, chk) => {
        user.include = chk;
        this.updateWorklogDetails();
    }

    render() {
        const {
            props: { groups },
            state: { showSubtask, showIncomplete, excludeNonSprintHrs, reportData }
        } = this;

        return (
            <>
                <div className="worklog-options">
                    <Checkbox checked={showSubtask} onChange={this.toggleSubTasks} label="Show subtask breakup" />
                    <Checkbox checked={showIncomplete} label="Include in-complete stories" onChange={this.toggleShowIncomplete} />
                    <Checkbox checked={excludeNonSprintHrs} onChange={this.toggleNonSprintHrs} label="Exclude hours logged out of sprint" disabled={true} />
                    <br />
                    <strong>Note: </strong> Hours displayed below may not be accurate. Still work in progress.
                </div>

                <ScrollableTable dataset={reportData} className="dataTable exportable worklog-table" exportSheetName="Worklog details">
                    <THead>
                        <tr>
                            <th rowSpan="3" colSpan="2" style={{ minWidth: "120px" }}>Ticket number</th>
                            <th rowSpan="3" style={{ minWidth: "500px" }}>Summary</th>
                            <th rowSpan="3" style={{ minWidth: "100px" }}>Sprint status</th>
                            <th rowSpan="3" style={{ minWidth: "60px" }}>Story points</th>
                            <th rowSpan="3" style={{ minWidth: "60px" }}>Estimate</th>
                            {groups.map((grp, g) => <th key={g} colSpan={grp.users.length + 1} className="data-center">
                                <Checkbox checked={grp.include} title="Select to include the worklog of this group in grand total"
                                    onChange={(chk) => this.toggleGroupSelection(grp, chk)} label={grp.name} />
                            </th>)}
                            <th rowSpan="3" style={{ minWidth: "70px" }}>Grand total</th>
                        </tr>
                        <tr exportHidden={true}>
                            {groups.map((grp, i) => <Fragment key={i}>
                                {grp.users.map((user, j) => <th key={j} className="data-center" style={{ width: "100px" }}>
                                    <Checkbox checked={user.include} onChange={(chk) => this.toggleUserSelection(user, chk)}
                                        title="Select to include the worklog of this user in group total" />
                                </th>)}
                                <th rowSpan="2" style={{ width: "70px" }}>Group total</th>
                            </Fragment>)}
                        </tr>
                        <tr>
                            {groups.map((grp, i) => <Fragment key={i}>
                                {grp.users.map((user, j) => <th key={j} className="data-center" style={{ width: "100px" }}>{user.displayName}</th>)}
                            </Fragment>)}
                        </tr>
                    </THead>
                    <TBody>
                        {(sprint, i) => <SprintDetails key={sprint._uniqueId} groups={groups} sprint={sprint} showIncomplete={showIncomplete}
                            showSubtask={showSubtask} convertSecs={this.convertSecs} />}
                    </TBody>
                </ScrollableTable>
            </>
        );
    }
}

export default SprintWiseWorklog;

class SprintDetails extends PureComponent {
    render() {
        const { groups, sprint, showIncomplete, showSubtask, convertSecs } = this.props;

        return (
            <>
                <tr>
                    <td colSpan="4"><strong>{sprint.sprintName}</strong></td>
                    <td exportType="number" className="data-center"><strong>{sprint.completedSP + (showIncomplete ? sprint.incompleteSP : 0)}</strong></td>
                    <td exportType="number" className="data-center"><strong>{convertSecs(sprint.estimate)}</strong></td>
                    {groups.map((grp, i) => <Fragment key={i}>
                        {grp.users.map((user, j) => <td key={j} className="data-center" exportType="number">{convertSecs(sprint.worklogs[user.name])}</td>)}
                        <td exportType="number" className="data-center"><strong>{convertSecs(sprint.groupTotal[i])}</strong></td>
                    </Fragment>)}
                    <td exportType="number" className="data-center"><strong>{convertSecs(sprint.grandTotal)}</strong></td>
                </tr >
                <IssueTypesList issueTypes={sprint.issuetypes} groups={groups} showIncomplete={showIncomplete} showSubtask={showSubtask} convertSecs={convertSecs} />
            </>
        );
    }
}

class IssueTypesList extends PureComponent {
    render() {
        const { convertSecs, issueTypes, groups, showIncomplete, showSubtask } = this.props;

        return issueTypes.map((type, t) => <Fragment key={t}>
            <tr>
                <td colSpan="4"><img src={type.issuetype.iconUrl} alt="" /> {type.issuetype.name}</td>
                <td exportType="number" className="data-center">{type.completedSP + (showIncomplete ? type.incompleteSP : 0)}</td>
                <td exportType="number" className="data-center"><strong>{convertSecs(type.estimate)}</strong></td>
                {groups.map((grp, i) => <Fragment key={i}>
                    {grp.users.map((user, j) => <td key={j} className="data-center" exportType="number">
                        {convertSecs(type.worklogs[user.name])}
                    </td>)}
                    <td exportType="number" className="data-center"><strong>{convertSecs(type.groupTotal[i])}</strong></td>
                </Fragment>)}
                <td exportType="number" className="data-center"><strong>{convertSecs(type.grandTotal)}</strong></td>
            </tr>
            <IssueList groups={groups} issues={type.issues} showIncomplete={showIncomplete} showSubtask={showSubtask} convertSecs={convertSecs} />
        </Fragment>);
    }
}

class IssueList extends PureComponent {
    render() {
        const { convertSecs, groups, issues, showIncomplete, showSubtask } = this.props;

        return (
            issues.map((issue, isu) => {
                if (!showIncomplete && !issue.completed) { return null; }

                return <Fragment key={isu}>
                    <tr className="auto-wrap">
                        <td colSpan="2">{issue.ticketNo}</td>
                        <td>{issue.summary}</td>
                        <td>{issue.completed ? 'Completed' : 'In complete'}</td>
                        <td exportType="number" className="data-center">{issue.storyPoint}</td>
                        <td exportType="number" className="data-center">{convertSecs(showSubtask ? issue.estimate : issue.estimateAll)}</td>
                        {
                            groups.map((grp, i) => <Fragment key={i}>
                                {
                                    grp.users.map((user, j) => <td key={j} className="data-center" exportType="number">
                                        {grp.include && user.include ? convertSecs(showSubtask ? (issue.worklogs[user.name] || 0).total : (issue.worklogs[user.name] || 0).allTotal) : null}
                                    </td>)
                                }
                                <td exportType="number"><strong>{convertSecs(showSubtask ? (issue.groupTotal || {})[i] : (issue.groupTotalAll || {})[i])}</strong></td>
                            </Fragment>)
                        }
                        <td exportType="number"><strong>{convertSecs(showSubtask ? issue.grandTotal : issue.grandTotalAll)}</strong></td>
                    </tr>

                    {showSubtask && <SubtaskList issue={issue} groups={groups} convertSecs={convertSecs} />}
                </Fragment>;
            })
        );
    }
}

class SubtaskList extends PureComponent {
    render() {
        const { issue, groups, convertSecs } = this.props;

        return (
            issue.subtasks.map((task, t) => <tr key={t} className="auto-wrap">
                <td style={{ width: "25px" }}>-</td>
                <td>{task.ticketNo}</td>
                <td>{task.summary}</td>
                <td></td>
                <td exportType="number" className="data-center">{task.storyPoint}</td>
                <td exportType="number" className="data-center">{convertSecs(task.estimate)}</td>
                {groups.map((grp, i) => <Fragment key={i}>
                    {grp.users.map((user, j) => <td key={j} className="data-center">{grp.include && user.include ? convertSecs((task.worklogs[user.name] || 0).total) : null}</td>)}
                    <td exportType="number"><strong>{convertSecs((issue.groupTotal || {})[i])}</strong></td>
                </Fragment>)}
                <td exportType="number"><strong>{convertSecs(task.grandTotal)}</strong></td>
            </tr>)
        );
    }
}
