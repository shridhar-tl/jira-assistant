import React, { PureComponent, Fragment } from 'react';
import { ScrollableTable, THead, TRow, Column, TBody, NoDataRow } from '../../components/ScrollableTable';
import { getUserName, calcCostPerSecs } from '../../common/utils';

class UserProjectWiseSummary extends PureComponent {
    constructor(props) {
        super(props);
        const { groups, flatData } = props;
        this.state = this.getGroupedData(groups, flatData);
    }

    getGroupedData(groups, flatData) {
        const projects = [];
        const projectsData = {};

        const userWiseWorklogs = flatData.groupBy(wl => wl.username).reduce((obj, u) => {
            obj[u.key] = u.values;
            return obj;
        }, {});

        flatData.groupBy(g => ({ key: g.projectKey, name: g.projectName })).sortBy(g => g.key.key)
            .forEach(({ key: project, values }) => {
                projects.push(project);
                projectsData[project.key] = values;

                project.issueTypes = values.distinct(i => i.issueType);
            });

        const groupedData = groups.map(grp => {
            const { name, users } = grp;
            const overallGroupTotal = { grandTotal: 0, grandTotalCost: 0, projects: {} };
            const group = { name, overallTotal: overallGroupTotal };

            group.users = users.map((usr) => {
                const name = getUserName(usr);
                const { emailAddress, displayName } = usr;
                const user = { name, emailAddress, displayName }; // User object to return

                user.projects = projects.reduce((r_project, project) => { // User project wise data
                    const groupProjectTotal = overallGroupTotal.projects[project.key] || { total: 0, totalCost: 0 };
                    overallGroupTotal.projects[project.key] = groupProjectTotal;
                    const projData = projectsData[project.key]; // All the worklog details related to project

                    if (projData) {

                        const userProjectwiseData = projData.filter(log => log.username === name); // Filter user specific worklog on current project

                        if (userProjectwiseData.length) {
                            const projectIssueTypewiseData = userProjectwiseData.groupBy(d => d.issueType); // Group worklog: User -> Project -> Issue type

                            const projectData = projectIssueTypewiseData.reduce((obj, issueType) => {
                                const total = issueType.values.sum((itr) => itr.timeSpent) || 0;
                                const totalCost = calcCostPerSecs(total, usr.costPerHour);

                                obj[issueType.key] = {
                                    total,
                                    totalCost,
                                    logs: issueType.values
                                };

                                groupProjectTotal[issueType.key] = (groupProjectTotal[issueType.key] || 0) + total;
                                groupProjectTotal[`${issueType.key}_Cost`] = (groupProjectTotal[`${issueType.key}_Cost`] || 0) + totalCost;

                                return obj;
                            }, {});

                            const totalTimeSpent = userProjectwiseData.sum((pr) => pr.timeSpent);
                            projectData.grandTotal = {
                                total: totalTimeSpent,
                                totalCost: calcCostPerSecs(totalTimeSpent, usr.costPerHour),
                                logs: userProjectwiseData
                            };

                            groupProjectTotal.total += projectData.grandTotal.total || 0;
                            groupProjectTotal.totalCost += projectData.grandTotal.totalCost || 0;

                            r_project[project.key] = projectData;
                        }
                    }

                    return r_project;
                }, {}); // End of project map

                const userwiseData = userWiseWorklogs[name] || [];

                const userGrandTotal = userwiseData.sum(wl => wl.timeSpent);
                user.grandTotal = {
                    total: userGrandTotal,
                    totalCost: calcCostPerSecs(userGrandTotal, usr.costPerHour),
                    logs: userwiseData
                };

                overallGroupTotal.grandTotal += user.grandTotal.total;
                overallGroupTotal.grandTotalCost += user.grandTotal.totalCost;

                return user;
            }); // End of user map

            return group;
        }); // End of group map

        const grandTotal = groupedData.reduce((grand, group) => {
            const { overallTotal: { grandTotal, grandTotalCost, projects: groupProjects } } = group;

            grand.grandTotal = (grand.grandTotal || 0) + grandTotal;
            grand.grandTotalCost = (grand.grandTotalCost || 0) + grandTotalCost;

            projects.forEach((p) => {
                const grpdProject = groupProjects[p.key] || {};
                const projectGrand = grand[p.key] || { total: 0, totalCost: 0 };
                grand[p.key] = projectGrand;
                projectGrand.total += grpdProject.total || 0;
                projectGrand.totalCost += grpdProject.totalCost || 0;

                p.issueTypes.forEach(it => {
                    projectGrand[it] = (projectGrand[it] || 0) + (grpdProject[it] || 0);
                    projectGrand[`${it}_Cost`] = (projectGrand[`${it}_Cost`] || 0) + (grpdProject[`${it}_Cost`] || 0);
                });
            });

            return grand;
        }, { grandTotal: 0, grandTotalCost: 0 });

        return { projects, groupedData, grandTotal };
    }

