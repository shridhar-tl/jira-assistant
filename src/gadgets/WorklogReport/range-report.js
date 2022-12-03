import moment from "moment";
import { getUserName } from "../../common/utils";
import { inject } from "../../services/injector-service";
import { generateUserDayWiseData, getUserWiseWorklog } from "./userdaywise/utils_group";
import { getFieldsToFetch } from "./utils";

/* eslint-disable no-unused-vars */
export function generateRangeReport(setState, getState) {
    return async function () {
        const newState = { loadingData: false };
        try {
            setState({ loadingData: true });

            const { userGroups, dateRange: { fromDate, toDate } } = getState();

            newState.groupReport = await generateWorklogReportForDateRange(moment(fromDate).startOf('day'),
                moment(toDate).endOf('day'), userGroups, getState());

            newState.reportLoaded = true;
        } finally {
            setState(newState);
        }
    };
}

async function generateWorklogReportForDateRange(fromDate, toDate, userGroup, state) {
    const userList = getUniqueUsersFromGroup(userGroup);
    const { $session: { CurrentUser: { name, epicNameField } } } = inject('JiraService', 'SessionService');
    const issues = await getIssuesWithWorklogFor(fromDate, toDate, userList, state, epicNameField?.id);

    const { userwiseLog } = getUserWiseWorklog(issues, fromDate, toDate, name?.toLowerCase(), state);
    const settings = {
        fromDate: fromDate.toDate(),
        toDate: toDate.toDate()
    };

    return generateUserDayWiseData(userwiseLog, userGroup, settings);
}

function getUniqueUsersFromGroup(userGroup) {
    const userList = userGroup.union(grps => {
        grps.users.forEach(gu => gu.groupName = grps.name);
        return grps.users;
    });

    return userList.map(u => getUserName(u, true)).distinct();
}

async function getIssuesWithWorklogFor(fromDate, toDate, userList, state, epicNameField) {
    const svc = inject('JiraService');

    const { fieldsToFetch, additionalJQL } = getFieldsToFetch(state, epicNameField);

    const jql = `worklogAuthor in ("${userList.join('","')}") and worklogDate >= '${fromDate.clone().add(-1, 'days').format("YYYY-MM-DD")}' and worklogDate < '${toDate.clone().add(1, 'days').format("YYYY-MM-DD")}'${additionalJQL}`;

    return await svc.$jira.searchTickets(jql, fieldsToFetch);
}