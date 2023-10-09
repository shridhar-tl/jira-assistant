import moment from 'moment';
import { inject } from 'src/services';

export function getEpicDetailsForSprints(sprintWiseIssues, sprintLists, epicNameField) {
    const epicInfoMap = getEpicInfoMap(sprintWiseIssues, sprintLists, epicNameField);

    return getEpicList(epicInfoMap, sprintLists);
}

//#region Internal functions
const noEpicId = 'No Epic';
function getEpicInfoMap(sprintWiseIssues, sprintLists, epicNameField) {
    const epicInfoMap = {};

    function addToEpic(epicLink, issue) {
        if (!epicLink) { epicLink = noEpicId; }
        let epicInfo = epicInfoMap[epicLink];
        if (!epicInfo) {
            epicInfo = { issuesList: [] };
            epicInfoMap[epicLink] = epicInfo;
        }

        epicInfo.issuesList.push(issue);

        return epicInfo;
    }

    sprintLists.forEach(({ id: sid }, index) => {
        sprintWiseIssues[sid].forEach((issue) => {
            const { fields: { [epicNameField?.id]: epicLink } } = issue;

            const epicInfo = addToEpic(epicLink, issue);

            if (!epicLink) {
                return;
            }

            if (epicInfo.startSprintIndex === undefined || epicInfo.startSprintIndex > index) {
                epicInfo.startSprintIndex = index;
                epicInfo.startSprintId = sid;
            }

            if (epicInfo.endSprintIndex === undefined || epicInfo.endSprintIndex < index) {
                epicInfo.endSprintIndex = index;
            }
        });
    });

    return epicInfoMap;
}

async function getEpicList(epicInfoMap, sprintLists) {
    const keys = Object.keys(epicInfoMap).filter(epic => epic !== noEpicId);
    if (!keys?.length) {
        return;
    }

    const { $ticket, $jira } = inject('TicketService', 'JiraService');
    const customFields = await $jira.getCustomFields();
    const issueColorField = customFields.filter(f => f.name.toLowerCase() === 'issue color')[0];

    const epicList = await $ticket.fetchTicketDetails(keys, ['key', 'summary', 'name', 'duedate', 'issuetype', issueColorField?.id]);

    epicList.push({ key: noEpicId, fields: { summary: 'Issues without Epic', issuetype: { name: 'No Epic' } } });
    const epicMap = epicList.reduce((map, t) => {
        map[t.key] = t;
        const epicInfo = epicInfoMap[t.key];
        t.child = epicInfo.issuesList;

        t.startSprintIndex = epicInfo.startSprintIndex;
        t.endSprintIndex = epicInfo.endSprintIndex;
        t.startSprintId = epicInfo.startSprintId;

        let { duedate } = t.fields;

        if (duedate) {
            duedate = moment(duedate);
            let dueSprintIndex = sprintLists.findIndex(sprint => duedate.isBetween(sprint.startDate, sprint.endDate));

            if (dueSprintIndex === -1) {
                const lastSprintIndex = sprintLists.length - 1;
                const lastSprint = sprintLists[lastSprintIndex];
                if (duedate.isAfter(lastSprint.endDate)) {
                    dueSprintIndex = lastSprintIndex;
                }
            }

            t.dueSprintIndex = dueSprintIndex;
        }

        return map;
    }, {});

    return { epicList: epicList.sortBy(e => e.startSprintIndex), epicMap, issueColorField };
}

//#endregion