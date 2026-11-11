#!/usr/bin/env node
/*
 * Seeds a Jira Cloud scrum project with a realistic team history: epics, releases, components, sprints with
 * carry-over, scope changes, re-estimation, blocked and reopened issues, sub-tasks, and worklogs per user.
 *
 * Usage:
 *   node scripts/jira-seed/seed-sprint-data.mjs --config <config.json> [--env <file>] [--dry-run] [--reset] [--max-sprints <n>]
 *
 *   --dry-run       print the plan without touching Jira
 *   --reset         delete every issue and sprint of the configured project before seeding (versions and components are reused)
 *   --max-sprints   seed only the first n sprints (useful to validate a new configuration)
 *
 * Env (from --env file or process env):
 *   JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN   admin account used for project, sprint and issue operations
 *   <user.tokenEnv>                             API token of each user in config.users (worklogs and comments are authored by the token owner)
 *
 * Jira stamps a sprint's completeDate with the time it is closed, so closed sprints keep the supplied planned
 * start/end dates but report the time this script ran as their completion date.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { createClock } from './lib/clock.mjs';
import { defaultConfig, mergeDeep } from './lib/config.mjs';
import { createExecutor } from './lib/executor.mjs';
import { createJiraClient } from './lib/jira-client.mjs';
import { buildPlan, planStats } from './lib/planner.mjs';
import {
    createComponents,
    createVersions,
    ensureBoardColumns,
    ensureProject,
    ensureScreenFields,
    ensureWorkflow,
    resetProject,
    resolveBoard,
    resolveFields,
    resolveIssueTypes,
    silenceNotifications,
} from './lib/setup.mjs';

function loadEnvFile(path) {
    if (!existsSync(path)) {
        throw new Error(`Env file not found: ${path}`);
    }
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (match && process.env[match[1]] === undefined) {
            process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
        }
    }
}

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`);
    }
    return value;
}

async function resolveUsers(config, baseUrl, dryRun) {
    if (!config.users.length) {
        throw new Error('config.users must list at least one user');
    }
    return Promise.all(
        config.users.map(async (u) => {
            if (dryRun && !process.env[u.tokenEnv]) {
                console.warn(`${u.tokenEnv} not set, ${u.email} is not validated in dry run`);
                return { ...u, displayName: u.email };
            }
            const client = createJiraClient(baseUrl, u.email, requireEnv(u.tokenEnv));
            const me = await client.get('/rest/api/3/myself');
            if (me.emailAddress && me.emailAddress.toLowerCase() !== u.email.toLowerCase()) {
                throw new Error(`Token in ${u.tokenEnv} belongs to ${me.emailAddress}, expected ${u.email}`);
            }
            return { ...u, accountId: me.accountId, displayName: me.displayName, client };
        }),
    );
}

function printPlan(plan, clock, usersByEmail) {
    const name = (email) => usersByEmail.get(email).displayName.split(' ')[0];
    console.log(`Team: ${plan.team.users.map((u) => `${u.displayName} (${u.role})`).join(', ')}`);
    console.log(`Releases: ${plan.versions.map((v) => `${v.name}@${clock.dateText(v.releaseDate)}`).join(', ')}`);
    for (const sp of plan.sprints) {
        const hours = {};
        const logs = sp.steps.find((s) => s.type === 'worklogs')?.logs || [];
        logs.forEach((w) => (hours[name(w.user)] = (hours[name(w.user)] || 0) + w.seconds / 3600));
        const s = sp.summary;
        console.log(
            [
                sp.name.padEnd(15),
                sp.state.padEnd(6),
                (sp.profile || '').padEnd(13),
                `${clock.display(sp.start)} -> ${clock.display(sp.end)}`,
                `${String(s.committed).padStart(2)} issues (${s.carriedIn} carried in, +${s.added} added, -${s.descoped} descoped, ${s.carriedOut ?? 0} carried out)`,
                `${String(s.points).padStart(2)} SP`,
                `${String(s.worklogs).padStart(3)} logs`,
                Object.entries(hours)
                    .map(([n, h]) => `${n} ${h.toFixed(0)}h`)
                    .join(' '),
            ].join(' | '),
        );
    }
    const stats = planStats(plan);
    console.log(`Total: ${stats.sprints} sprints, ${stats.epics} epics, ${stats.issues} issues (+${plan.backlog.count} backlog), ${stats.versions} versions, ${stats.worklogs} worklogs`);
}

async function run() {
    const { values: args } = parseArgs({
        options: {
            config: { type: 'string' },
            env: { type: 'string' },
            'dry-run': { type: 'boolean', default: false },
            reset: { type: 'boolean', default: false },
            'max-sprints': { type: 'string' },
        },
    });
    if (!args.config) {
        throw new Error('--config <file> is required');
    }
    if (args.env) {
        loadEnvFile(resolve(args.env));
    }

    const config = mergeDeep(defaultConfig, JSON.parse(readFileSync(resolve(args.config), 'utf8')));
    const dryRun = args['dry-run'];
    const maxSprints = args['max-sprints'] ? parseInt(args['max-sprints'], 10) : Infinity;
    const baseUrl = requireEnv('JIRA_BASE_URL').replace(/\/+$/, '');
    const admin = createJiraClient(baseUrl, requireEnv('JIRA_EMAIL'), requireEnv('JIRA_API_TOKEN'));
    const clock = createClock(config.utcOffset, config.now);

    const adminUser = await admin.get('/rest/api/3/myself');
    const users = await resolveUsers(config, baseUrl, dryRun);
    const usersByEmail = new Map(users.map((u) => [u.email, u]));

    const plan = buildPlan(config, clock, users);
    printPlan(plan, clock, usersByEmail);
    if (dryRun) return;

    const project = await ensureProject(admin, config, adminUser.accountId);
    const boardId = await resolveBoard(admin, config, project);
    if (args.reset) await resetProject(admin, project, boardId, config.concurrency);
    if (config.silenceNotifications) await silenceNotifications(admin, project);
    if (config.workflow.create) {
        await ensureWorkflow(admin, config, project);
        await ensureBoardColumns(admin, config, boardId);
    }

    const fields = await resolveFields(admin, config, boardId);
    if (config.ensureScreenFields) {
        await ensureScreenFields(admin, project, [fields.storyPoints, fields.flagged, 'timetracking', 'components', 'fixVersions', 'duedate', 'labels', 'priority']);
    }
    const issueTypeIds = await resolveIssueTypes(admin, project, config);
    const componentIds = await createComponents(admin, project, usersByEmail, plan.team.lead.email);
    const versionIds = await createVersions(admin, project, plan.versions, clock);
    console.log(`Project ${project.key}, board ${boardId}, story points ${fields.storyPoints}, flagged ${fields.flagged}`);

    const executor = createExecutor({ admin, config, clock, plan, usersByEmail, issueTypeIds, fields, componentIds, versionIds, boardId });
    await executor.createEpics();

    let processed = 0;
    for (const sprint of plan.sprints) {
        if (processed >= maxSprints) {
            console.log(`Stopped after ${processed} sprints (--max-sprints)`);
            return;
        }
        await executor.runSprint(sprint);
        processed++;
        console.log(`Seeded ${sprint.name} (${sprint.state}, ${sprint.profile}): ${sprint.summary.worklogs} worklogs`);
    }
    await executor.runBacklog();
    console.log(`Seeded backlog: ${plan.backlog.count} issues. Done.`);
}

run().catch((err) => {
    console.error(err.stack || err.message || err);
    process.exit(1);
});
