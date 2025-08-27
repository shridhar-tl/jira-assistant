import { asApp, route } from '@forge/api'

const eventsHandlerMap = {
    "avi:jira-software:started:sprint": onSprintStarted,
    "avi:jira-software:closed:sprint": onSprintClosed
};

export async function onSprintAction(event) {
    const handler = eventsHandlerMap[event.eventType];

    if (handler) {
        handler(event);
    } else {
        console.error("Unhandled event type received:", event.eventType);
    }
}

async function onSprintStarted(event) {
    const sprintId = event.sprint.id;

    if (!sprintId) {
        console.error("onSprintStarted: Sprint id unavailable", sprintId);
        return;
    }

    const customFieldsResponse = await asApp().requestJira(route`/rest/api/3/field`);

    const customFields = await customFieldsResponse.json();
    const storyPointFieldId = customFields.find(field => field.name.toLowerCase() === "story points")?.id;

    if (!storyPointFieldId) {
        console.error("onSprintStarted: Story points field not found");
    }

    const response = await asApp().requestJira(route`/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=1000&fields=key,${storyPointFieldId}&jql=${encodeURIComponent('issuetype not in subTaskIssueTypes()')}`, {
        headers: {
            'Accept': 'application/json'
        }
    });

    const { issues } = await response.json();

    if (!issues?.length) {
        console.error("No issues found in sprint", sprintId, issues);
        return;
    }

    const keysMap = issues.reduce((keys, issue) => {
        if (storyPointFieldId) {
            keys[issue.key] = { sp: issue.fields?.[storyPointFieldId] ?? '' };
        } else {
            keys[issue.key] = false;
        }
        return keys;
    }, {});

    const saveRequest = await asApp().requestJira(route`/rest/agile/1.0/sprint/${sprintId}/properties/jaSprintStartInfo`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(keysMap)
    });

    if (saveRequest.ok) {
        console.log("Issue keys stored successfully within sprint of id:", sprintId);
    } else {
        console.error("Failed to store issue keys within sprint of id:", sprintId, saveRequest.status, await saveRequest.text());
    }
}

async function onSprintClosed(event) {
    const sprintId = event.sprint.id;

    if (!sprintId) {
        console.error("onSprintClosed: Sprint id unavailable", sprintId);
        return;
    }
}