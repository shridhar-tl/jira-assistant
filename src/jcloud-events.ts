import { asApp, route } from '@forge/api';

export { onPlannerLeaveCleanup } from './pages/planning/forge/leave-cleanup';

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

interface SprintIssuePage {
    issues?: SprintIssue[];
    total?: number;
}

const sprintIssuePageSize = 100;
const maxSprintIssuePages = 50;

type EventHandler = (event: SprintEvent) => Promise<void>;

const eventsHandlerMap: Record<string, EventHandler> = {
    'avi:jira-software:started:sprint': onSprintStarted,
    'avi:jira-software:closed:sprint': onSprintClosed,
};

export async function onSprintAction(event: SprintEvent): Promise<void> {
    const handler = eventsHandlerMap[event.eventType];

    if (handler) {
        await handler(event);
    } else {
        console.error('Unhandled event type received:', event.eventType);
    }
}

async function readSprintIssues(sprintId: number, fields: string[]): Promise<SprintIssue[] | null> {
    const issues: SprintIssue[] = [];
    for (let page = 0; page < maxSprintIssuePages; page++) {
        const query = new URLSearchParams({ startAt: String(issues.length), maxResults: String(sprintIssuePageSize), fields: fields.join(','), jql: 'issuetype not in subTaskIssueTypes()' });
        const response = await asApp().requestJira(route`/rest/agile/1.0/sprint/${sprintId}/issue?${query}`, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            console.error('Unable to read the issues of sprint', sprintId, response.status, await response.text());
            return null;
        }
        const { issues: pageIssues = [], total = 0 }: SprintIssuePage = await response.json();
        issues.push(...pageIssues);
        if (!pageIssues.length || issues.length >= total) {
            break;
        }
    }
    return issues;
}

async function onSprintStarted(event: SprintEvent): Promise<void> {
    const sprintId = event.sprint.id;

    if (!sprintId) {
        console.error('onSprintStarted: Sprint id unavailable', sprintId);
        return;
    }

    const customFieldsResponse = await asApp().requestJira(route`/rest/api/3/field`);
    const customFields: JiraField[] = customFieldsResponse.ok ? await customFieldsResponse.json() : [];
    const storyPointFieldId = customFields.find((field) => field.name.toLowerCase() === 'story points')?.id;

    if (!storyPointFieldId) {
        console.error('onSprintStarted: Story points field not found');
    }

    const issues = await readSprintIssues(sprintId, storyPointFieldId ? ['key', storyPointFieldId] : ['key']);

    if (!issues?.length) {
        console.error('No issues found in sprint', sprintId);
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