    render() {
        const {
            props: { convertSecs, costView },
            state: { projects, groupedData, grandTotal }
        } = this;

        return (
            <ScrollableTable dataset={groupedData} exportSheetName="Summary - [User project wise]">
                <THead>
                    <TRow>
                        <Column rowSpan={2}>Group Name</Column>
                        <Column rowSpan={2}>User Name</Column>
                        {projects.map((project) => <Column key={project.key} colSpan={project.issueTypes.length + 1}>{project.name}</Column>)}
                        <Column rowSpan={2}>Grand Total</Column>
                    </TRow>
                    <TRow>
                        {projects.map((project, pi) => <Fragment key={pi}>
                                {project.issueTypes.map((it, iti) => <Column key={iti}>{it}</Column>)}
                                <Column>Total</Column>
                            </Fragment>)}
                    </TRow>
                </THead>
                <TBody>
                    {(group, g) => (<Fragment key={g}>
                        {group.users.map((user, ui) => (
                            <tr key={ui}>
                                {ui === 0 && <td rowSpan={group.users.length + 1}>{group.name}</td>}
                                <td>{user.displayName}</td>
                                {
                                    projects.map((project, pid) => {
                                        const userProject = user.projects[project.key] || {};

                                        return <Fragment key={pid}>
                                            {!costView && project.issueTypes.map((it, iti) => {
                                                const projIssueTypeData = userProject[it];
                                                return <td key={iti} className="data-center" exportType="float">{(convertSecs(projIssueTypeData?.total))}</td>;
                                            })}
                                            {!costView && <td className="strong data-center" exportType="float">{convertSecs(userProject.grandTotal?.total)}</td>}

                                            {costView && project.issueTypes.map((it, iti) => {
                                                const projIssueTypeData = userProject[it];
                                                return <td key={iti} className="data-center" exportType="float" title={convertSecs(projIssueTypeData?.total)}>{projIssueTypeData?.totalCost}</td>;
                                            })}
                                            {costView && <td className="strong data-center" exportType="float" title={convertSecs(userProject.grandTotal?.total)}>{userProject.grandTotal?.totalCost}</td>}
                                        </Fragment>;
                                    })
                                }
                                {!costView && <td className="strong data-center" exportType="float">{convertSecs(user.grandTotal.total)}</td>}
                                {costView && <td className="strong data-center" exportType="float" title={convertSecs(user.grandTotal.total)}>{user.grandTotal.totalCost}</td>}
                            </tr>
                        ))}
                        <tr className="strong data-center">
                            <td className="data-right">Group Total <span className="fa fa-arrow-right" /></td>
                            {
                                projects.map((project, pid) => {
                                    const projectOverallTotal = group.overallTotal.projects[project.key] || {};

                                    if (!costView) {
                                        return <Fragment key={pid}>
                                            {project.issueTypes.map((it, iti) => <td key={iti} exportType="float">{convertSecs(projectOverallTotal[it])}</td>)}
                                            <td exportType="float">{convertSecs(projectOverallTotal.total)}</td>
                                        </Fragment>;
                                    } else {
                                        return <Fragment key={pid}>
                                            {project.issueTypes.map((it, iti) => <td key={iti} exportType="float" title={convertSecs(projectOverallTotal[it])}>{projectOverallTotal[`${it}_Cost`]}</td>)}
                                            <td exportType="float" title={convertSecs(projectOverallTotal.total)}>{projectOverallTotal.totalCost}</td>
                                        </Fragment>;
                                    }
                                })
                            }
                            {!costView && <td exportType="float">{convertSecs(group.overallTotal.grandTotal)}</td>}
                            {costView && <td exportType="float" title={convertSecs(group.overallTotal.grandTotal)}>{group.overallTotal.grandTotalCost}</td>}
                        </tr>
                    </Fragment>)
                    }
                </TBody>
                <tfoot>
                    <tr className="strong data-center">
                        <td colSpan={2} className="data-right">Grand total <span className="fa fa-arrow-right" /></td>

                        {!costView && projects.map((project, pi) => (<Fragment key={pi}>
                                {project.issueTypes.map((it, iti) => <td key={iti} exportType="float">{convertSecs(grandTotal[project.key][it])}</td>)}
                                <td exportType="float">{convertSecs(grandTotal[project.key].total)}</td>
                            </Fragment>))}
                        {!costView && <td exportType="float">{convertSecs(grandTotal.grandTotal)}</td>}

                        {costView && projects.map((project, pi) => (<Fragment key={pi}>
                                {project.issueTypes.map((it, iti) => <td key={iti} exportType="float" title={convertSecs(grandTotal[project.key][it])}>{grandTotal[project.key][`${it}_Cost`]}</td>)}
                                <td exportType="float" title={convertSecs(grandTotal[project.key].total)}>{grandTotal[project.key].totalCost}</td>
                            </Fragment>))}
                        {costView && <td exportType="float" title={convertSecs(grandTotal.grandTotal)}>{grandTotal.grandTotalCost}</td>}
                    </tr>
                </tfoot>
                <NoDataRow span={11}>No worklog details available</NoDataRow>
            </ScrollableTable>
        );
    }
}

export default UserProjectWiseSummary;