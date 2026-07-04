import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import { Checkbox, ScrollableTable, TBody, THead } from '@components';

import { distinct, getUserName, groupBy, union } from '@utils';

import { convertSecs } from '../../../services/utils-service';

interface SprintWiseWorklogProps {
    groups: any[];
    ticketDetails?: any[];
    sprintDetails: any[] | null;
}

function SprintWiseWorklog({ groups, ticketDetails, sprintDetails }: SprintWiseWorklogProps) {
    const [showSubtask, setShowSubtask] = useState(false);
    const [showIncomplete, setShowIncomplete] = useState(false);
    const [excludeNonSprintHrs, setExcludeNonSprintHrs] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [localGroups, setLocalGroups] = useState<any[]>([]);
    const rawReportDataRef = useRef<any[]>([]);

    const processTicketData = useCallback(
        (grps: any[]) => {
            if (!ticketDetails || !sprintDetails) return;

            const userList = distinct(union(grps, (grp: any) => grp.users.map((u: any) => getUserName(u))));

            const data = sprintDetails.map((curSprint: any) => {
                const sprintInfo = curSprint.sprint;
                const sprintWorklogs: Record<string, number> = {};
                const sprint: any = {
                    sprintName: sprintInfo.name,
                    startDate: sprintInfo.startDate,
                    endDate: sprintInfo.endDate,
                    completeDate: sprintInfo.completeDate,
                    issuetypes: [],
                    worklogs: sprintWorklogs,
                    completedSP: 0,
                    incompleteSP: 0,
                };
                const sprintContext: any = {
                    startDate: sprintInfo.startDate,
                    endDate: sprintInfo.completeDate,
                    sprintStatus: sprintInfo.state,
                    issueDetails: {} as Record<string, any>,
                };

                let ticketDet = sprintContext.issueDetails;
                let ticketList: string[] = [];

                curSprint.contents.completedIssues.forEach((i: any) => {
                    ticketList.push(i.key);
                    ticketDet[i.key] = {
                        done: i.done,
                        epic: i.epicField,
                        storyPoint: i.currentSP,
                        oldStoryPoint: i.oldSP,
                        completed: true,
                    };
                });

                const tickets = getIssueDetails(ticketDetails, ticketList, sprintContext, true);

                ticketList = [];
                ticketDet = {};
                sprintContext.issueDetails = ticketDet;
                curSprint.contents.issuesNotCompletedInCurrentSprint.forEach((i: any) => {
                    ticketList.push(i.key);
                    ticketDet[i.key] = {
                        done: i.done,
                        epic: i.epicField,
                        storyPoint: i.currentSP,
                        oldStoryPoint: i.oldSP,
                        completed: false,
                    };
                });

                const allTickets = [...tickets, ...getIssueDetails(ticketDetails, ticketList, sprintContext, true)];
                let sprintCompletedSP = 0;
                let sprintIncompleteSP = 0;

                sprint.issuetypes = groupBy(allTickets, (t: any) => t.issuetype.name).map((grp: any) => {
                    let completedSP = 0;
                    let incompleteSP = 0;
                    const worklogs: Record<string, number> = {};

                    grp.values.forEach((issue: any) => {
                        if (issue.completed) {
                            completedSP += issue.storyPoint || 0;
                            sprintCompletedSP += issue.storyPoint || 0;
                        } else {
                            incompleteSP += issue.storyPoint || 0;
                            sprintIncompleteSP += issue.storyPoint || 0;
                        }
                        userList.forEach((user: any) => {
                            const userTotal = (issue.worklogs[user] || {}).allTotal || 0;
                            worklogs[user] = (worklogs[user] || 0) + userTotal;
                            sprintWorklogs[user] = (sprintWorklogs[user] || 0) + userTotal;
                        });
                    });

                    return { issuetype: grp.values[0].issuetype, issues: grp.values, completedSP, incompleteSP, worklogs };
                });

                sprint.completedSP = sprintCompletedSP;
                sprint.incompleteSP = sprintIncompleteSP;
                return sprint;
            });

            rawReportDataRef.current = data;
            return data;
        },
        [ticketDetails, sprintDetails],
    );

    const updateWorklogDetails = useCallback(
        (rawData?: any[], grps?: any[]) => {
            const data = rawData || rawReportDataRef.current;
            const currentGroups = grps || localGroups;
            if (!data.length || !currentGroups.length) return;

            const processed = data.map((sprint: any) => {
                sprint = { ...sprint };
                const sprintWorklogs: Record<string, number> = {};
                sprint.worklogs = sprintWorklogs;
                let sprintGrandTotal = 0;
                const sprintGroupTotal: number[] = [];
                let sprintEstimate = 0;

                sprint.issuetypes.forEach((issuetype: any) => {
                    const issueTypeWorklogs: Record<string, number> = {};
                    issuetype.worklogs = issueTypeWorklogs;
                    let typeGrandTotal = 0;
                    const typeGroupTotal: number[] = [];
                    let issueTypeEstimate = 0;

                    const processIssue = (issue: any) => {
                        if (!showIncomplete && !issue.completed) return;
                        issueTypeEstimate += issue.estimateAll || 0;
                        let grandTotal = 0;
                        let grandTotalAll = 0;
                        const groupTotal: number[] = [];
                        const groupTotalAll: number[] = [];

                        currentGroups.forEach((grp: any, grpIdx: number) => {
                            if (!grp.include) return;
                            let grpTotal = 0;
                            let grpTotalAll = 0;

                            grp.users.forEach((user: any) => {
                                if (!user.include) return;
                                const uName = getUserName(user)!;
                                const userTotalAll = (issue.worklogs[uName] || {}).allTotal || 0;
                                const userTotal = (issue.worklogs[uName] || {}).total || 0;
                                issueTypeWorklogs[uName] = (issueTypeWorklogs[uName] || 0) + userTotalAll;
                                sprintWorklogs[uName] = (sprintWorklogs[uName] || 0) + userTotalAll;
                                grpTotalAll += userTotalAll;
                                grpTotal += userTotal;
                            });

                            grandTotal += grpTotal;
                            grandTotalAll += grpTotalAll;
                            groupTotal[grpIdx] = grpTotal;
                            groupTotalAll[grpIdx] = grpTotalAll;
                            typeGroupTotal[grpIdx] = (typeGroupTotal[grpIdx] || 0) + grpTotalAll;
                            sprintGroupTotal[grpIdx] = (sprintGroupTotal[grpIdx] || 0) + grpTotalAll;
                        });

                        typeGrandTotal += grandTotalAll;
                        issue.grandTotal = grandTotal;
                        issue.grandTotalAll = grandTotalAll;
                        issue.groupTotal = groupTotal;
                        issue.groupTotalAll = groupTotalAll;
                    };

                    issuetype.issues.forEach(processIssue);
                    sprintGrandTotal += typeGrandTotal;
                    issuetype.grandTotal = typeGrandTotal;
                    issuetype.groupTotal = typeGroupTotal;
                    issuetype.estimate = issueTypeEstimate;
                    sprintEstimate += issueTypeEstimate;
                });

                sprint.grandTotal = sprintGrandTotal;
                sprint.groupTotal = sprintGroupTotal;
                sprint.estimate = sprintEstimate;
                return sprint;
            });

            setReportData(processed);
        },
        [localGroups, showIncomplete],
    );

    const updateGroups = useCallback(
        (grps: any[]) => {
            grps.forEach((grp: any) => {
                grp.include = grp.include !== false;
                grp.users.forEach((usr: any) => {
                    usr.include = usr.include !== false;
                });
            });
            setLocalGroups([...grps]);

            if (ticketDetails) {
                const rawData = processTicketData(grps);
                if (rawData) {
                    updateWorklogDetails(rawData, grps);
                }
            }
        },
        [ticketDetails, processTicketData, updateWorklogDetails],
    );

    useEffect(() => {
        if (groups.length > 0) {
            updateGroups(groups);
        }
    }, [groups]);

    useEffect(() => {
        updateWorklogDetails();
    }, [showSubtask, showIncomplete, excludeNonSprintHrs]);

    const toggleGroupSelection = useCallback(
        (grp: any, chk: boolean) => {
            grp.include = chk;
            setLocalGroups((prev) => [...prev]);
            updateWorklogDetails();
        },
        [updateWorklogDetails],
    );

    const toggleUserSelection = useCallback(
        (user: any, chk: boolean) => {
            user.include = chk;
            setLocalGroups((prev) => [...prev]);
            updateWorklogDetails();
        },
        [updateWorklogDetails],
    );

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 p-4 bg-(--bg-secondary)/30 border-b border-(--border-color)">
                <Checkbox checked={showSubtask} onChange={(e) => setShowSubtask(e.value)} label="Show subtask breakup" />
                <Checkbox checked={showIncomplete} onChange={(e) => setShowIncomplete(e.value)} label="Include in-complete stories" />
                <Checkbox
                    checked={excludeNonSprintHrs}
                    onChange={(e) => setExcludeNonSprintHrs(e.value)}
                    label="Exclude hours logged out of sprint"
                    disabled={true}
                />
                <span className="text-xs text-amber-600 font-medium ml-2">
                    <i className="fa fa-info-circle mr-1" />
                    Hours displayed below may not be accurate. Still work in progress.
                </span>
            </div>

            <ScrollableTable dataset={reportData} className="text-xs" exportSheetName="Worklog details">
                <THead>
                    <tr>
                        <th
                            rowSpan={3}
                            colSpan={2}
                            className="px-3 py-2 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[120px]"
                        >
                            Ticket number
                        </th>
                        <th
                            rowSpan={3}
                            className="px-3 py-2 text-left font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[300px]"
                        >
                            Summary
                        </th>
                        <th
                            rowSpan={3}
                            className="px-3 py-2 text-center font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[90px]"
                        >
                            Sprint status
                        </th>
                        <th
                            rowSpan={3}
                            className="px-3 py-2 text-center font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[60px]"
                        >
                            SP
                        </th>
                        <th
                            rowSpan={3}
                            className="px-3 py-2 text-center font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[60px]"
                        >
                            Estimate
                        </th>
                        {localGroups.map((grp, g) => (
                            <th
                                key={g}
                                colSpan={grp.users.length + 1}
                                className="px-2 py-2 text-center font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10"
                            >
                                <Checkbox checked={grp.include} onChange={(e) => toggleGroupSelection(grp, e.value)} label={grp.name} />
                            </th>
                        ))}
                        <th
                            rowSpan={3}
                            className="px-3 py-2 text-center font-semibold text-primary border-b border-(--border-color) bg-(--bg-secondary) sticky top-0 z-10 min-w-[70px]"
                        >
                            Grand total
                        </th>
                    </tr>
                    <tr>
                        {localGroups.map((grp, i) => (
                            <Fragment key={i}>
                                {grp.users.map((user: any, j: number) => (
                                    <th
                                        key={j}
                                        className="px-1 py-1 text-center border-b border-(--border-color) bg-(--bg-secondary) w-[90px]"
                                    >
                                        <Checkbox checked={user.include} onChange={(e) => toggleUserSelection(user, e.value)} />
                                    </th>
                                ))}
                                <th
                                    rowSpan={2}
                                    className="px-2 py-1 text-center font-medium border-b border-(--border-color) bg-(--bg-secondary) w-[70px] text-secondary"
                                >
                                    Group total
                                </th>
                            </Fragment>
                        ))}
                    </tr>
                    <tr>
                        {localGroups.map((grp, i) => (
                            <Fragment key={i}>
                                {grp.users.map((user: any, j: number) => (
                                    <th
                                        key={j}
                                        className="px-1 py-1 text-center text-[10px] font-medium border-b border-(--border-color) bg-(--bg-secondary) w-[90px] truncate max-w-[90px]"
                                    >
                                        {user.displayName}
                                    </th>
                                ))}
                            </Fragment>
                        ))}
                    </tr>
                </THead>
                <TBody>
                    {(sprint: any) => (
                        <SprintWorklogDetails
                            key={sprint.sprintName}
                            groups={localGroups}
                            sprint={sprint}
                            showIncomplete={showIncomplete}
                            showSubtask={showSubtask}
                        />
                    )}
                </TBody>
            </ScrollableTable>
        </>
    );
}

