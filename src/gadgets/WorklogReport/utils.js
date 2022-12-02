export function getFieldsToFetch(pageSettings, epicNameField, jql) {
    const fieldsToFetch = ["summary", "worklog", "issuetype", "parent", "project", "status", "assignee", "reporter"];

    // ToDo: Use state appropriately
    if (pageSettings) {
        const hideEstimate = pageSettings.hideEstimate;
        let additionalJQL = (jql || '').trim();
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