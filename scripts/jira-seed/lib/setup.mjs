import { randomUUID } from 'node:crypto';

import * as content from './content.mjs';
import { mapLimit } from './jira-client.mjs';

export async function ensureProject(admin, config, adminAccountId) {
    const { key } = config.project;
    try {
        return await admin.get(`/rest/api/3/project/${key}`);
    } catch (err) {
        if (err.status !== 404 || !config.project.create) throw err;
    }
    console.log(`Creating project ${key}`);
    await admin.post('/rest/api/3/project', {
        key,
        name: config.project.name,
        projectTypeKey: 'software',
        projectTemplateKey: config.project.templateKey,
        leadAccountId: adminAccountId,
        assigneeType: 'UNASSIGNED',
        description: config.project.description,
    });
    return admin.get(`/rest/api/3/project/${key}`);
}

export async function resetProject(admin, project, boardId, concurrency) {
    for (;;) {
        const { issues = [] } = await admin.get(`/rest/api/3/search/jql?jql=${encodeURIComponent(`project = ${project.key} AND issuetype not in subTaskIssueTypes()`)}&fields=key&maxResults=100`);
        if (!issues.length) break;
        await mapLimit(issues, concurrency, (issue) => admin.delete(`/rest/api/3/issue/${issue.key}?deleteSubtasks=true`));
        console.log(`Deleted ${issues.length} issues`);
    }
    for (const sprint of await getBoardSprints(admin, boardId)) {
        await admin.delete(`/rest/agile/1.0/sprint/${sprint.id}`);
    }
    console.log(`Reset project ${project.key}`);
}

export async function getBoardSprints(admin, boardId) {
    const sprints = [];
    let startAt = 0;
    for (;;) {
        const page = await admin.get(`/rest/agile/1.0/board/${boardId}/sprint?startAt=${startAt}&maxResults=50`);
        sprints.push(...page.values);
        if (page.isLast || !page.values.length) return sprints;
        startAt += page.values.length;
    }
}

export async function silenceNotifications(admin, project) {
    const name = `${project.key} - seeding (no notifications)`;
    const { values = [] } = await admin.get('/rest/api/3/notificationscheme?maxResults=200');
    let scheme = values.find((s) => s.name === name);
    if (!scheme) {
        scheme = await admin.post('/rest/api/3/notificationscheme', { name, description: 'Assigned while seeding demo data' });
    }
    await admin.put(`/rest/api/3/project/${project.key}`, { notificationScheme: Number(scheme.id) });
}

export async function resolveBoard(admin, config, project) {
    if (config.boardId) return config.boardId;
    const { values } = await admin.get(`/rest/agile/1.0/board?projectKeyOrId=${project.key}&type=scrum`);
    if (!values?.length) throw new Error(`No scrum board found for project ${project.key}`);
    return values[0].id;
}

export async function resolveFields(admin, config, boardId) {
    const fields = await admin.get('/rest/api/3/field');
    let storyPoints = config.storyPointsField;
    if (!storyPoints) {
        const { estimation } = await admin.get(`/rest/agile/1.0/board/${boardId}/configuration`);
        storyPoints = estimation?.field?.fieldId;
    }
    if (!storyPoints?.startsWith('customfield_')) {
        throw new Error('Board does not estimate using a story points field. Set storyPointsField in config.');
    }
    const flagged = config.flaggedField || fields.find((f) => f.name === 'Flagged')?.id || null;
    return { storyPoints, flagged };
}

export async function resolveIssueTypes(admin, project, config) {
    const { issueTypes } = await admin.get(`/rest/api/3/issue/createmeta/${project.key}/issuetypes`);
    return Object.fromEntries(
        Object.entries(config.issueTypes).map(([kind, name]) => {
            const type = issueTypes.find((t) => t.name.toLowerCase() === name.toLowerCase());
            if (!type) throw new Error(`Issue type "${name}" not available in project ${project.key}`);
            return [kind, type.id];
        }),
    );
}

async function findStatuses(admin) {
    const statuses = [];
    let startAt = 0;
    for (;;) {
        const page = await admin.get(`/rest/api/3/statuses/search?startAt=${startAt}&maxResults=200`);
        statuses.push(...page.values);
        if (page.isLast || !page.values.length) return statuses;
        startAt += page.values.length;
    }
}

