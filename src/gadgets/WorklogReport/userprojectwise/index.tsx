import React, { Fragment, memo, useEffect, useState } from 'react';

import { ScrollableTable, THead, TRow, Column, TBody } from '../../../components/shared';
import { useWorklogStore } from '../datastore';
import { useConvertSecs } from '../userdaywise/useReportUtils';

function getUserName(user: any): string {
    if (!user) return '';
    return user.name || user.emailAddress || user.displayName || '';
}

function calcCostPerSecs(secs: number, costPerHour?: number): number {
    if (!costPerHour || !secs) return 0;
    return parseFloat(((secs / 3600) * costPerHour).toFixed(2));
}

interface UserProjectWiseSummaryProps {
    exportSheetName: string;
    boardId?: string;
}

export default function UserProjectWiseSummary({ exportSheetName, boardId }: UserProjectWiseSummaryProps) {
    const state = useWorklogStore();
    const flatWorklogs = boardId ? state[`flatWorklogs_${boardId}`] : state.flatWorklogs;
    const groups = state.groupReport?.groupedData;
    const { fields } = state;
    const costView = fields?.showCostReport;

    const [localState, setLocalState] = useState<any>(false);

    useEffect(() => {
        if (groups && flatWorklogs) {
            setLocalState(getGroupedData(groups, flatWorklogs));
        }
    }, [groups, flatWorklogs]);

    const convertSecs = useConvertSecs();

    if (!localState) {
        return <span>Loading...</span>;
    }

    const { projects, groupedData, grandTotal } = localState;
    const hideGroup = groupedData?.length === 1 && !groupedData[0].name;

    return (
        <ScrollableTable className="table-bordered" exportSheetName={exportSheetName}>
            <THead>
                <TRow>
                    {!hideGroup && <Column rowSpan={2}>Group Name</Column>}
                    <Column rowSpan={2}>User Name</Column>
                    {projects.map((project: any) => (
                        <Column key={project.key} colSpan={project.issueTypes.length + 1}>
                            {project.name}
                        </Column>
                    ))}
                    <Column rowSpan={2}>Grand Total</Column>
                </TRow>
                <TRow>
                    {projects.map((project: any, pi: number) => (
                        <Fragment key={pi}>
                            {project.issueTypes.map((it: string, iti: number) => (
                                <Column key={iti}>{it}</Column>
                            ))}
                            <Column>Total</Column>
                        </Fragment>
                    ))}
                </TRow>
            </THead>
            <TBody>
                {groupedData.map((group: any, g: number) => (
                    <UserGroup
                        key={g}
                        group={group}
                        projects={projects}
                        costView={costView}
                        convertSecs={convertSecs}
                        hideGroup={hideGroup}
                    />
                ))}
            </TBody>
            {!hideGroup && <Footer grandTotal={grandTotal} projects={projects} costView={costView} convertSecs={convertSecs} />}
        </ScrollableTable>
    );
}

