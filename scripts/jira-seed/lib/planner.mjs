import { DAY, HOUR, MINUTE, clamp, parseTime, randomTime, roundTo } from './clock.mjs';
import * as content from './content.mjs';
import { createRng } from './random.mjs';

const QUARTER = 15 * MINUTE;
const priorityWeights = { Highest: 0.03, High: 0.2, Medium: 0.55, Low: 0.17, Lowest: 0.05 };
const bugPriorityWeights = { Highest: 0.08, High: 0.35, Medium: 0.45, Low: 0.12 };
const priorityRank = { Highest: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };
const extraLabels = {
    story: ['customer-request', 'quick-win', 'ux', 'needs-design', 'performance'],
    bug: ['regression', 'customer-reported', 'ux', 'performance', 'security'],
    task: ['tech-debt', 'security', 'devops', 'automation'],
    spike: ['research', 'tech-debt'],
};
const fibonacci = [1, 2, 3, 5, 8, 13];

export function buildPlan(config, clock, users) {
    const rng = createRng(config.seed);
    const team = describeTeam(users);
    const schedule = buildSprintSchedule(config, rng, clock);
    const ctx = {
        config,
        clock,
        rng,
        team,
        schedule,
        issues: [],
        versions: buildVersions(config, rng, clock, schedule),
        epics: [],
        holidays: new Set(config.holidays),
        leaves: buildLeaves(config, rng, clock, schedule, users),
        traits: new Map(users.map((u) => [u.email, { hoursShift: rng.float([-0.6, 0.8]), chunkShift: rng.float([-0.4, 0.6]) }])),
        summaries: createSummaryFactory(rng),
        bugHistory: [],
        pendingBacklog: [],
        nextItemId: 1,
        nextIssueId: 1,
    };
    ctx.epics = buildEpics(ctx);

    let carried = [];
    for (const sprint of schedule) {
        sprint.steps = [];
        if (sprint.state === 'future') {
            planFutureSprint(ctx, sprint);
        } else {
            carried = planWorkingSprint(ctx, sprint, carried);
        }
    }

    const backlog = planBacklog(ctx);
    ctx.versions.filter((v) => v.released && !v.releasedPlanned).forEach((v) => {
        v.releasedPlanned = true;
        backlog.steps.push({ type: 'releaseVersion', versionId: v.id });
    });
    return { team, versions: ctx.versions, epics: ctx.epics, issues: ctx.issues, sprints: schedule, backlog };
}

function describeTeam(users) {
    const withRoles = users.map((u, idx) => ({
        ...u,
        role: u.role || (idx === 0 ? 'lead' : users.length > 2 && idx === users.length - 1 ? 'qa' : 'dev'),
    }));
    const devs = withRoles.filter((u) => u.role !== 'qa');
    const qas = withRoles.filter((u) => u.role === 'qa');
    if (!devs.length) {
        throw new Error('At least one user with role lead or dev is required');
    }
    return { users: withRoles, devs, qas: qas.length ? qas : devs, lead: withRoles.find((u) => u.role === 'lead') || devs[0] };
}

function buildSprintSchedule(config, rng, clock) {
    const s = config.sprint;
    const cycle = s.lengthWeeks * 7 * DAY;
    const today = clock.startOfDay(clock.nowWall);

    let anchor;
    if (s.anchorDate) {
        anchor = clock.parseDate(s.anchorDate);
    } else {
        anchor = today - ((clock.weekday(today) - s.startWeekday + 7) % 7) * DAY;
        if (s.lengthWeeks > 1) anchor -= 7 * DAY;
    }
    while (anchor > today) anchor -= cycle;
    while (anchor + cycle <= today) anchor += cycle;

    const pastCount = Math.round((s.pastMonths * 30.44 * DAY) / cycle);
    const futureCount = Math.round((s.futureMonths * 30.44 * DAY) / cycle);
    const endOffsetDays = (s.lengthWeeks - 1) * 7 + ((s.endWeekday - s.startWeekday + 7) % 7);
    const [windowStart, windowEnd] = s.allowedWindow.map(parseTime);
    const sprints = [];

    let previousEnd = null;
    for (let i = -pastCount; i <= futureCount; i++) {
        const startDay = anchor + i * cycle;
        let start = startDay + randomTime(rng, s.startTime);
        if (previousEnd !== null && previousEnd >= start - 30 * MINUTE) {
            start = clamp(previousEnd + rng.int(30, 150) * MINUTE, previousEnd + 30 * MINUTE, startDay + parseTime('16:00'));
        }

        const endDay = startDay + endOffsetDays * DAY;
        let end;
        if (rng.chance(s.spillToMondayChance)) {
            end = startDay + cycle + randomTime(rng, s.spillEndTime);
        } else {
            end = endDay + randomTime(rng, s.endTime);
            if (rng.chance(s.shiftChance)) end += rng.int(-s.shiftMinutes, s.shiftMinutes) * MINUTE;
            end = clamp(end, endDay + windowStart, endDay + windowEnd);
        }
        previousEnd = end;

        const index = sprints.length;
        const state = end <= clock.nowWall ? 'closed' : start <= clock.nowWall ? 'active' : 'future';
        sprints.push({ index, number: index + 1, name: `${config.project.key} ${s.namePrefix} ${index + 1}`, start, end, state });
    }
    return sprints;
}

