import { getUserName } from "../../common/utils";
import { inject } from "../../services/injector-service";

export function getFieldsToFetch(state, epicNameField) {
    const fieldsToFetch = ["summary", "worklog", "issuetype", "parent", "project", "status", "assignee", "reporter"];

    if (state) {
        const hideEstimate = state.fields.hideEstimate;
        let additionalJQL = state.jql?.trim() || '';
        if (additionalJQL) {
            additionalJQL = ` AND (${additionalJQL})`;
        }

        if (!hideEstimate) {
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
        timeSpent: log.totalHours,
        originalestimate: log.originalestimate,
        remainingestimate: log.remainingestimate,
        totalLogged: log.totalLogged,
        estVariance: log.estVariance,
        comment: log.comment
    });
}