function setUserWiseWorklog(fields: any): Record<string, { total: number; allTotal: number }> {
    const worklogs: Record<string, { total: number; allTotal: number }> = {};
    const worklogList = (fields.worklog || {}).worklogs || [];
    worklogList.forEach((wl: any) => {
        const author = getUserName(wl.author);
        if (!author) return;
        let wlObj = worklogs[author];
        if (!wlObj) {
            wlObj = { total: 0, allTotal: 0 };
            worklogs[author] = wlObj;
        }
        wlObj.total += wl.timeSpentSeconds;
        wlObj.allTotal = wlObj.total;
    });
    return worklogs;
}

function getIssueDetails(allTicketDetails: any[], issueList: string[], details: any, isMainTask?: boolean): any[] {
    return allTicketDetails
        .filter((i: any) => issueList.includes(i.key))
        .map((issue: any) => {
            const fields = issue.fields || {};
            const ticket: any = {
                ticketNo: issue.key,
                summary: fields.summary,
                status: fields.status,
                issuetype: fields.issuetype,
                estimate: fields.timeoriginalestimate,
                worklogs: setUserWiseWorklog(fields),
            };

            if (isMainTask) {
                const childKeys = allTicketDetails
                    .filter((i: any) => ((i.fields || {}).parent || {}).key === issue.key)
                    .map((i: any) => i.key);
                ticket.subtasks = getIssueDetails(allTicketDetails, childKeys, details);

                if (ticket.subtasks) {
                    const parentWl = ticket.worklogs;
                    let estimateAll = 0;
                    ticket.subtasks.forEach((child: any) => {
                        estimateAll += child.estimate || 0;
                        const childWL = child.worklogs;
                        Object.keys(childWL).forEach((u) => {
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
            } else {
                ticket.parent = fields.parent;
            }

            return ticket;
        });
}

interface SprintWorklogDetailsProps {
    groups: any[];
    sprint: any;
    showIncomplete: boolean;
    showSubtask: boolean;
}

function SprintWorklogDetails({ groups, sprint, showIncomplete, showSubtask }: SprintWorklogDetailsProps) {
    return (
        <>
            <tr className="bg-(--bg-secondary)/50 border-b border-(--border-color) font-semibold">
                <td colSpan={4} className="px-3 py-2">
                    {sprint.sprintName}
                </td>
                <td className="px-2 py-2 text-center">{sprint.completedSP + (showIncomplete ? sprint.incompleteSP : 0)}</td>
                <td className="px-2 py-2 text-center">{convertSecs(sprint.estimate)}</td>
                {groups.map((grp, i) => (
                    <Fragment key={i}>
                        {grp.users.map((user: any, j: number) => (
                            <td key={j} className="px-1 py-2 text-center">
                                {convertSecs(sprint.worklogs[getUserName(user)!] || 0)}
                            </td>
                        ))}
                        <td className="px-1 py-2 text-center font-bold">{convertSecs(sprint.groupTotal[i] || 0)}</td>
                    </Fragment>
                ))}
                <td className="px-2 py-2 text-center font-bold">{convertSecs(sprint.grandTotal)}</td>
            </tr>
            <IssueTypesList issueTypes={sprint.issuetypes} groups={groups} showIncomplete={showIncomplete} showSubtask={showSubtask} />
        </>
    );
}

interface IssueTypesListProps {
    issueTypes: any[];
    groups: any[];
    showIncomplete: boolean;
    showSubtask: boolean;
}

function IssueTypesList({ issueTypes, groups, showIncomplete, showSubtask }: IssueTypesListProps) {
    return (
        <>
            {issueTypes.map((type, t) => (
                <Fragment key={t}>
                    <tr className="border-b border-(--border-color)/50 bg-(--bg-hover)/30">
                        <td colSpan={4} className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5 font-medium">
                                {type.issuetype.iconUrl && <img src={type.issuetype.iconUrl} alt="" className="w-4 h-4" />}
                                <span>{type.issuetype.name}</span>
                            </div>
                        </td>
                        <td className="px-2 py-1.5 text-center font-medium">
                            {type.completedSP + (showIncomplete ? type.incompleteSP : 0)}
                        </td>
                        <td className="px-2 py-1.5 text-center font-semibold">{convertSecs(type.estimate)}</td>
                        {groups.map((grp, i) => (
                            <Fragment key={i}>
                                {grp.users.map((user: any, j: number) => (
                                    <td key={j} className="px-1 py-1.5 text-center">
                                        {convertSecs(type.worklogs[getUserName(user)!] || 0)}
                                    </td>
                                ))}
                                <td className="px-1 py-1.5 text-center font-semibold">{convertSecs(type.groupTotal[i] || 0)}</td>
                            </Fragment>
                        ))}
                        <td className="px-2 py-1.5 text-center font-semibold">{convertSecs(type.grandTotal)}</td>
                    </tr>
                    <IssueList groups={groups} issues={type.issues} showIncomplete={showIncomplete} showSubtask={showSubtask} />
                </Fragment>
            ))}
        </>
    );
}

interface IssueListProps {
    groups: any[];
    issues: any[];
    showIncomplete: boolean;
    showSubtask: boolean;
}

function IssueList({ groups, issues, showIncomplete, showSubtask }: IssueListProps) {
    return (
        <>
            {issues.map((issue, isu) => {
                if (!showIncomplete && !issue.completed) return null;

                return (
                    <Fragment key={isu}>
                        <tr className="border-b border-(--border-color)/20 hover:bg-(--bg-hover)">
                            <td colSpan={2} className="px-3 py-1 font-medium">
                                {issue.ticketNo}
                            </td>
                            <td className="px-2 py-1 max-w-100 truncate">{issue.summary}</td>
                            <td className="px-2 py-1 text-center">
                                <span
                                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${issue.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                                >
                                    {issue.completed ? 'Completed' : 'Incomplete'}
                                </span>
                            </td>
                            <td className="px-2 py-1 text-center">{issue.storyPoint}</td>
                            <td className="px-2 py-1 text-center">{convertSecs(showSubtask ? issue.estimate : issue.estimateAll)}</td>
                            {groups.map((grp, i) => (
                                <Fragment key={i}>
                                    {grp.users.map((user: any, j: number) => (
                                        <td key={j} className="px-1 py-1 text-center">
                                            {grp.include && user.include
                                                ? convertSecs(
                                                      showSubtask
                                                          ? (issue.worklogs[getUserName(user)!] || {}).total || 0
                                                          : (issue.worklogs[getUserName(user)!] || {}).allTotal || 0,
                                                  )
                                                : null}
                                        </td>
                                    ))}
                                    <td className="px-1 py-1 text-center font-semibold">
                                        {convertSecs(showSubtask ? (issue.groupTotal || {})[i] : (issue.groupTotalAll || {})[i])}
                                    </td>
                                </Fragment>
                            ))}
                            <td className="px-2 py-1 text-center font-semibold">
                                {convertSecs(showSubtask ? issue.grandTotal : issue.grandTotalAll)}
                            </td>
                        </tr>
                        {showSubtask && issue.subtasks && <SubtaskList issue={issue} groups={groups} />}
                    </Fragment>
                );
            })}
        </>
    );
}

interface SubtaskListProps {
    issue: any;
    groups: any[];
}

function SubtaskList({ issue, groups }: SubtaskListProps) {
    return (
        <>
            {issue.subtasks.map((task: any, t: number) => (
                <tr key={t} className="border-b border-(--border-color)/10 hover:bg-(--bg-hover) text-secondary">
                    <td className="px-1 py-1 text-center text-[10px]">-</td>
                    <td className="px-2 py-1">{task.ticketNo}</td>
                    <td className="px-2 py-1 max-w-100 truncate">{task.summary}</td>
                    <td className="px-2 py-1"></td>
                    <td className="px-2 py-1 text-center">{task.storyPoint}</td>
                    <td className="px-2 py-1 text-center">{convertSecs(task.estimate)}</td>
                    {groups.map((grp, i) => (
                        <Fragment key={i}>
                            {grp.users.map((user: any, j: number) => (
                                <td key={j} className="px-1 py-1 text-center">
                                    {grp.include && user.include ? convertSecs((task.worklogs[getUserName(user)!] || {}).total || 0) : null}
                                </td>
                            ))}
                            <td className="px-1 py-1 text-center font-semibold">{convertSecs((task.groupTotal || {})[i])}</td>
                        </Fragment>
                    ))}
                    <td className="px-2 py-1 text-center font-semibold">{convertSecs(task.grandTotal)}</td>
                </tr>
            ))}
        </>
    );
}

export default SprintWiseWorklog;