function buildVersions(config, rng, clock, schedule) {
    const { firstVersion, sprintsPerRelease, majorEvery } = config.releases;
    let [major, minor] = firstVersion.split('.').map((v) => parseInt(v, 10));
    const versions = [];
    let previousRelease = schedule[0].start;

    schedule.forEach((sprint) => {
        if ((sprint.index + 1) % sprintsPerRelease !== 0) return;
        let releaseDate = clock.startOfDay(sprint.end) + rng.int(0, 3) * DAY;
        while (clock.isWeekend(releaseDate)) releaseDate += DAY;
        const isMajor = sprint.index + 1 >= majorEvery && (sprint.index + 1) % majorEvery === 0;
        if (isMajor) {
            major += 1;
            minor = 0;
        }
        const name = `${major}.${minor}.0`;
        versions.push({
            id: `v${name}`,
            name,
            description: isMajor ? 'Major release' : `Release train ${versions.length + 1}`,
            startDate: previousRelease,
            releaseDate,
            released: releaseDate < clock.nowWall,
            sprintIndex: sprint.index,
            major: isMajor,
            patches: 0,
        });
        previousRelease = releaseDate + DAY;
        minor += 1;
    });
    return versions;
}

function buildLeaves(config, rng, clock, schedule, users) {
    const from = schedule[0].start;
    const to = schedule[schedule.length - 1].end;
    const leaves = new Map();
    for (const user of users) {
        const days = new Set();
        const count = rng.intIn(config.work.vacationsPerUser);
        for (let v = 0; v < count; v++) {
            let day = clock.startOfDay(from + rng.next() * (to - from));
            let remaining = rng.intIn(config.work.vacationDays);
            while (remaining > 0) {
                if (!clock.isWeekend(day)) {
                    days.add(clock.dateText(day));
                    remaining--;
                }
                day += DAY;
            }
        }
        leaves.set(user.email, days);
    }
    return leaves;
}

function buildEpics(ctx) {
    const { rng, schedule } = ctx;
    const total = schedule.length;
    const defs = rng.shuffle(content.epics);
    return defs.map((def, k) => {
        const start = clamp(Math.round((k * (total - 4)) / defs.length) + rng.int(-1, 1), 0, total - 1);
        const length = rng.int(5, 8);
        const epic = createIssue(ctx, {
            kind: 'epic',
            summary: def.name,
            components: def.components,
            labels: def.labels,
            priority: rng.weighted({ High: 0.4, Medium: 0.6 }),
            reporter: ctx.team.lead.email,
            assignee: ctx.team.lead.email,
        });
        epic.window = [start, Math.min(total - 1, start + length - 1)];
        epic.def = def;
        epic.storyPool = rng.shuffle(def.stories);
        return epic;
    });
}

function activeEpics(ctx, sprintIndex) {
    const epics = ctx.epics.filter((e) => e.window[0] <= sprintIndex && sprintIndex <= e.window[1]);
    if (epics.length) return epics;
    return [ctx.epics.reduce((best, e) => (Math.abs(e.window[0] - sprintIndex) < Math.abs(best.window[0] - sprintIndex) ? e : best))];
}

function createSummaryFactory(rng) {
    const used = new Set();
    return function unique(base) {
        let summary = base;
        let n = 2;
        while (used.has(summary)) {
            summary = `${base} - part ${n++}`;
        }
        used.add(summary);
        return summary;
    };
}

function createIssue(ctx, fields) {
    const issue = {
        id: ctx.nextIssueId++,
        kind: 'story',
        description: null,
        points: null,
        initialPoints: null,
        estimateMinutes: null,
        priority: 'Medium',
        labels: [],
        components: [],
        epicId: null,
        parentId: null,
        versionId: null,
        assignee: null,
        reporter: null,
        dueDate: null,
        outcome: null,
        items: [],
        subtaskIds: [],
        ...fields,
    };
    if (issue.kind !== 'epic') ctx.issues.push(issue);
    return issue;
}

function versionFor(ctx, wall) {
    return ctx.versions.find((v) => v.releaseDate >= wall) || ctx.versions[ctx.versions.length - 1] || null;
}

function pickProfile(ctx, sprint) {
    const { config, rng } = ctx;
    const md = (wall) => ctx.clock.dateText(wall).slice(5);
    const { from, to } = config.holidaySeason;
    const inSeason = (wall) => (from <= to ? md(wall) >= from && md(wall) <= to : md(wall) >= from || md(wall) <= to);
    if (inSeason(sprint.start) || inSeason(sprint.end)) {
        return { key: 'holiday', points: [12, 18], load: [0.75, 0.9], seasonLeave: 0.3 };
    }
    const majorRelease = ctx.versions.find((v) => v.sprintIndex === sprint.index && v.major);
    const key = majorRelease ? 'release' : rng.weighted(Object.fromEntries(Object.entries(config.profiles).map(([k, p]) => [k, p.weight])));
    return { key, ...config.profiles[key] };
}

function pickPoints(rng, weights, remaining) {
    const allowed = Object.fromEntries(Object.entries(weights).filter(([p]) => Number(p) <= Math.max(1, remaining)));
    return Number(rng.weighted(Object.keys(allowed).length ? allowed : { 1: 1 }));
}

function otherDev(ctx, email) {
    const others = ctx.team.devs.filter((d) => d.email !== email);
    return others.length ? ctx.rng.pick(others).email : null;
}

function reviewerFor(ctx, email) {
    if (ctx.team.lead.email !== email && ctx.team.lead.role !== 'qa') return ctx.team.lead.email;
    return otherDev(ctx, email);
}

function addItem(ctx, issue, item) {
    const created = {
        id: ctx.nextItemId++,
        logIssueId: issue.id,
        ownerId: issue.parentId || issue.id,
        after: null,
        availableFrom: 0,
        until: null,
        blockedFrom: null,
        blockedTo: null,
        handoverAt: null,
        handoverTo: null,
        logged: 0,
        finishedAt: null,
        scalable: true,
        ...item,
    };
    created.remaining = Math.max(QUARTER, roundTo(created.remaining, QUARTER));
    issue.items.push(created);
    return created;
}

function itemsOf(ctx, issue) {
    const subtasks = issue.subtaskIds.map((id) => ctx.issues.find((i) => i.id === id));
    return [...issue.items, ...subtasks.flatMap((s) => s.items)];
}

