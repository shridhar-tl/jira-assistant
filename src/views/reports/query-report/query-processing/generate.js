import { extractInfo } from "./extractor";

export async function generateReport(json, sql) {
    try {
        const extracts = extractInfo(json);
        // ToDo: next step: need to get additional info as part of column list in filter and on conditions
        // need to use global cache store for columns list
        validateColumns(extracts);

        console.log(sql);
        console.log(extracts);
    } catch (err) {
        // ToDo: show message about the error
        console.error(err);
    }
}

function validateColumns(extracts) {
    const { tables } = extracts;
}

const filterColumns = () => [
    { label: 'Issue Key', value: 'issuekey', type: 'column' },
    { label: 'Issuetype', value: 'issuetype', type: 'column' },
    { label: 'formatDate', value: 'formatDate', type: 'function' },
    { label: 'formatTime', value: 'formatTime', type: 'function' },
];

const allTables = [
    { label: 'Issues', value: 'issues', type: 'table' },
    { label: 'Worklogs', value: 'worklogs', type: 'table' },
    { label: 'Change Logs', value: 'changelogs', type: 'table' },
    { label: 'Issue Links', value: 'issue_links', type: 'table' },
    { label: 'Attachments', value: 'issue_attachments', type: 'table' },
    { label: 'Comments', value: 'issue_comments', type: 'table' },
    { label: 'issuesFromSprint()', value: 'issuesFromSprint(@sprintList, false)', type: 'function' },
    { label: 'issuesFromActiveSprint()', value: 'issuesFromActiveSprint(@sprintBoard)', type: 'function' },
    { label: 'issuesFromLastSprint()', value: 'issuesFromLastSprint(1, false)', type: 'function' },
];

function filterTables(filter) {
    filter = filter?.toLowerCase().trim();

    if (!filter) {
        return allTables;
    }

    return allTables.filter(t => t.label.toLowerCase().startsWith(filter) || t.value.startsWith(filter));
}

export const getSuggestions = (text, isTable) => (isTable ? filterTables(text) : filterColumns(text));