const UserGroup = memo(function ({ hideGroup, projects, costView, group, convertSecs }: any) {
    return (
        <Fragment>
            {group.users.map((user: any, ui: number) => (
                <tr key={ui}>
                    {!hideGroup && ui === 0 && <td rowSpan={group.users.length + 1}>{group.name}</td>}
                    <td>{user.displayName}</td>
                    {projects.map((project: any, pid: number) => {
                        const userProject = user.projects[project.key] || {};

                        return (
                            <Fragment key={pid}>
                                {!costView &&
                                    project.issueTypes.map((it: string, iti: number) => {
                                        const projIssueTypeData = userProject[it];
                                        return (
                                            <td key={iti} className="data-center" data-export-type="float">
                                                {convertSecs(projIssueTypeData?.total)}
                                            </td>
                                        );
                                    })}
                                {!costView && (
                                    <td className="strong data-center" data-export-type="float">
                                        {convertSecs(userProject.grandTotal?.total)}
                                    </td>
                                )}

                                {costView &&
                                    project.issueTypes.map((it: string, iti: number) => {
                                        const projIssueTypeData = userProject[it];
                                        return (
                                            <td
                                                key={iti}
                                                className="data-center"
                                                data-export-type="float"
                                                title={convertSecs(projIssueTypeData?.total)}
                                            >
                                                {projIssueTypeData?.totalCost}
                                            </td>
                                        );
                                    })}
                                {costView && (
                                    <td
                                        className="strong data-center"
                                        data-export-type="float"
                                        title={convertSecs(userProject.grandTotal?.total)}
                                    >
                                        {userProject.grandTotal?.totalCost}
                                    </td>
                                )}
                            </Fragment>
                        );
                    })}
                    {!costView && (
                        <td className="strong data-center" data-export-type="float">
                            {convertSecs(user.grandTotal.total)}
                        </td>
                    )}
                    {costView && (
                        <td className="strong data-center" data-export-type="float" title={convertSecs(user.grandTotal.total)}>
                            {user.grandTotal.totalCost}
                        </td>
                    )}
                </tr>
            ))}
            <tr className="strong data-center">
                <td className="data-right">
                    Group Total <span className="fa fa-arrow-right" />
                </td>
                {projects.map((project: any, pid: number) => {
                    const projectOverallTotal = group.overallTotal.projects[project.key] || {};

                    if (!costView) {
                        return (
                            <Fragment key={pid}>
                                {project.issueTypes.map((it: string, iti: number) => (
                                    <td key={iti} data-export-type="float">
                                        {convertSecs(projectOverallTotal[it])}
                                    </td>
                                ))}
                                <td data-export-type="float">{convertSecs(projectOverallTotal.total)}</td>
                            </Fragment>
                        );
                    } else {
                        return (
                            <Fragment key={pid}>
                                {project.issueTypes.map((it: string, iti: number) => (
                                    <td key={iti} data-export-type="float" title={convertSecs(projectOverallTotal[it])}>
                                        {projectOverallTotal[`${it}_Cost`]}
                                    </td>
                                ))}
                                <td data-export-type="float" title={convertSecs(projectOverallTotal.total)}>
                                    {projectOverallTotal.totalCost}
                                </td>
                            </Fragment>
                        );
                    }
                })}
                {!costView && <td data-export-type="float">{convertSecs(group.overallTotal.grandTotal)}</td>}
                {costView && (
                    <td data-export-type="float" title={convertSecs(group.overallTotal.grandTotal)}>
                        {group.overallTotal.grandTotalCost}
                    </td>
                )}
            </tr>
        </Fragment>
    );
});

const Footer = memo(function ({ grandTotal, projects, costView, convertSecs }: any) {
    return (
        <tfoot>
            <tr className="strong data-center">
                <td colSpan={2} className="data-right">
                    Grand total <span className="fa fa-arrow-right" />
                </td>

                {!costView &&
                    projects.map((project: any, pi: number) => (
                        <Fragment key={pi}>
                            {project.issueTypes.map((it: string, iti: number) => (
                                <td key={iti} data-export-type="float">
                                    {convertSecs(grandTotal[project.key][it])}
                                </td>
                            ))}
                            <td data-export-type="float">{convertSecs(grandTotal[project.key].total)}</td>
                        </Fragment>
                    ))}
                {!costView && <td data-export-type="float">{convertSecs(grandTotal.grandTotal)}</td>}

                {costView &&
                    projects.map((project: any, pi: number) => (
                        <Fragment key={pi}>
                            {project.issueTypes.map((it: string, iti: number) => (
                                <td key={iti} data-export-type="float" title={convertSecs(grandTotal[project.key][it])}>
                                    {grandTotal[project.key][`${it}_Cost`]}
                                </td>
                            ))}
                            <td data-export-type="float" title={convertSecs(grandTotal[project.key].total)}>
                                {grandTotal[project.key].totalCost}
                            </td>
                        </Fragment>
                    ))}
                {costView && (
                    <td data-export-type="float" title={convertSecs(grandTotal.grandTotal)}>
                        {grandTotal.grandTotalCost}
                    </td>
                )}
            </tr>
        </tfoot>
    );
});