function newWorkIssue(ctx, sprint, kind, { epic, availableFrom = 0, forcedAssignee, points, extra = {} } = {}) {
    const { rng, config, team } = ctx;
    const c = config.chances;
    const targetEpic = epic === undefined ? (rng.chance(kind === 'story' ? 0.9 : kind === 'spike' ? 0.8 : 0.45) ? rng.pick(activeEpics(ctx, sprint.index)) : null) : epic;
    const area = targetEpic?.def.name || rng.pick(kind === 'task' ? content.components : content.components.filter((c) => c.productFacing)).name;

    let summary;
    let assignee = forcedAssignee;
    if (kind === 'story') {
        summary = targetEpic?.storyPool.length ? targetEpic.storyPool.shift() : `${area}: ${rng.pick(content.genericStories)}`;
    } else if (kind === 'bug') {
        const facing = targetEpic?.def.components.filter((name) => content.components.find((c) => c.name === name)?.productFacing) || [];
        const component = facing.length ? rng.pick(facing) : area;
        summary = `${component}: ${rng.pick(content.bugTemplates)}`;
    } else if (kind === 'spike') {
        const topic = targetEpic?.storyPool.length ? targetEpic.storyPool[0].toLowerCase() : area.toLowerCase();
        summary = `${rng.pick(content.spikeTemplates)} ${topic}`;
    } else {
        const qaTask = !forcedAssignee ? rng.chance(0.35) : team.qas.some((q) => q.email === forcedAssignee) && team.qas !== team.devs;
        summary = `${rng.pick(content.taskTemplates[qaTask ? 'qa' : 'dev'])} for ${area}`;
        if (!assignee) assignee = rng.pick(qaTask ? team.qas : team.devs).email;
    }
    if (!assignee) assignee = rng.pick(team.devs).email;

    const estimated = kind === 'story' || (kind === 'bug' ? !rng.chance(c.unestimatedBug) : kind === 'task' ? !rng.chance(c.unestimatedTask) : rng.chance(0.4));
    const finalPoints = points ?? (estimated ? (kind === 'story' ? pickPoints(rng, config.pointWeights, 13) : pickPoints(rng, { 1: 2, 2: 3, 3: 2 }, 3)) : null);
    const baseHours = (finalPoints ?? (kind === 'spike' ? rng.float([1, 2]) : rng.float([0.5, 1.5]))) * rng.float(config.hoursPerPoint);
    const estimateHours = Math.max(1, roundTo(baseHours, 0.5));
    const pool = targetEpic ? targetEpic.def.labels : [];
    const labels = [...new Set([...rng.pickMany(pool, rng.int(0, Math.min(2, pool.length))), ...(rng.chance(0.25) ? [rng.pick(extraLabels[kind])] : [])])];

    const issue = createIssue(ctx, {
        kind,
        summary: ctx.summaries(summary),
        description: rng.chance(c.description) ? rng.pick(content.descriptions[kind === 'bug' ? 'bug' : kind === 'story' ? 'story' : 'task']) : null,
        points: finalPoints,
        initialPoints: finalPoints,
        estimateMinutes: rng.chance(0.1) ? null : estimateHours * 60,
        priority: rng.weighted(kind === 'bug' ? bugPriorityWeights : priorityWeights),
        labels,
        components: targetEpic ? rng.pickMany(targetEpic.def.components, rng.int(1, 2)) : [area].filter((a) => content.components.some((x) => x.name === a)),
        epicId: targetEpic?.id ?? null,
        versionId: versionFor(ctx, sprint.end)?.id ?? null,
        assignee,
        reporter: kind === 'bug' ? rng.pick(team.qas).email : rng.chance(0.8) ? team.lead.email : assignee,
        dueDate: rng.chance(c.dueDate) ? ctx.clock.dateText(sprint.end + rng.int(-2, 5) * DAY) : null,
        createdIn: sprint.index,
        createdAt: availableFrom,
        ...extra,
    });

    if (sprint.state !== 'future') planWorkItems(ctx, issue, availableFrom, estimateHours);
    return issue;
}

function planWorkItems(ctx, issue, availableFrom, estimateHours) {
    const { rng, config, team } = ctx;
    const c = config.chances;
    const actual = estimateHours * rng.float(config.actualVsEstimate) * HOUR;
    const qaUser = rng.pick(team.qas).email;
    const separateQa = team.qas !== team.devs;

    const mustFix = issue.labels.includes('production');
    if (issue.kind === 'bug' && !mustFix && rng.chance(c.bugNoFix)) {
        issue.outcome = ctx.bugHistory.length && rng.chance(0.5) ? 'duplicate' : 'cannotreproduce';
        if (issue.outcome === 'duplicate') issue.duplicateOf = rng.pick(ctx.bugHistory);
        addItem(ctx, issue, { phase: 'investigate', user: issue.assignee, remaining: rng.float([0.5, 2]) * HOUR, availableFrom, scalable: false });
        return;
    }
    if (issue.kind === 'story' && !mustFix && rng.chance(c.storyWontDo)) {
        issue.outcome = 'wontdo';
        addItem(ctx, issue, { phase: 'dev', user: issue.assignee, remaining: rng.float([0.5, 1.5]) * HOUR, availableFrom, scalable: false });
        return;
    }
    if (issue.kind === 'bug') ctx.bugHistory.push(issue.id);

    if (issue.kind === 'task' || issue.kind === 'spike') {
        addItem(ctx, issue, { phase: 'task', user: issue.assignee, remaining: actual, availableFrom });
        return;
    }

    const devShare = issue.kind === 'bug' ? 0.72 : 0.7;
    const reviewer = reviewerFor(ctx, issue.assignee);
    const useSubtasks = issue.kind === 'story' && (issue.points || 0) >= 5 && rng.chance(c.subtasks);

    let devItems;
    let qaHost = issue;
    if (useSubtasks) {
        const pairDev = otherDev(ctx, issue.assignee);
        const split = pairDev && rng.chance(0.6);
        const parts = [{ template: 'dev', user: issue.assignee, share: split ? 0.55 : 1 }];
        if (split) parts.push({ template: 'dev2', user: pairDev, share: 0.45 });
        devItems = parts.map((part) => {
            const sub = createSubtask(ctx, issue, rng.pick(content.subtaskTemplates[part.template]), part.user, actual * devShare * part.share);
            return addItem(ctx, sub, { phase: 'dev', user: part.user, remaining: actual * devShare * part.share, availableFrom });
        });
        qaHost = createSubtask(ctx, issue, rng.pick(content.subtaskTemplates.qa), qaUser, actual * 0.22);
    } else {
        devItems = [addItem(ctx, issue, { phase: issue.kind === 'bug' ? 'bugfix' : 'dev', user: issue.assignee, remaining: actual * devShare, availableFrom })];
    }

    const lastDev = devItems[devItems.length - 1];
    const review = reviewer ? addItem(ctx, issue, { phase: 'review', user: reviewer, remaining: actual * 0.08, after: lastDev, availableFrom, scalable: false }) : null;
    const qa = addItem(ctx, qaHost, { phase: 'qa', user: separateQa ? qaUser : issue.assignee, remaining: actual * 0.22, after: review || lastDev, availableFrom });
    if (devItems.length > 1) review && (review.alsoAfter = devItems[0]);

    if (issue.kind === 'bug' && rng.chance(c.reopen)) {
        issue.reopenAfter = qa;
        const fix = addItem(ctx, issue, { phase: 'bugfix', user: issue.assignee, remaining: rng.float([1, 3]) * HOUR, after: qa, scalable: false });
        addItem(ctx, qaHost, { phase: 'qa', user: qa.user, remaining: rng.float([0.5, 1.5]) * HOUR, after: fix, scalable: false });
    }
}

