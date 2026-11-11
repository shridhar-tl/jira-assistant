import { adf, mapLimit } from './jira-client.mjs';

const groupableSteps = new Set(['transition', 'comment', 'update', 'link']);

export function createExecutor(ctx) {
    const { admin, config, clock, plan, usersByEmail, issueTypeIds, fields, componentIds, versionIds } = ctx;
    const issuesById = new Map([...plan.epics, ...plan.issues].map((i) => [i.id, i]));
    const keys = new Map();
    const transitionCache = new Map();

    const keyOf = (id) => {
        const key = keys.get(id);
        if (!key) throw new Error(`Issue ${id} has not been created yet`);
        return key;
    };
    const accountOf = (email) => usersByEmail.get(email).accountId;

    function issueFields(issue) {
        const isSubtask = issue.kind === 'subtask';
        const f = {
            project: { key: config.project.key },
            issuetype: { id: issueTypeIds[issue.kind === 'spike' ? 'task' : issue.kind] },
            summary: issue.summary,
            priority: { name: issue.priority },
            labels: issue.kind === 'spike' ? [...new Set([...issue.labels, 'spike'])] : issue.labels,
        };
        if (issue.assignee) f.assignee = { accountId: accountOf(issue.assignee) };
        if (issue.description) f.description = adf(issue.description);
        if (issue.initialPoints !== null && !isSubtask && issue.kind !== 'epic') f[fields.storyPoints] = issue.initialPoints;
        if (issue.estimateMinutes) f.timetracking = { originalEstimate: `${issue.estimateMinutes}m` };
        if (issue.components.length) f.components = issue.components.map((name) => ({ id: componentIds.get(name) }));
        if (issue.versionId && !isSubtask) f.fixVersions = [{ id: versionIds.get(issue.versionId) }];
        if (issue.dueDate) f.duedate = issue.dueDate;
        if (isSubtask) f.parent = { key: keyOf(issue.parentId) };
        else if (issue.epicId) f.parent = { key: keyOf(issue.epicId) };
        return f;
    }

    async function createIssues(ids) {
        const issues = ids.map((id) => issuesById.get(id)).filter((i) => !keys.has(i.id));
        const ordered = [...issues.filter((i) => i.kind !== 'subtask'), ...issues.filter((i) => i.kind === 'subtask')];
        const parents = ordered.filter((i) => i.kind !== 'subtask');
        const subtasks = ordered.filter((i) => i.kind === 'subtask');
        for (const group of [parents, subtasks]) {
            const byReporter = new Map();
            group.forEach((issue) => {
                const client = clientOf(issue.reporter);
                if (!byReporter.has(client)) byReporter.set(client, []);
                byReporter.get(client).push(issue);
            });
            for (const [client, reporterIssues] of byReporter) {
                for (let i = 0; i < reporterIssues.length; i += 50) {
                    const batch = reporterIssues.slice(i, i + 50);
                    const result = await client.post('/rest/api/3/issue/bulk', { issueUpdates: batch.map((issue) => ({ fields: issueFields(issue) })) });
                    if (result.errors?.length) throw new Error(`Issue creation failed: ${JSON.stringify(result.errors).slice(0, 800)}`);
                    result.issues.forEach((created, idx) => keys.set(batch[idx].id, created.key));
                }
            }
        }
    }

    function clientOf(email) {
        return (email && usersByEmail.get(email)?.client) || admin;
    }

    async function transitionId(issue, target) {
        const def = config.workflow.transitions[target];
        if (!def) throw new Error(`No transition configured for ${target}`);
        const typeKey = issue.kind;
        if (!transitionCache.has(typeKey)) {
            const { transitions } = await admin.get(`/rest/api/3/issue/${keyOf(issue.id)}/transitions`);
            transitionCache.set(typeKey, transitions);
        }
        const statusName = config.workflow.statuses[def.to].name.toLowerCase();
        const transitions = transitionCache.get(typeKey);
        const match = transitions.find((t) => t.name === def.name) || transitions.find((t) => t.to.name.toLowerCase() === statusName);
        if (!match) throw new Error(`Transition "${def.name}" not available for ${keyOf(issue.id)}`);
        return match.id;
    }

    async function runIssueStep(step) {
        const issue = issuesById.get(step.id ?? step.inward);
        switch (step.type) {
            case 'transition':
                return clientOf(issue.assignee).post(`/rest/api/3/issue/${keyOf(issue.id)}/transitions`, { transition: { id: await transitionId(issue, step.to) } });
            case 'comment':
                return usersByEmail.get(step.user).client.post(`/rest/api/3/issue/${keyOf(issue.id)}/comment`, { body: adf(step.text) });
            case 'link':
                return admin.post('/rest/api/3/issueLink', { type: { name: step.linkType }, inwardIssue: { key: keyOf(step.inward) }, outwardIssue: { key: keyOf(step.outward) } });
            case 'update': {
                const update = {};
                if ('points' in step.fields) update[fields.storyPoints] = step.fields.points;
                if ('assignee' in step.fields) update.assignee = { accountId: accountOf(step.fields.assignee) };
                if ('versionId' in step.fields) update.fixVersions = [{ id: versionIds.get(step.fields.versionId) }];
                if ('flagged' in step.fields) {
                    if (!fields.flagged) return null;
                    update[fields.flagged] = step.fields.flagged ? [{ value: 'Impediment' }] : null;
                }
                return admin.put(`/rest/api/3/issue/${keyOf(issue.id)}?notifyUsers=false`, { fields: update });
            }
            default:
                throw new Error(`Unknown issue step ${step.type}`);
        }
    }

    async function runGroup(steps) {
        const chains = new Map();
        steps.forEach((step) => {
            const id = step.id ?? step.inward;
            if (!chains.has(id)) chains.set(id, []);
            chains.get(id).push(step);
        });
        await mapLimit([...chains.values()], config.concurrency, async (chain) => {
            for (const step of chain) await runIssueStep(step);
        });
    }

    async function runSteps(steps, sprint) {
        let group = [];
        const flush = async () => {
            if (group.length) await runGroup(group);
            group = [];
        };

        for (const step of steps) {
            if (groupableSteps.has(step.type)) {
                group.push(step);
                continue;
            }
            await flush();
            await runStep(step, sprint);
        }
        await flush();
    }

    async function runStep(step, sprint) {
        switch (step.type) {
            case 'createSprint': {
                const created = await admin.post('/rest/agile/1.0/sprint', {
                    name: sprint.name,
                    originBoardId: ctx.boardId,
                    startDate: clock.sprintFormat(sprint.start),
                    endDate: clock.sprintFormat(sprint.end),
                    ...(step.goal ? { goal: step.goal } : {}),
                });
                sprint.jiraId = created.id;
                return;
            }
            case 'startSprint':
                return admin.post(`/rest/agile/1.0/sprint/${sprint.jiraId}`, { state: 'active', startDate: clock.sprintFormat(sprint.start), endDate: clock.sprintFormat(sprint.end) });
            case 'closeSprint':
                return admin.post(`/rest/agile/1.0/sprint/${sprint.jiraId}`, { state: 'closed' });
            case 'createIssues':
                return createIssues(step.ids);
            case 'moveToSprint':
                for (let i = 0; i < step.ids.length; i += 50) {
                    await admin.post(`/rest/agile/1.0/sprint/${sprint.jiraId}/issue`, { issues: step.ids.slice(i, i + 50).map(keyOf) });
                }
                return;
            case 'moveToBacklog':
                return admin.post('/rest/agile/1.0/backlog/issue', { issues: step.ids.map(keyOf) });
            case 'worklogs':
                await mapLimit(step.logs, config.concurrency, (log) =>
                    usersByEmail.get(log.user).client.post(`/rest/api/3/issue/${keyOf(log.issueId)}/worklog?adjustEstimate=auto&notifyUsers=false`, {
                        started: clock.worklogFormat(log.started),
                        timeSpentSeconds: log.seconds,
                        comment: adf(log.comment),
                    }),
                );
                return;
            case 'releaseVersion': {
                const version = plan.versions.find((v) => v.id === step.versionId);
                return admin.put(`/rest/api/3/version/${versionIds.get(step.versionId)}`, { released: true, releaseDate: clock.dateText(version.releaseDate) });
            }
            default:
                throw new Error(`Unknown step ${step.type}`);
        }
    }

    return {
        keys,
        createEpics: () => createIssues(plan.epics.map((e) => e.id)),
        runSprint: (sprint) => runSteps(sprint.steps, sprint),
        runBacklog: () => runSteps(plan.backlog.steps, null),
    };
}
