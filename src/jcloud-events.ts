import { asApp, route } from '@forge/api';

interface SprintEvent {
    eventType: string;
    sprint: {
        id: number;
    };
}

interface JiraField {
    id: string;
    name: string;
}

interface SprintIssue {
    key: string;
    fields: Record<string, unknown>;
}

type EventHandler = (event: SprintEvent) => Promise<void>;

const eventsHandlerMap: Record<string, EventHandler> = {
    'avi:jira-software:started:sprint': onSprintStarted,
    'avi:jira-software:closed:sprint': onSprintClosed,
};

export async function onSprintAction(event: SprintEvent): Promise<void> {
    const handler = eventsHandlerMap[event.eventType];

    if (handler) {
        handler(event);
    } else {
        console.error('Unhandled event type received:', event.eventType);
    }
}

async function onSprintStarted(event: SprintEvent): Promise<void> {
    const sprintId = event.sprint.id;

    if (!sprintId) {
        console.error('onSprintStarted: Sprint id unavailable', sprintId);
        return;
    }

    const customFieldsResponse = await asApp().requestJira(route`/rest/api/3/field`);
    const customFields: JiraField[] = await customFieldsResponse.json();
    const storyPointFieldId = customFields.find((field) => field.name.toLowerCase() === 'story points')?.id;

    if (!storyPointFieldId) {
        console.error('onSprintStarted: Story points field not found');
    }

    const fieldsParam = storyPointFieldId ? `key,${storyPointFieldId}` : 'key';
    const jqlParam = encodeURIComponent('issuetype not in subTaskIssueTypes()');

    const response = await asApp().requestJira(
        route`/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=1000&fields=${fieldsParam}&jql=${jqlParam}`,
        {
            headers: {
                Accept: 'application/json',
            },
        },
    );

    const { issues }: { issues?: SprintIssue[] } = await response.json();

    if (!issues?.length) {
        console.error('No issues found in sprint', sprintId, issues);
        return;
    }

    const keysMap = issues.reduce(
        (keys, issue) => {
            if (storyPointFieldId) {
                keys[issue.key] = { sp: issue.fields?.[storyPointFieldId] ?? '' };
            } else {
                keys[issue.key] = false;
            }
            return keys;
        },
        {} as Record<string, { sp: unknown } | false>,
    );

    const saveRequest = await asApp().requestJira(route`/rest/agile/1.0/sprint/${sprintId}/properties/jaSprintStartInfo`, {
        method: 'PUT',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(keysMap),
    });

    if (saveRequest.ok) {
        console.log('Issue keys stored successfully within sprint of id:', sprintId);
    } else {
        console.error('Failed to store issue keys within sprint of id:', sprintId, saveRequest.status, await saveRequest.text());
    }
}

async function onSprintClosed(event: SprintEvent): Promise<void> {
    const sprintId = event.sprint.id;

    if (!sprintId) {
        console.error('onSprintClosed: Sprint id unavailable', sprintId);
        return;
    }

    // ToDo: Implement sprint closed handler
}