function createSubtask(ctx, parent, summary, assignee, hours) {
    const sub = createIssue(ctx, {
        kind: 'subtask',
        summary,
        parentId: parent.id,
        assignee,
        reporter: parent.reporter,
        priority: parent.priority,
        estimateMinutes: Math.max(1, roundTo(hours / HOUR, 0.5)) * 60,
        createdIn: parent.createdIn,
    });
    parent.subtaskIds.push(sub.id);
    return sub;
}

function workingDayStarts(ctx, sprint, windowEnd) {
    const days = [];
    for (let day = ctx.clock.startOfDay(sprint.start); day <= windowEnd; day += DAY) {
        days.push(day);
    }
    return days;
}

function isOff(ctx, email, day, profile) {
    const date = ctx.clock.dateText(day);
    if (ctx.holidays.has(date) || ctx.leaves.get(email).has(date)) return true;
    return profile.seasonLeave ? ctx.rng.chance(profile.seasonLeave) : false;
}

function capacityOf(ctx, email, sprint, windowEnd, profile) {
    const daily = (profile.crunch ? ctx.config.work.crunchDailyHours : ctx.config.work.dailyHours).reduce((a, b) => a + b, 0) / 2;
    const days = workingDayStarts(ctx, sprint, windowEnd).filter((d) => !ctx.clock.isWeekend(d) && !ctx.holidays.has(ctx.clock.dateText(d)) && !ctx.leaves.get(email).has(ctx.clock.dateText(d)));
    return days.length * (daily + ctx.traits.get(email).hoursShift) * HOUR;
}

function workingDayAt(ctx, sprint, index) {
    let count = -1;
    for (let day = ctx.clock.startOfDay(sprint.start); day <= sprint.end; day += DAY) {
        if (!ctx.clock.isWeekend(day)) count++;
        if (count === index) return day;
    }
    return ctx.clock.startOfDay(sprint.end);
}

