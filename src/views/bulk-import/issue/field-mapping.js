const fieldTicketNo = "issuekey";
const parentKey = "parent";
const fieldProject = "project";
const fieldIssueType = "issuetype";
const fieldAssignee = "assignee";
const fieldReporter = "reporter";
const originalEstimate = "timetracking.originalEstimate";
const remainingEstimate = "timetracking.remainingEstimate";

const fieldMapping = {
    issuekey: fieldTicketNo,
    ticketno: fieldTicketNo,
    ticket: fieldTicketNo,
    issue: fieldTicketNo,
    key: fieldTicketNo,
    id: fieldTicketNo,

    project: fieldProject,
    projectkey: fieldProject,
    projectid: fieldProject,

    parent: parentKey,
    parentkey: parentKey,
    parentticket: parentKey,
    parentticketno: parentKey,
    parentissue: parentKey,
    parentid: parentKey,

    status: "status",
    issuestatus: "status",

    summary: "summary",
    priority: "priority",
    resolution: "resolution",
    description: "description",

    estimate: originalEstimate,
    originalestimate: originalEstimate,
    initialestimate: originalEstimate,
    remaining: remainingEstimate,
    remainingestimate: remainingEstimate,
    currentestimate: remainingEstimate,

    assignee: fieldAssignee,
    assignto: fieldAssignee,
    assignedto: fieldAssignee,

    reporter: fieldReporter,
    reported: fieldReporter,
    reportedby: fieldReporter,

    issuetype: fieldIssueType,
    type: fieldIssueType,

    label: "labels"
};

export function transformHeader(customFields) {
    return (c) => {
        // As prototype functions of array are passed to this function, need to check if this is string
        if (!c || typeof c !== 'string') {
            return null;
        }

        c = c.replace(/ /g, '').toLowerCase();
        let fieldName = fieldMapping[c] || null;

        if (!fieldName) {
            const field = customFields.first(cf =>
                cf.id.toLowerCase() === c // Match with field id
                || cf.name.replace(/ /g, '').toLowerCase() === c // Try match with name field
                || (cf.clauseNames && cf.clauseNames.some(cn => cn.replace(/ /g, '').toLowerCase() === c)) // Try find in clause names
            );

            if (field) {
                fieldName = field.id;
            }
        }

        return fieldName || c;
    };
}