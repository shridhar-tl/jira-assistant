import moment from 'moment';

import { inject } from '../../services/injector';

import {
    filterDaysWithoutWorklog,
    generateUserDayWiseData,
    getEpicDetails,
    getUserWiseWorklog,
    getWeekHeader,
} from './userdaywise/utils_group';
import { generateFlatWorklogData, generateIssueDayWiseData, getFieldsToFetch, getProjectKeys, getUniqueUsersFromGroup } from './utils';

export function generateRangeReport(setState: any, getState: any) {
    return async function () {
        const newState: any = { loadingData: false };
        try {
            setState({ loadingData: true, errorTitle: '', errorMessage: '' });

            const {
                dateRange: { fromDate, toDate },
            } = getState();
            if (!fromDate || !toDate) {
                return null;
            }

            const result = await generateWorklogReportForDateRange(
                moment(fromDate).startOf('day'),
                moment(toDate).endOf('day'),
                getState(),
            );

            if (!result) {
                const { $message } = inject('MessageService');
                $message.warning('No worklog information returned matching your filters', 'No data available');
                return;
            }

            const { groupReport, flatWorklogs, issueDayWise } = result;
            newState.groupReport = groupReport;
            newState.flatWorklogs = flatWorklogs;
            newState.issueDayWise = issueDayWise;

            newState.reportLoaded = true;
        } catch (err: any) {
            console.error('Error pulling range report:', err);
            const { $message } = inject('MessageService');

            const errorMessage = err.message || err.error?.errorMessages?.[0] || 'Unknown error. Check the console for more details';
            const errorTitle = err.message ? 'Worklog report' : 'Unknown error';
            setState({ errorTitle, errorMessage });
            $message.error(errorMessage, errorTitle);
        } finally {
            setState(newState);
        }
    };
}

async function generateWorklogReportForDateRange(fromDate: moment.Moment, toDate: moment.Moment, state: any) {
    const {
        $session: {
            CurrentUser: { name, epicNameField },
        },
    } = inject('SessionService');
    const issues = await getIssuesWithWorklogFor(fromDate, toDate, state, epicNameField?.id);
    if (!issues.length) {
        return;
    }

    const epicDetails = await getEpicDetails(issues, epicNameField?.id);

    const input = prepareInputForGeneration(issues, fromDate, toDate, (name || '').toLowerCase(), state, epicDetails);
    const issueDayWise = getIssueDayWiseData(input, state);

    const { userListMode, userGroups: savedGroups, reportUserGrp } = state;
    const useGroups = userListMode === '2' && reportUserGrp === '1';
    if (!useGroups && reportUserGrp !== '1') {
        const { groupByFunc, getGroupName } = getGroupingFunction(reportUserGrp, epicNameField?.id, epicDetails);

        const flatWorklogs: any[] = [];
        const groupReport: any = issues
            .reduce((groups: any[], issue: any) => {
                const groupKey = groupByFunc(issue);
                let group = groups.find((g) => g.key === groupKey);
                if (!group) {
                    group = { key: groupKey, values: [] };
                    groups.push(group);
                }
                group.values.push(issue);
                return groups;
            }, [])
            .map(({ values }: any) => ({ issues: values, grpName: getGroupName(values) }))
            .sort((a: any, b: any) => a.grpName.localeCompare(b.grpName))
            .reduce(
                (obj: any, { grpName, issues: grpIssues }: any) => {
                    const groupedInput = prepareInputForGeneration(
                        grpIssues,
                        fromDate,
                        toDate,
                        (name || '').toLowerCase(),
                        state,
                        epicDetails,
                        obj.dates,
                    );
                    const {
                        flatWorklogs: flatData,
                        groupReport: { dates, groupedData: g },
                    } = formGroupedWorklogs(groupedInput, state, useGroups ? savedGroups : undefined, grpName) as any;

                    obj.dates = dates;

                    if (!(g as any).grandTotal) {
                        return obj;
                    }

                    flatWorklogs.push(...flatData);

                    const [grp] = g;
                    grp.name = grpName;
                    delete grp.isDummy;
                    const { groupedData } = obj;
                    groupedData.push(grp);

                    groupedData.grandTotal = (groupedData.grandTotal || 0) + ((g as any).grandTotal || 0);
                    groupedData.grandTotalCost = (groupedData.grandTotalCost || 0) + ((g as any).grandTotalCost || 0);
                    groupedData.total = sumAndMergeObjectProps(groupedData.total, (g as any).total);
                    groupedData.totalCost = sumAndMergeObjectProps(groupedData.totalCost, (g as any).totalCost);

                    return obj;
                },
                { groupedData: [] as any },
            );

        groupReport.dates = filterDaysWithoutWorklog(state.daysToHide, groupReport.dates);
        groupReport.weeks = getWeekHeader(groupReport.dates);

        return { flatWorklogs, groupReport, issueDayWise };
    } else {
        const result: any = formGroupedWorklogs(input, state, useGroups && savedGroups);
        result.issueDayWise = issueDayWise;

        return result;
    }
}