function planWorkingSprint(ctx, sprint, carriedIn) {
    const { rng, config, clock, team } = ctx;
    const c = config.chances;
    const profile = pickProfile(ctx, sprint);
    const windowEnd = sprint.state === 'active' ? Math.min(sprint.end, clock.nowWall - 30 * MINUTE) : sprint.end;
    const sprintEpics = activeEpics(ctx, sprint.index);
    sprint.profile = profile.key;
    sprint.goal = content.sprintGoals[profile.key](sprintEpics.slice(0, 2).map((e) => e.summary));

    const returning = ctx.pendingBacklog.filter((p) => p.returnAt === sprint.index).map((p) => p.issue);
    ctx.pendingBacklog = ctx.pendingBacklog.filter((p) => p.returnAt !== sprint.index);
    const closingLater = ctx.pendingBacklog.filter((p) => p.closeAt === sprint.index);
    ctx.pendingBacklog = ctx.pendingBacklog.filter((p) => p.closeAt !== sprint.index);

    const carried = [...carriedIn, ...returning];
    carried.forEach((issue) => itemsOf(ctx, issue).forEach((it) => (it.until = null)));
    const carriedPoints = carried.reduce((sum, i) => sum + (i.points || 0), 0);
    const trend = 0.9 + (0.2 * sprint.index) / ctx.schedule.length;
    const target = Math.round(rng.intIn(profile.points) * trend);
    const mix = profile.mix || config.mix;

    const committed = [];
    let points = Math.min(carriedPoints, target);
    while (points < target) {
        const kind = rng.weighted(mix);
        const issue = newWorkIssue(ctx, sprint, kind);
        committed.push(issue);
        points += issue.points || 1;
    }

    ensureEveryoneHasWork(ctx, sprint, committed);
    if (team.qas !== team.devs) {
        team.qas.forEach((qa) => {
            const task = newWorkIssue(ctx, sprint, 'task', { forcedAssignee: qa.email });
            task.items.forEach((it) => {
                it.remaining = Math.max(HOUR, roundTo(capacityOf(ctx, qa.email, sprint, windowEnd, profile) * rng.float([0.3, 0.5]), QUARTER));
                it.scalable = false;
            });
            committed.push(task);
        });
    }

    const newItems = committed.flatMap((i) => itemsOf(ctx, i)).filter((it) => it.scalable);
    const carriedItems = carried.flatMap((i) => itemsOf(ctx, i)).filter((it) => it.remaining > 0 && it.finishedAt === null);
    for (const user of team.users) {
        const capacity = capacityOf(ctx, user.email, sprint, windowEnd, profile) * rng.float(profile.load);
        const carriedLoad = carriedItems.filter((it) => it.user === user.email).reduce((s, it) => s + it.remaining, 0);
        const mine = newItems.filter((it) => it.user === user.email);
        const required = mine.reduce((s, it) => s + it.remaining, 0);
        if (!required) continue;
        const factor = clamp((capacity - carriedLoad) / required, 0.45, 1.6);
        mine.forEach((it) => (it.remaining = Math.max(QUARTER, roundTo(it.remaining * factor, QUARTER))));
    }

    const all = [...carried, ...committed];
    const events = planSprintEvents(ctx, sprint, profile, committed, all);

    sprint.steps.push({ type: 'createSprint', goal: sprint.goal });
    const newIds = committed.flatMap((i) => [i.id, ...i.subtaskIds]);
    if (newIds.length) sprint.steps.push({ type: 'createIssues', ids: newIds });
    sprint.steps.push({ type: 'moveToSprint', ids: all.map((i) => i.id) });
    carried.forEach((issue) => {
        const version = versionFor(ctx, sprint.end);
        if (version && issue.versionId !== version.id) {
            issue.versionId = version.id;
            sprint.steps.push({ type: 'update', id: issue.id, fields: { versionId: version.id } });
        }
    });
    sprint.steps.push({ type: 'startSprint' });
    ctx.epics.filter((e) => e.window[0] === sprint.index).forEach((e) => sprint.steps.push({ type: 'transition', id: e.id, to: 'inprogress' }));

    closingLater.forEach(({ issue, closeAs }) => {
        sprint.steps.push({ type: 'transition', id: issue.id, to: closeAs });
        issue.status = closeAs;
        if (closeAs === 'wontdo') sprint.steps.push({ type: 'comment', id: issue.id, user: team.lead.email, text: rng.pick(content.comments.wontDo) });
    });

    const worklogs = simulateWork(ctx, sprint, profile, windowEnd, [...all, ...events.added]);

    events.steps.sort((a, b) => a.at - b.at).forEach(({ at, ...step }) => sprint.steps.push(step));
    sprint.steps.push({ type: 'worklogs', logs: worklogs });

    const inSprint = [...all, ...events.added].filter((i) => !events.descoped.includes(i));
    const finals = new Map();
    for (const issue of [...inSprint, ...events.descoped]) {
        const final = statusOf(ctx, issue);
        finals.set(issue.id, final);
        pushTransitions(ctx, sprint, issue, final);
    }

    sprint.summary = {
        committed: all.length,
        carriedIn: carried.length,
        added: events.added.length,
        descoped: events.descoped.length,
        points: all.reduce((s, i) => s + (i.points || 0), 0) + events.added.reduce((s, i) => s + (i.points || 0), 0),
        worklogs: worklogs.length,
    };

    if (sprint.state === 'active') {
        events.descoped.forEach((issue) => ctx.pendingBacklog.push({ issue }));
        return [];
    }

    sprint.steps.push({ type: 'closeSprint' });
    ctx.epics.filter((e) => e.window[1] === sprint.index).forEach((e) => sprint.steps.push({ type: 'transition', id: e.id, to: 'done' }));
    ctx.versions.filter((v) => v.released && v.releaseDate <= (ctx.schedule[sprint.index + 1]?.end ?? Infinity) && !v.releasedPlanned && v.releaseDate >= sprint.start).forEach((v) => {
        v.releasedPlanned = true;
        sprint.steps.push({ type: 'releaseVersion', versionId: v.id });
    });

    const carryOut = [];
    for (const issue of inSprint) {
        if (isClosedStatus(finals.get(issue.id))) continue;
        if (rng.chance(c.carryToNextSprint)) {
            carryOut.push(issue);
            if (rng.chance(0.3)) sprint.steps.push({ type: 'comment', id: issue.id, user: issue.assignee || team.lead.email, text: rng.pick(content.comments.carried) });
        } else {
            sendToBacklog(ctx, sprint, issue);
        }
    }
    events.descoped.filter((i) => !isClosedStatus(finals.get(i.id))).forEach((issue) => sendToBacklog(ctx, sprint, issue));
    sprint.summary.carriedOut = carryOut.length;
    return carryOut;
}

function isClosedStatus(status) {
    return ['done', 'wontdo', 'duplicate', 'cannotreproduce'].includes(status);
}

function sendToBacklog(ctx, sprint, issue) {
    const { rng, config, schedule } = ctx;
    const nextWorking = schedule.filter((s) => s.index > sprint.index && s.state !== 'future').map((s) => s.index);
    if (!nextWorking.length) {
        ctx.pendingBacklog.push({ issue });
        return;
    }
    if (rng.chance(config.chances.closeLaterOfBacklog)) {
        issue.items.forEach((it) => (it.remaining = 0));
        ctx.pendingBacklog.push({ issue, closeAt: nextWorking[0], closeAs: rng.chance(0.7) ? 'done' : 'wontdo' });
    } else if (nextWorking.length > 1 && rng.chance(0.5)) {
        ctx.pendingBacklog.push({ issue, returnAt: nextWorking[Math.min(nextWorking.length - 1, rng.int(1, 2))] });
    } else {
        ctx.pendingBacklog.push({ issue });
    }
}

function ensureEveryoneHasWork(ctx, sprint, committed) {
    for (const user of ctx.team.users) {
        const has = committed.some((i) => itemsOf(ctx, i).some((it) => it.user === user.email && it.scalable));
        if (!has) committed.push(newWorkIssue(ctx, sprint, 'task', { forcedAssignee: user.email }));
    }
}

