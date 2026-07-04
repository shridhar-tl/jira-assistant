import { inject } from '../../services/injector';

function stringifyComment(comment: any): string {
    if (!comment) return '';
    if (typeof comment === 'string') return comment;
    return comment?.toString() || '';
}

function getUserName(user: any, includeEmail?: boolean): string {
    if (!user) return '';
    const name = user.name || user.emailAddress || user.displayName || '';
    return includeEmail && user.emailAddress ? user.emailAddress : name;
}

export function getFieldsToFetch(state: any, epicNameField?: string, options?: any) {
    const fieldsToFetch = ['summary', 'worklog', 'issuetype', 'parent', 'project', 'status', 'assignee', 'reporter'];

    if (state) {
        const hideEstimate = state.fields.hideEstimate;
        let additionalJQL = state.jql?.trim() || '';
        if (additionalJQL) {
            const { projects, users } = options || {};
            additionalJQL = additionalJQL
                .replace(/\$selectedProjects\$|\$selProjects\$/gi, `"${projects?.join('", "') || ''}"`)
                .replace(/\$selectedUsers\$|\$selUsers\$/gi, `"${users?.join('", "') || ''}"`);
            additionalJQL = ` AND (${additionalJQL})`;
        }

        if (!hideEstimate) {
            fieldsToFetch.push('aggregatetimespent');
            fieldsToFetch.push('timeoriginalestimate');
            fieldsToFetch.push('timeestimate');
        }

        if (epicNameField) {
            fieldsToFetch.push(epicNameField);
        }

        const optionalFields = state.fields.optional;
        if (Array.isArray(optionalFields) && optionalFields.length) {
            optionalFields.forEach(({ key }: any) => fieldsToFetch.push(key));
        }

        return { fieldsToFetch: Array.from(new Set(fieldsToFetch)), additionalJQL };
    }

    return { fieldsToFetch };
}

export function generateFlatWorklogData(data: any, groups: any[], sprintName?: string) {
    const result: any[] = [];
    groups.forEach((grp) => {
        grp.users.forEach((usr: any) => {
            const userLogs = data[getUserName(usr, true)]?.logData?.map(getFlatMapper(usr, grp.name, sprintName)) || [];
            result.push(...userLogs);
        });
    });
    return result;
}

function getFlatMapper(usr: any, groupName: string, sprintName?: string) {
    const { $userutils } = inject('UserUtilsService');
    const userName = usr.displayName;

    return (log: any) => ({
        groupName,
        sprintName,
        username: getUserName(usr),
        userDisplay: userName,
        fields: log.fields,
        assignee: log.assignee,
        reporter: log.reporter,
        parent: log.parent,
        parentSummary: log.parentSummary,
        parentUrl: log.parent ? $userutils.getTicketUrl(log.parent) : null,
        epicDisplay: log.epicDisplay,
        epicUrl: log.epicUrl,
        ticketNo: log.ticketNo,
        ticketUrl: log.url,
        issueType: log.issueType,
        summary: log.summary,
        projectKey: log.projectKey,
        projectName: log.projectName,
        statusName: log.statusName,
        logTime: log.logTime,
        logCreated: log.logCreated,
        logUpdated: log.logUpdated,
        timeSpent: log.totalHours,
        originalestimate: log.originalestimate,
        remainingestimate: log.remainingestimate,
        totalLogged: log.totalLogged,
        estVariance: log.estVariance,
        comment: stringifyComment(log.comment),
    });
}

export function generateIssueDayWiseData(groupReport: any, state: any) {
    const { dates, groupedData, weeks } = groupReport;
    let issuesList = groupedData.flatMap((group: any) => group.users.flatMap((u: any) => u.tickets));

    if (state.splitWorklogDays) {
        issuesList = issuesList
            .flatMap((issue: any) => {
                const { logs, fields } = issue;
                return Object.keys(logs).map((k) => {
                    const logItem = logs[k];
                    const { logTime } = logItem[0];
                    const sortIndex = `${logTime.getFullYear()}${String(logTime.getMonth() + 1).padStart(2, '0')}${String(logTime.getDate()).padStart(2, '0')}${String(logTime.getHours()).padStart(2, '0')}${String(logTime.getMinutes()).padStart(2, '0')}_${issue.ticketNo}`;

                    return { ...issue, fields: { ...fields, logDateTime: logTime }, logs: { [k]: logItem }, worklogStartIndex: sortIndex };
                });
            })
            .sort((a: any, b: any) => a.worklogStartIndex.localeCompare(b.worklogStartIndex));
    } else {
        issuesList = issuesList.sort((a: any, b: any) => {
            const aIndex = String(a.worklogStartIndex).padStart(5, '0') + a.ticketNo;
            const bIndex = String(b.worklogStartIndex).padStart(5, '0') + b.ticketNo;
            return aIndex.localeCompare(bIndex);
        });
    }

    return { dates, weeks, issuesList };
}

export function getProjectKeys({ projects, userListMode }: any, ignoreSettings?: boolean) {
    if (!ignoreSettings && userListMode !== '3' && userListMode !== '4') {
        return;
    }

    if (!Array.isArray(projects)) {
        return;
    }

    return Array.from(new Set(projects.map(({ key }: any) => key?.toUpperCase()).filter(Boolean)));
}

export function getUniqueUsersFromGroup(state: any, ignoreSettings?: boolean) {
    const { userGroups, userListMode } = state;
    if (!ignoreSettings && userListMode !== '2' && userListMode !== '4') {
        return;
    }

    const userList: any[] = [];
    userGroups.forEach((grps: any) => {
        grps.users.forEach((gu: any) => {
            gu.groupName = grps.name;
            userList.push(gu);
        });
    });

    return Array.from(new Set(userList.map((u) => getUserName(u, true))));
}
