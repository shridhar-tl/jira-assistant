import moment from "moment";
import { getUserName } from "../../common/utils";
import { inject } from "../../services/injector-service";
import { generateUserDayWiseData, getUserWiseWorklog } from "./userdaywise/utils_group";
import { getFieldsToFetch } from "./utils";

/* eslint-disable no-unused-vars */
export function generateRangeReport(setState, getState) {
    return async function () {
        const newState = { isLoading: false };
        try {
            setState({ isLoading: true });

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
    const issues = await getIssuesWithWorklogFor(fromDate, toDate, userList, state);

    const { $session: { CurrentUser: { name } } } = inject('JiraService', 'SessionService');

    const { userwiseLog } = getUserWiseWorklog(issues, fromDate, toDate, name?.toLowerCase());
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

async function getIssuesWithWorklogFor(fromDate, toDate, userList, state) {
    const svc = inject('JiraService');

    const { fieldsToFetch, additionalJQL } = getFieldsToFetch(state); // ToDo: pass state appropriately

    const jql = `worklogAuthor in ("${userList.join('","')}") and worklogDate >= '${fromDate.clone().add(-1, 'days').format("YYYY-MM-DD")}' and worklogDate < '${toDate.clone().add(1, 'days').format("YYYY-MM-DD")}'${additionalJQL}`;

    return await svc.$jira.searchTickets(jql, fieldsToFetch);
}