function planSprintEvents(ctx, sprint, profile, committed, all) {
    const { rng, config, team, clock } = ctx;
    const c = config.chances;
    const steps = [];
    const added = [];
    const descoped = [];
    const at = (dayIndex, hour = '11:30') => workingDayAt(ctx, sprint, dayIndex) + parseTime(hour) + rng.int(0, 240) * MINUTE;
    const isPast = (wall) => wall < clock.nowWall;

    const addCount = rng.intIn(c.midSprintAdd) + (profile.extraAdds || 0);
    for (let n = 0; n < addCount; n++) {
        const when = at(rng.int(1, 7));
        if (!isPast(when)) continue;
        const qaFound = rng.chance(0.55);
        const issue = qaFound
            ? newWorkIssue(ctx, sprint, 'bug', { availableFrom: when, extra: { reporter: rng.pick(team.qas).email, labels: ['found-in-sprint'] } })
            : newWorkIssue(ctx, sprint, 'story', { availableFrom: when, extra: { labels: ['customer-request'] } });
        added.push(issue);
        steps.push({ at: when, type: 'createIssues', ids: [issue.id, ...issue.subtaskIds] });
        steps.push({ at: when + MINUTE, type: 'moveToSprint', ids: [issue.id] });
        const related = rng.pick(committed.filter((i) => i.kind === 'story')) || null;
        if (qaFound && related) steps.push({ at: when + 2 * MINUTE, type: 'link', linkType: 'Relates', inward: issue.id, outward: related.id });
    }

    if (rng.chance(c.prodIssue)) {
        const when = at(rng.int(2, 6), '10:30');
        if (isPast(when)) {
            const version = createHotfixVersion(ctx, when);
            const issue = newWorkIssue(ctx, sprint, 'bug', {
                availableFrom: when,
                forcedAssignee: team.lead.role !== 'qa' ? team.lead.email : rng.pick(team.devs).email,
                extra: {
                    summary: ctx.summaries(`Production: ${rng.pick(content.prodBugTemplates)}`),
                    priority: 'Highest',
                    labels: ['production', 'hotfix'],
                    versionId: version?.id ?? null,
                    dueDate: clock.dateText(when + DAY),
                    reporter: team.lead.email,
                },
            });
            added.push(issue);
            steps.push({ at: when, type: 'createIssues', ids: [issue.id] });
            steps.push({ at: when + MINUTE, type: 'moveToSprint', ids: [issue.id] });
            const victim = [...committed].filter((i) => i.kind !== 'bug').sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority])[0];
            if (victim && rng.chance(0.5)) {
                const until = when + 2 * HOUR;
                itemsOf(ctx, victim).forEach((it) => (it.until = until));
                descoped.push(victim);
                steps.push({ at: until, type: 'moveToBacklog', ids: [victim.id] });
                steps.push({ at: until + MINUTE, type: 'comment', id: victim.id, user: team.lead.email, text: content.comments.descoped[1] });
            }
        }
    }

    if (!descoped.length && rng.chance(profile.key === 'overcommitted' ? 0.8 : c.descope)) {
        const victim = [...committed].filter((i) => i.kind !== 'spike').sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority])[0];
        const when = at(rng.int(4, 7));
        if (victim && isPast(when)) {
            itemsOf(ctx, victim).forEach((it) => (it.until = when));
            descoped.push(victim);
            steps.push({ at: when, type: 'moveToBacklog', ids: [victim.id] });
            steps.push({ at: when + MINUTE, type: 'comment', id: victim.id, user: team.lead.email, text: content.comments.descoped[0] });
        }
    }

    const reestimates = rng.chance(c.reestimate) ? rng.int(1, 2) : 0;
    rng.pickMany(committed.filter((i) => i.kind === 'story' && i.points && !descoped.includes(i) && !i.outcome), reestimates).forEach((issue) => {
        const when = at(rng.int(1, 5));
        if (!isPast(when)) return;
        const idx = fibonacci.indexOf(issue.points);
        const up = rng.chance(0.7);
        const next = fibonacci[clamp(idx + (up ? 1 : -1), 0, fibonacci.length - 1)];
        if (next === issue.points) return;
        const ratio = next / issue.points;
        itemsOf(ctx, issue).forEach((it) => it.phase !== 'review' && (it.remaining = Math.max(QUARTER, roundTo(it.remaining * ratio, QUARTER))));
        issue.points = next;
        steps.push({ at: when, type: 'update', id: issue.id, fields: { points: next } });
        steps.push({ at: when + MINUTE, type: 'comment', id: issue.id, user: issue.assignee, text: content.comments.reestimated[up ? 0 : 1] });
    });

    if (rng.chance(c.reassign) && team.devs.length > 1) {
        const issue = rng.pick(committed.filter((i) => ['story', 'bug'].includes(i.kind) && !i.outcome && !descoped.includes(i) && !i.subtaskIds.length));
        const when = at(rng.int(3, 6));
        const devItem = issue?.items.find((it) => it.phase === 'dev' || it.phase === 'bugfix');
        const to = issue && otherDev(ctx, issue.assignee);
        if (devItem && to && isPast(when)) {
            devItem.handoverAt = when;
            devItem.handoverTo = to;
            issue.assignee = to;
            steps.push({ at: when, type: 'update', id: issue.id, fields: { assignee: to } });
        }
    }

    if (rng.chance(c.flag)) {
        const issue = rng.pick(all.filter((i) => ['story', 'task'].includes(i.kind) && !i.outcome && !descoped.includes(i)));
        const from = at(rng.int(1, 5));
        const to = from + rng.int(1, 3) * DAY;
        if (issue && isPast(from)) {
            itemsOf(ctx, issue).forEach((it) => {
                it.blockedFrom = from;
                it.blockedTo = to;
            });
            steps.push({ at: from, type: 'update', id: issue.id, fields: { flagged: true } });
            steps.push({ at: from + MINUTE, type: 'comment', id: issue.id, user: issue.assignee, text: rng.pick(content.comments.blocked) });
            const blocker = rng.pick(all.filter((i) => i !== issue && i.kind !== 'spike'));
            if (blocker) steps.push({ at: from + 2 * MINUTE, type: 'link', linkType: 'Blocks', inward: issue.id, outward: blocker.id });
            if (isPast(to)) {
                steps.push({ at: to, type: 'update', id: issue.id, fields: { flagged: false } });
                steps.push({ at: to + MINUTE, type: 'comment', id: issue.id, user: issue.assignee, text: rng.pick(content.comments.unblocked) });
            }
        }
    }

    [...all, ...added]
        .filter((i) => i.outcome === 'duplicate' && i.duplicateOf && i.createdIn === sprint.index)
        .forEach((issue) => steps.push({ at: Math.max(sprint.start + HOUR, issue.createdAt + 3 * MINUTE), type: 'link', linkType: 'Duplicate', inward: issue.duplicateOf, outward: issue.id }));

    committed
        .filter((i) => rng.chance(c.comment))
        .forEach((issue) => {
            const user = rng.pick(team.users).email;
            steps.push({ at: sprint.start + rng.int(1, 48) * HOUR, type: 'comment', id: issue.id, user, text: rng.pick(content.comments.general) });
        });

    return { steps: steps.filter((s) => isPast(s.at)), added, descoped };
}

