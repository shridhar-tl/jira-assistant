import React, { PureComponent, Fragment } from 'react';
import { ScrollableTable, THead, TRow, Column, TBody, NoDataRow } from '../../components/ScrollableTable';

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

        flatData.groupBy(g => { return { key: g.projectKey, name: g.projectName }; }).sortBy(g => g.key.key)
            .forEach(({ key: project, values }) => {
                projects.push(project);
                projectsData[project.key] = values;

                project.issueTypes = values.distinct(i => i.issueType);
            });

        const groupedData = groups.map(grp => {
            const { name, users } = grp;
            const overallGroupTotal = { grandTotal: 0, projects: {} };
            const group = { name, overallTotal: overallGroupTotal };

            group.users = users.map(({ name, emailAddress, displayName }) => {
                const user = { name, emailAddress, displayName }; // User object to return

                user.projects = projects.reduce((r_project, project) => { // User project wise data
                    const groupProjectTotal = overallGroupTotal.projects[project.key] || { total: 0 };
                    overallGroupTotal.projects[project.key] = groupProjectTotal;
                    const projData = projectsData[project.key]; // All the worklog details related to project

                    if (projData) {

                        const userProjectwiseData = projData.filter(log => log.username === name); // Filter user specific worklog on current project

                        if (userProjectwiseData.length) {
                            const projectIssueTypewiseData = userProjectwiseData.groupBy(d => d.issueType); // Group worklog: User -> Project -> Issue type

                            const projectData = projectIssueTypewiseData.reduce((obj, issueType) => {
                                const total = issueType.values.sum((itr) => itr.timeSpent) || 0;

                                obj[issueType.key] = {
                                    total,
                                    logs: issueType.values
                                };

                                groupProjectTotal[issueType.key] = (groupProjectTotal[issueType.key] || 0) + total;

                                return obj;
                            }, {});

                            projectData.grandTotal = {
                                total: userProjectwiseData.sum((pr) => pr.timeSpent),
                                logs: userProjectwiseData
                            };

                            groupProjectTotal.total += projectData.grandTotal.total || 0;

                            r_project[project.key] = projectData;
                        }
                    }

                    return r_project;
                }, {}); // End of project map

                const userwiseData = userWiseWorklogs[name] || [];

                user.grandTotal = {
                    total: userwiseData.sum(wl => wl.timeSpent),
                    logs: userwiseData
                };

                overallGroupTotal.grandTotal += user.grandTotal.total;

                return user;
            }); // End of user map

            return group;
        }); // End of group map

        const grandTotal = groupedData.reduce((grand, group) => {
            const { overallTotal: { grandTotal, projects: groupProjects } } = group;

            grand.grandTotal = (grand.grandTotal || 0) + grandTotal;

            projects.forEach((p) => {
                const grpdProject = groupProjects[p.key];
                const projectGrand = grand[p.key] || { total: 0 };
                grand[p.key] = projectGrand;
                projectGrand.total += grpdProject.total || 0;

                p.issueTypes.forEach(it => {
                    const issueTypeSum = grpdProject[it] || 0;
                    projectGrand[it] = (projectGrand[it] || 0) + issueTypeSum;
                });
            });

            return grand;
        }, { grandTotal: 0 });
        return { projects, projectsData, groupedData, grandTotal };
    }



    render() {
        const {
            props: { convertSecs },
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
                    {projects.map((project, pi) => {
                        return (<TRow key={pi}>
                            {project.issueTypes.map((it, iti) => <Column key={iti}>{it}</Column>)}
                            <Column>Total</Column>
                        </TRow>);
                    })}
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
                                            {project.issueTypes.map((it, iti) => {
                                                const projIssueTypeData = userProject[it];
                                                return <td key={iti} className="data-center">{(projIssueTypeData ? convertSecs(projIssueTypeData.total) : null)}</td>;
                                            })}
                                            <td className="strong data-center">{userProject.grandTotal ? convertSecs(userProject.grandTotal.total) : null}</td>
                                        </Fragment>;
                                    })
                                }
                                <td className="strong data-center">{convertSecs(user.grandTotal.total)}</td>
                            </tr>
                        ))}
                        <tr className="strong data-center">
                            <td className="data-right">Group Total <span className="fa fa-arrow-right" /></td>
                            {
                                projects.map((project, pid) => {
                                    const projectOverallTotal = group.overallTotal.projects[project.key] || {};

                                    return <Fragment key={pid}>
                                        {project.issueTypes.map((it, iti) => <td key={iti}>{convertSecs(projectOverallTotal[it])}</td>)}
                                        <td>{convertSecs(projectOverallTotal.total)}</td>
                                    </Fragment>;
                                })
                            }
                            <td>{convertSecs(group.overallTotal.grandTotal)}</td>
                        </tr>
                    </Fragment>)
                    }
                </TBody>
                <tfoot>
                    <tr className="strong data-center">
                        <td colSpan={2} className="data-right">Grand total <span className="fa fa-arrow-right" /></td>

                        {projects.map((project, pi) => {
                            return (<Fragment key={pi}>
                                {project.issueTypes.map((it, iti) => <td key={iti}>{convertSecs(grandTotal[project.key][it])}</td>)}
                                <td>{convertSecs(grandTotal[project.key].total)}</td>
                            </Fragment>);
                        })}
                        <td>{convertSecs(grandTotal.grandTotal)}</td>
                    </tr>
                </tfoot>
                <NoDataRow span={11}>No worklog details available</NoDataRow>
            </ScrollableTable>
        );
    }
}

export default UserProjectWiseSummary;