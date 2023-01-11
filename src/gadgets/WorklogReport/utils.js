import { getUserName } from "../../common/utils";
import { inject } from "../../services/injector-service";

export function getFieldsToFetch(state, epicNameField, options) {
    const fieldsToFetch = ["summary", "worklog", "issuetype", "parent", "project", "status", "assignee", "reporter"];

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
            fieldsToFetch.push("aggregatetimespent");
            fieldsToFetch.push("timeoriginalestimate");
            fieldsToFetch.push("timeestimate");
        }

        if (epicNameField) {
            fieldsToFetch.push(epicNameField);
        }

        return { fieldsToFetch, additionalJQL };
    }

    return { fieldsToFetch };
}

export function generateFlatWorklogData(data, groups, sprintName) {
    return groups.union(grp => grp.users.union(usr =>
        data[getUserName(usr, true)]
            ?.logData?.map(getFlatMapper(usr, grp.name, sprintName)) || [])
    );
}

function getFlatMapper(usr, groupName, sprintName) {
    const { $userutils: { getTicketUrl } } = inject('UserUtilsService');
    const userName = usr.displayName;

    return log => ({
        groupName,
        sprintName,
        username: getUserName(usr),
        userDisplay: userName,
        assignee: log.assignee,
        reporter: log.reporter,
        parent: log.parent,
        parentSummary: log.parentSummary,
        parentUrl: log.parent ? getTicketUrl(log.parent) : null,
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
        comment: log.comment
    });
}

export function getProjectKeys({ projects, userListMode }, ignoreSettings) {
    if (!ignoreSettings && userListMode !== '3' && userListMode !== '4') {
        return;
    }

    if (!Array.isArray(projects)) {
        return;
    }

    return projects.map(({ key }) => key?.toUpperCase()).distinct().filter(Boolean);
}

export function getUniqueUsersFromGroup(state, ignoreSettings) {
    const { userGroups, userListMode } = state;
    if (!ignoreSettings && userListMode !== '2' && userListMode !== '4') { return; }

    const userList = userGroups.union(grps => {
        grps.users.forEach(gu => gu.groupName = grps.name);
        return grps.users;
    });

    return userList.map(u => getUserName(u, true)).distinct();
}