function getGroupingFunction(reportUserGrp: string, epicNameField?: string, epicDetails?: any) {
    if (reportUserGrp === '3') {
        return {
            getGroupName: (issues: any[]) => {
                const { name } = issues[0].fields.issuetype;
                return name;
            },
            groupByFunc: (issue: any) => issue.fields.issuetype.id,
        };
    } else if (reportUserGrp === '4' && epicNameField) {
        return {
            getGroupName: (issues: any[]) => {
                const epic = issues[0].fields[epicNameField];
                const summary = epic && epicDetails?.[epic]?.fields.summary;
                const display = summary ? `${epic} - ${summary}` : epic;

                return display || '<Issues without epic>';
            },
            groupByFunc: (issue: any) => issue.fields[epicNameField],
        };
    } else {
        return {
            getGroupName: (issues: any[]) => {
                const { name, key } = issues[0].fields.project;
                return `${name} (${key})`;
            },
            groupByFunc: (issue: any) => issue.fields.project.key,
        };
    }
}

function sumAndMergeObjectProps(obj1: any, obj2: any) {
    if (!obj1) {
        return obj2;
    } else if (!obj2) {
        return obj1;
    } else {
        const newObj = { ...obj1 };
        Object.keys(obj2).forEach((k) => {
            newObj[k] = (newObj[k] || 0) + (obj2[k] || 0);
        });
        return newObj;
    }
}

function formGroupedWorklogs(input: any, _state: any, userGroups?: any[], grpName?: string) {
    const { userwiseLog, userwiseLogArr, settings } = input;

    if (!userGroups || !userGroups.length) {
        userGroups = [createGroupObjectWithUsers(userwiseLogArr, grpName)];
    }

    const groupReport = generateUserDayWiseData(userwiseLog, userGroups, settings);
    const flatWorklogs = generateFlatWorklogData(userwiseLog, userGroups);

    return { groupReport, flatWorklogs };
}

function prepareInputForGeneration(
    issues: any[],
    fromDate: moment.Moment,
    toDate: moment.Moment,
    name: string | undefined,
    state: any,
    epicDetails: any,
    dates?: any,
) {
    const { userwiseLog, userwiseLogArr } = getUserWiseWorklog(issues, fromDate, toDate, name, state, epicDetails);

    const settings = {
        fromDate: fromDate.toDate(),
        toDate: toDate.toDate(),
        timeZone: state.timeZone,
        dates,
        daysToHide: !dates ? state.daysToHide : null,
    };

    return { userwiseLog, userwiseLogArr, settings };
}

function getIssueDayWiseData(input: any, state: any) {
    const { userwiseLog, userwiseLogArr, settings } = input;

    const userGroups = [createGroupObjectWithUsers(userwiseLogArr)];
    const groupReport = generateUserDayWiseData(userwiseLog, userGroups, settings);
    const issueDayWise = generateIssueDayWiseData(groupReport, state);

    return issueDayWise;
}

const noGroupName = '';
function createGroupObjectWithUsers(users: any[], name?: string) {
    const result = users.reduce(
        (obj, u) => {
            obj.totalHours += u.totalHours || 0;
            obj.totalCost += u.totalCost || 0;
            return obj;
        },
        { totalHours: 0, totalCost: 0 },
    );

    return { isDummy: true, name: name || noGroupName, users, ...result };
}

async function getIssuesWithWorklogFor(fromDate: moment.Moment, toDate: moment.Moment, state: any, epicNameField?: string) {
    const svc = inject('JiraService');

    const { fieldsToFetch, additionalJQL } = getFieldsToFetch(state, epicNameField, {
        projects: getProjectKeys(state, true),
        users: getUniqueUsersFromGroup(state, true),
    });

    const userList = getUniqueUsersFromGroup(state);
    const projectKeys = getProjectKeys(state);

    if (userList?.length === 0 || projectKeys?.length === 0) {
        throw Error('Either userlist or project is required for generating worklog report');
    }

    const authorJQL = userList ? `worklogAuthor in ("${userList.join('","')}")` : '';
    const projectJQL = projectKeys ? `project in ("${projectKeys.join('","')}")` : '';
    const settJQL = authorJQL || projectJQL ? `(${authorJQL}${authorJQL && projectJQL ? ' OR ' : ''}${projectJQL}) AND ` : '';

    const dateJQL = `(worklogDate >= '${fromDate.clone().add(-1, 'days').format('YYYY-MM-DD')}' and worklogDate < '${toDate.clone().add(1, 'days').format('YYYY-MM-DD')}') `;
    const jql = `${settJQL}${dateJQL}${additionalJQL}`;

    return await svc.$jira.searchTickets(jql, fieldsToFetch, undefined, {
        worklogStartDate: fromDate.toDate(),
        worklogEndDate: toDate.toDate(),
    });
}