function createHotfixVersion(ctx, when) {
    const base = [...ctx.versions].filter((v) => !v.hotfix && v.releaseDate <= when).pop();
    if (!base) return null;
    base.patches += 1;
    const [major, minor] = base.name.split('.');
    const name = `${major}.${minor}.${base.patches}`;
    const releaseDate = ctx.clock.startOfDay(when) + DAY;
    const version = { id: `v${name}`, name, description: `Hotfix for ${base.name}`, startDate: ctx.clock.startOfDay(when), releaseDate, released: releaseDate < ctx.clock.nowWall, hotfix: true, sprintIndex: null, patches: 0 };
    ctx.versions.push(version);
    ctx.versions.sort((a, b) => a.releaseDate - b.releaseDate);
    return version;
}

function simulateWork(ctx, sprint, profile, windowEnd, issues) {
    const { rng, config, clock, team } = ctx;
    const w = config.work;
    const items = issues.flatMap((i) => itemsOf(ctx, i)).filter((it) => it.remaining > 0 && it.finishedAt === null);
    const order = new Map(issues.map((issue, idx) => [issue.id, priorityRank[issue.priority] * 1000 + idx]));
    const ownerOf = (it) => issues.find((i) => i.id === it.ownerId);
    items.sort((a, b) => (order.get(a.ownerId) ?? 0) - (order.get(b.ownerId) ?? 0));

    const holder = (it, t) => (it.handoverAt && t >= it.handoverAt ? it.handoverTo : it.user);
    const available = (it, user, t) =>
        it.remaining > 0 &&
        holder(it, t) === user &&
        t >= it.availableFrom &&
        (it.until === null || t < it.until) &&
        !(it.blockedFrom !== null && t >= it.blockedFrom && t < it.blockedTo) &&
        (!it.after || (it.after.finishedAt !== null && it.after.finishedAt <= t)) &&
        (!it.alsoAfter || (it.alsoAfter.finishedAt !== null && it.alsoAfter.finishedAt <= t));

    const logs = [];
    const sprintFirstDay = clock.startOfDay(sprint.start);

    for (const day of workingDayStarts(ctx, sprint, windowEnd)) {
        const weekend = clock.isWeekend(day);
        for (const user of rng.shuffle(team.users)) {
            if (weekend ? !rng.chance(profile.crunch ? w.crunchWeekendChance : w.weekendChance) : isOff(ctx, user.email, day, profile) || rng.chance(w.sickChance)) continue;
            const trait = ctx.traits.get(user.email);
            const forget = rng.chance(w.forgetToLogChance);

            let cursor = day + randomTime(rng, w.dayStart);
            if (day === sprintFirstDay) cursor = Math.max(cursor, sprint.start + rng.int(10, 40) * MINUTE);
            const limit = Math.min(day + parseTime(w.dayEnd) + (profile.crunch ? 2 * HOUR : 0), windowEnd - QUARTER);
            const target = (weekend ? rng.float([1, 4]) : rng.float(profile.crunch ? w.crunchDailyHours : w.dailyHours) + trait.hoursShift) * HOUR;
            let logged = 0;
            let hadLunch = false;

            while (logged < target) {
                const item = items.find((it) => available(it, user.email, cursor));
                if (!item) break;
                let chunk = Math.min(item.remaining, target - logged, (rng.float(w.chunkHours) + trait.chunkShift) * HOUR, limit - cursor);
                if (item.until !== null) chunk = Math.min(chunk, item.until - cursor);
                if (item.blockedFrom !== null && cursor < item.blockedFrom) chunk = Math.min(chunk, item.blockedFrom - cursor);
                chunk = Math.floor(chunk / QUARTER) * QUARTER;
                if (chunk < QUARTER) break;

                if (!forget) {
                    const owner = ownerOf(item);
                    const phase = item.phase === 'task' && owner?.kind === 'spike' ? 'dev' : item.phase;
                    logs.push({ issueId: item.logIssueId, user: user.email, started: cursor, seconds: chunk / 1000, comment: rng.pick(content.worklogComments[phase] || content.worklogComments.task) });
                }
                logged += chunk;
                item.remaining -= chunk;
                item.logged += chunk;
                cursor += chunk + rng.int(0, 4) * 5 * MINUTE;
                if (item.remaining < QUARTER) {
                    item.remaining = 0;
                    item.finishedAt = cursor;
                }
                if (!hadLunch && cursor >= day + parseTime('13:00')) {
                    cursor += rng.int(30, 50) * MINUTE;
                    hadLunch = true;
                }
            }
        }
    }
    return logs.sort((a, b) => a.started - b.started);
}