export async function ensureWorkflow(admin, config, project) {
    const wf = config.workflow;
    const workflowName = `${project.key} Seed Workflow`;
    const schemeName = `${project.key} Seed Workflow Scheme`;

    const existingWorkflows = await admin.get(`/rest/api/3/workflows/search?queryString=${encodeURIComponent(workflowName)}&maxResults=50`);
    if (!existingWorkflows.values?.some((w) => w.name === workflowName)) {
        const allStatuses = await findStatuses(admin);
        const resolutions = await admin.get('/rest/api/3/resolution');
        const refs = {};
        const statusPayload = Object.entries(wf.statuses).map(([key, def]) => {
            refs[key] = randomUUID();
            const existing = allStatuses.find((s) => s.name.toLowerCase() === def.name.toLowerCase());
            return { ...(existing ? { id: existing.id } : {}), statusReference: refs[key], name: def.name, statusCategory: def.category };
        });
        const resolutionId = (name) => {
            const res = resolutions.find((r) => r.name.toLowerCase() === name.toLowerCase());
            if (!res) throw new Error(`Resolution "${name}" does not exist`);
            return res.id;
        };

        const transitions = [{ id: '1', name: 'Create', type: 'INITIAL', toStatusReference: refs.todo, links: [] }];
        Object.values(wf.transitions).forEach((t, idx) => {
            const actions = [];
            if (t.resolution !== undefined) {
                actions.push({ ruleKey: 'system:update-field', parameters: { field: 'resolution', value: t.resolution ? resolutionId(t.resolution) : '', mode: 'REPLACE' } });
            }
            transitions.push({ id: String(11 + idx * 10), name: t.name, type: 'GLOBAL', toStatusReference: refs[t.to], links: [], actions });
        });

        await admin.post('/rest/api/3/workflows/create', {
            scope: { type: 'GLOBAL' },
            statuses: statusPayload,
            workflows: [
                {
                    name: workflowName,
                    description: 'Workflow used for seeded demo data',
                    statuses: Object.values(refs).map((statusReference) => ({ statusReference, properties: {} })),
                    transitions,
                },
            ],
        });
        console.log(`Created workflow ${workflowName}`);
    }

    const schemes = await admin.get('/rest/api/3/workflowscheme?maxResults=50');
    let scheme = schemes.values.find((s) => s.name === schemeName);
    if (!scheme) {
        scheme = await admin.post('/rest/api/3/workflowscheme', { name: schemeName, description: 'Workflow scheme for seeded demo data', defaultWorkflow: workflowName });
    }

    const current = await admin.get(`/rest/api/3/workflowscheme/project?projectId=${project.id}`);
    if (String(current.values?.[0]?.workflowScheme?.id) !== String(scheme.id)) {
        await admin.put('/rest/api/3/workflowscheme/project', { workflowSchemeId: String(scheme.id), projectId: String(project.id) });
        console.log(`Assigned ${schemeName} to ${project.key}`);
    }
}

export async function ensureBoardColumns(admin, config, boardId) {
    const statuses = await findStatuses(admin);
    const idOf = (key) => statuses.find((s) => s.name.toLowerCase() === config.workflow.statuses[key].name.toLowerCase())?.id;
    const columns = [
        { name: 'To Do', keys: ['todo'] },
        { name: 'In Progress', keys: ['inprogress'] },
        { name: 'Code Review', keys: ['review'] },
        { name: 'QA', keys: ['qa'] },
        { name: 'Done', keys: ['done', 'closed'] },
    ];
    try {
        const model = await admin.get(`/rest/greenhopper/1.0/rapidviewconfig/editmodel.json?rapidViewId=${boardId}`);
        await admin.put('/rest/greenhopper/1.0/rapidviewconfig/columns', {
            currentStatisticsField: { id: model.rapidListConfig.currentStatisticsField.id },
            rapidViewId: boardId,
            mappedColumns: columns.map((c) => ({ name: c.name, isKanPlanColumn: false, mappedStatuses: c.keys.map((k) => ({ id: idOf(k) })).filter((s) => s.id) })),
        });
        console.log('Board columns configured');
    } catch (err) {
        console.warn(`Could not configure board columns automatically, map statuses to columns in board settings. ${err.message}`);
    }
}

export async function ensureScreenFields(admin, project, fieldIds) {
    const { values } = await admin.get(`/rest/api/3/issuetypescreenscheme/project?projectId=${project.id}`);
    const itssId = values?.[0]?.issueTypeScreenScheme?.id;
    if (!itssId) return;

    const mappings = (await admin.get(`/rest/api/3/issuetypescreenscheme/mapping?issueTypeScreenSchemeId=${itssId}`)).values;
    const schemeIds = [...new Set(mappings.map((m) => m.screenSchemeId))];
    const schemes = (await admin.get(`/rest/api/3/screenscheme?${schemeIds.map((id) => `id=${id}`).join('&')}`)).values;
    const screenIds = [...new Set(schemes.flatMap((s) => Object.values(s.screens)))];

    for (const screenId of screenIds) {
        const tabs = await admin.get(`/rest/api/3/screens/${screenId}/tabs`);
        const present = new Set();
        for (const tab of tabs) {
            (await admin.get(`/rest/api/3/screens/${screenId}/tabs/${tab.id}/fields`)).forEach((f) => present.add(f.id));
        }
        for (const fieldId of fieldIds.filter((f) => f && !present.has(f))) {
            await admin.post(`/rest/api/3/screens/${screenId}/tabs/${tabs[0].id}/fields`, { fieldId });
            console.log(`Added ${fieldId} to screen ${screenId}`);
        }
    }
}

export async function createComponents(admin, project, usersByEmail, lead) {
    const existing = await admin.get(`/rest/api/3/project/${project.key}/components`);
    const map = new Map();
    for (const component of content.components) {
        const body = { name: component.name, description: component.description, leadAccountId: usersByEmail.get(lead).accountId, assigneeType: 'PROJECT_DEFAULT' };
        const found = existing.find((c) => c.name === component.name);
        const saved = found ? await admin.put(`/rest/api/3/component/${found.id}`, body) : await admin.post('/rest/api/3/component', { ...body, project: project.key });
        map.set(component.name, saved.id);
    }
    return map;
}

export async function createVersions(admin, project, versions, clock) {
    const existing = await admin.get(`/rest/api/3/project/${project.key}/versions`);
    const map = new Map();
    for (const version of [...versions].sort((a, b) => a.releaseDate - b.releaseDate)) {
        const body = {
            name: version.name,
            description: version.description,
            startDate: clock.dateText(version.startDate),
            releaseDate: clock.dateText(version.releaseDate),
            released: false,
            archived: false,
        };
        const found = existing.find((v) => v.name === version.name);
        const saved = found ? await admin.put(`/rest/api/3/version/${found.id}`, body) : await admin.post('/rest/api/3/version', { ...body, projectId: Number(project.id) });
        map.set(version.id, saved.id);
    }
    return map;
}