function getGroupedData(groups: any[], flatData: any[]) {
    const projects: any[] = [];
    const projectsData: any = {};

    const userWiseWorklogs = flatData.reduce((obj: any, wl) => {
        const key = wl.username;
        if (!obj[key]) {
            obj[key] = [];
        }
        obj[key].push(wl);
        return obj;
    }, {});

    const projectGroups: any = {};
    flatData.forEach((item) => {
        const key = item.projectKey;
        if (!projectGroups[key]) {
            projectGroups[key] = { key: item.projectKey, name: item.projectName, values: [] };
        }
        projectGroups[key].values.push(item);
    });

    Object.values(projectGroups)
        .sort((a: any, b: any) => a.key.localeCompare(b.key))
        .forEach(({ key, name, values }: any) => {
            const project = { key, name };
            projects.push(project);
            projectsData[key] = values;

            (project as any).issueTypes = Array.from(new Set(values.map((i: any) => i.issueType)));
        });

    const groupedData = groups.map((grp) => {
        const { name, users } = grp;
        const overallGroupTotal: any = { grandTotal: 0, grandTotalCost: 0, projects: {} };
        const group: any = { name, overallTotal: overallGroupTotal };

        group.users = users.map((usr: any) => {
            const name = getUserName(usr);
            const { emailAddress, displayName } = usr;
            const user: any = { name, emailAddress, displayName };

            user.projects = projects.reduce((r_project: any, project: any) => {
                const groupProjectTotal = overallGroupTotal.projects[project.key] || { total: 0, totalCost: 0 };
                overallGroupTotal.projects[project.key] = groupProjectTotal;
                const projData = projectsData[project.key];

                if (projData) {
                    const userProjectwiseData = projData.filter((log: any) => log.username === name);

                    if (userProjectwiseData.length) {
                        const issueTypeGroups: any = {};
                        userProjectwiseData.forEach((item: any) => {
                            const key = item.issueType;
                            if (!issueTypeGroups[key]) {
                                issueTypeGroups[key] = [];
                            }
                            issueTypeGroups[key].push(item);
                        });

                        const projectData = Object.entries(issueTypeGroups).reduce((obj: any, [issueType, values]: [string, any]) => {
                            const total = values.reduce((sum: number, itr: any) => sum + (itr.timeSpent || 0), 0);
                            const totalCost = calcCostPerSecs(total, usr.costPerHour);

                            obj[issueType] = {
                                total,
                                totalCost,
                                logs: values,
                            };

                            groupProjectTotal[issueType] = (groupProjectTotal[issueType] || 0) + total;
                            groupProjectTotal[`${issueType}_Cost`] = (groupProjectTotal[`${issueType}_Cost`] || 0) + totalCost;

                            return obj;
                        }, {});

                        const totalTimeSpent = userProjectwiseData.reduce((sum: number, pr: any) => sum + (pr.timeSpent || 0), 0);
                        projectData.grandTotal = {
                            total: totalTimeSpent,
                            totalCost: calcCostPerSecs(totalTimeSpent, usr.costPerHour),
                            logs: userProjectwiseData,
                        };

                        groupProjectTotal.total += projectData.grandTotal.total || 0;
                        groupProjectTotal.totalCost += projectData.grandTotal.totalCost || 0;

                        r_project[project.key] = projectData;
                    }
                }

                return r_project;
            }, {});

            const userwiseData = userWiseWorklogs[name] || [];

            const userGrandTotal = userwiseData.reduce((sum: number, wl: any) => sum + (wl.timeSpent || 0), 0);
            user.grandTotal = {
                total: userGrandTotal,
                totalCost: calcCostPerSecs(userGrandTotal, usr.costPerHour),
                logs: userwiseData,
            };

            overallGroupTotal.grandTotal += user.grandTotal.total;
            overallGroupTotal.grandTotalCost += user.grandTotal.totalCost;

            return user;
        });

        return group;
    });

    const grandTotal = groupedData.reduce(
        (grand: any, group: any) => {
            const {
                overallTotal: { grandTotal, grandTotalCost, projects: groupProjects },
            } = group;

            grand.grandTotal = (grand.grandTotal || 0) + grandTotal;
            grand.grandTotalCost = (grand.grandTotalCost || 0) + grandTotalCost;

            projects.forEach((p: any) => {
                const grpdProject = groupProjects[p.key] || {};
                const projectGrand = grand[p.key] || { total: 0, totalCost: 0 };
                grand[p.key] = projectGrand;
                projectGrand.total += grpdProject.total || 0;
                projectGrand.totalCost += grpdProject.totalCost || 0;

                p.issueTypes.forEach((it: string) => {
                    projectGrand[it] = (projectGrand[it] || 0) + (grpdProject[it] || 0);
                    projectGrand[`${it}_Cost`] = (projectGrand[`${it}_Cost`] || 0) + (grpdProject[`${it}_Cost`] || 0);
                });
            });

            return grand;
        },
        { grandTotal: 0, grandTotalCost: 0 },
    );

    return { projects, groupedData, grandTotal };
}