function statusFromItems(items) {
    if (!items.length) return 'todo';
    if (items.every((it) => it.finishedAt !== null)) return 'done';
    const dev = items.filter((it) => ['dev', 'bugfix', 'task', 'investigate'].includes(it.phase));
    const review = items.filter((it) => it.phase === 'review');
    if (dev.some((it) => it.finishedAt === null)) return items.some((it) => it.logged > 0) ? 'inprogress' : 'todo';
    if (review.some((it) => it.finishedAt === null)) return 'review';
    return 'qa';
}

function statusOf(ctx, issue) {
    const items = itemsOf(ctx, issue);
    const status = statusFromItems(items);
    if (issue.outcome && status === 'done') return issue.outcome;
    return status;
}

function pushTransitions(ctx, sprint, issue, final) {
    const { rng, team } = ctx;
    for (const subId of issue.subtaskIds) {
        const sub = ctx.issues.find((i) => i.id === subId);
        const subStatus = sub.items.every((it) => it.finishedAt !== null) ? 'done' : sub.items.some((it) => it.logged > 0) ? 'inprogress' : 'todo';
        if (subStatus !== (sub.status || 'todo')) {
            sprint.steps.push({ type: 'transition', id: sub.id, to: subStatus });
            sub.status = subStatus;
        }
    }

    const previous = issue.status || 'todo';
    if (issue.reopenAfter && issue.reopenAfter.finishedAt !== null && !issue.reopened) {
        issue.reopened = true;
        if (previous !== 'done') sprint.steps.push({ type: 'transition', id: issue.id, to: 'done' });
        sprint.steps.push({ type: 'transition', id: issue.id, to: 'todo' });
        sprint.steps.push({ type: 'comment', id: issue.id, user: issue.reporter, text: rng.pick(content.comments.reopened) });
        issue.status = 'todo';
    }

    if (final !== (issue.status || 'todo')) {
        sprint.steps.push({ type: 'transition', id: issue.id, to: final });
        if (final === 'qa' && rng.chance(0.3)) sprint.steps.push({ type: 'comment', id: issue.id, user: issue.assignee || team.lead.email, text: rng.pick(content.comments.readyForQa) });
        if (final === 'cannotreproduce') sprint.steps.push({ type: 'comment', id: issue.id, user: issue.assignee, text: content.comments.cannotReproduce[0] });
        if (final === 'duplicate') sprint.steps.push({ type: 'comment', id: issue.id, user: issue.assignee, text: content.comments.duplicate[0] });
        if (final === 'wontdo') sprint.steps.push({ type: 'comment', id: issue.id, user: team.lead.email, text: rng.pick(content.comments.wontDo) });
        issue.status = final;
    }
}

function planFutureSprint(ctx, sprint) {
    const { rng, config } = ctx;
    const ahead = ctx.schedule.filter((s) => s.state === 'future' && s.index <= sprint.index).length;
    const target = ahead === 1 ? rng.int(22, 30) : ahead <= 3 ? rng.int(18, 26) : rng.int(8, 16);
    const committed = [];
    let points = 0;
    while (points < target) {
        const kind = rng.weighted(config.mix);
        const issue = newWorkIssue(ctx, sprint, kind);
        const refined = ahead <= 3;
        if (ahead > 3 && rng.chance(0.5)) {
            issue.points = null;
            issue.initialPoints = null;
            issue.estimateMinutes = null;
            issue.labels = [...new Set([...issue.labels, 'needs-refinement'])];
        }
        if (ahead > 1 && rng.chance(ahead > 3 ? 0.8 : 0.35)) issue.assignee = null;
        committed.push(issue);
        points += issue.points || (refined ? 0 : 3);
    }
    sprint.profile = 'planned';
    sprint.goal = ahead <= 3 ? content.sprintGoals.steady(activeEpics(ctx, sprint.index).slice(0, 2).map((e) => e.summary)) : null;
    sprint.steps.push({ type: 'createSprint', goal: sprint.goal });
    sprint.steps.push({ type: 'createIssues', ids: committed.map((i) => i.id) });
    sprint.steps.push({ type: 'moveToSprint', ids: committed.map((i) => i.id) });
    sprint.summary = { committed: committed.length, carriedIn: 0, added: 0, descoped: 0, points: committed.reduce((s, i) => s + (i.points || 0), 0), worklogs: 0 };
}

function planBacklog(ctx) {
    const { rng, config, schedule } = ctx;
    const last = schedule[schedule.length - 1];
    const count = rng.intIn(config.backlogSize);
    const created = [];
    for (let n = 0; n < count; n++) {
        const issue = newWorkIssue(ctx, { ...last, state: 'future' }, rng.weighted({ story: 0.55, bug: 0.3, task: 0.15 }), { epic: rng.chance(0.6) ? rng.pick(ctx.epics) : null });
        issue.versionId = null;
        if (rng.chance(0.55)) {
            issue.points = null;
            issue.initialPoints = null;
            issue.estimateMinutes = null;
            issue.labels = [...new Set([...issue.labels, rng.pick(['needs-refinement', 'idea', 'customer-request'])])];
        }
        if (rng.chance(0.7)) issue.assignee = null;
        created.push(issue);
    }
    return { steps: [{ type: 'createIssues', ids: created.map((i) => i.id) }], count: created.length, leftOver: ctx.pendingBacklog.length };
}

export function planStats(plan) {
    const worklogs = plan.sprints.reduce((s, sp) => s + (sp.summary?.worklogs || 0), 0);
    return { sprints: plan.sprints.length, issues: plan.issues.length, epics: plan.epics.length, versions: plan.versions.length, worklogs };
}
