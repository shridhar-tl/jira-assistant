import { differenceInCalendarDays, isValid, parseISO } from 'date-fns';

import { buildOrderedBreakdown, toPercentage } from './breakdown-utils';
import type {
    BreakdownItem,
    DailyTarget,
    EstimateSummary,
    GroupTarget,
    HygieneMetric,
    IssueEstimate,
    TargetStatus,
    UserTargetProgress,
    VisualizationWorklog,
} from './types';

const maxOverruns = 5;

export function getTargetProgress({ workingDays, users }: GroupTarget, { minSecsPerDay, maxSecsPerDay }: DailyTarget): UserTargetProgress[] {
    const expectedMin = workingDays * minSecsPerDay;
    const expectedMax = workingDays * maxSecsPerDay;

    return users
        .map((user) => {
            let status: TargetStatus = 'on';
            if (user.logged < expectedMin) {
                status = 'under';
            } else if (user.logged > expectedMax) {
                status = 'over';
            }
            return { ...user, expectedMin, expectedMax, status, percentage: expectedMin ? Math.round((user.logged * 100) / expectedMin) : 0 };
        })
        .sort((a, b) => a.percentage - b.percentage || a.displayName.localeCompare(b.displayName));
}

function toIssueEstimate(worklog: VisualizationWorklog): IssueEstimate {
    return {
        ticketNo: worklog.ticketNo || '',
        summary: worklog.summary || '',
        ticketUrl: worklog.ticketUrl,
        originalEstimate: worklog.originalestimate || 0,
        totalLogged: worklog.totalLogged || 0,
        remainingEstimate: worklog.remainingestimate || 0,
        variance: worklog.estVariance || 0,
    };
}

export function buildEstimateSummary(worklogs: VisualizationWorklog[]): EstimateSummary {
    const issues = new Map<string, IssueEstimate>();
    let unestimatedTime = 0;
    for (const worklog of worklogs) {
        if (!worklog.ticketNo) {
            continue;
        }
        if (!worklog.originalestimate) {
            unestimatedTime += worklog.timeSpent || 0;
        }
        if (!issues.has(worklog.ticketNo)) {
            issues.set(worklog.ticketNo, toIssueEstimate(worklog));
        }
    }

    const estimated = Array.from(issues.values()).filter((i) => i.originalEstimate > 0);
    const over = estimated.filter((i) => i.variance > 0);

    return {
        issueCount: issues.size,
        estimatedCount: estimated.length,
        overCount: over.length,
        totalEstimate: estimated.reduce((sum, i) => sum + i.originalEstimate, 0),
        totalProjected: estimated.reduce((sum, i) => sum + i.totalLogged + i.remainingEstimate, 0),
        unestimatedTime,
        overruns: over.sort((a, b) => b.variance - a.variance || a.ticketNo.localeCompare(b.ticketNo)).slice(0, maxOverruns),
    };
}

export const delayBuckets = {
    advance: 'Before the work date',
    sameDay: 'Same day',
    nextDay: 'Next day',
    fewDays: '2 - 3 days later',
    week: '4 - 7 days later',
    later: 'More than a week later',
};

const delayBucketOrder = Object.values(delayBuckets);

function getLoggingDelay(worklog: VisualizationWorklog): number | null {
    if (!worklog.logTime || !worklog.logCreated) {
        return null;
    }
    return differenceInCalendarDays(worklog.logCreated, worklog.logTime);
}

function getDelayBucket(worklog: VisualizationWorklog): string | null {
    const delay = getLoggingDelay(worklog);
    if (delay === null) {
        return null;
    }
    if (delay < 0) {
        return delayBuckets.advance;
    }
    if (delay === 0) {
        return delayBuckets.sameDay;
    }
    if (delay === 1) {
        return delayBuckets.nextDay;
    }
    if (delay <= 3) {
        return delayBuckets.fewDays;
    }
    if (delay <= 7) {
        return delayBuckets.week;
    }
    return delayBuckets.later;
}

export function buildDelayBreakdown(worklogs: VisualizationWorklog[], totalTimeSpent: number): BreakdownItem[] {
    return buildOrderedBreakdown(worklogs, delayBucketOrder, getDelayBucket, totalTimeSpent);
}

export function getAverageDelay(worklogs: VisualizationWorklog[]): number {
    const delays = worklogs.map(getLoggingDelay).filter((d): d is number => d !== null);
    return delays.length ? delays.reduce((sum, d) => sum + Math.max(0, d), 0) / delays.length : 0;
}

function getResolutionDate(worklog: VisualizationWorklog): Date | null {
    const value = worklog.fields?.resolutiondate;
    if (typeof value !== 'string' || !value) {
        return null;
    }
    const date = parseISO(value);
    return isValid(date) ? date : null;
}

function isLoggedAfterResolved(worklog: VisualizationWorklog): boolean {
    const resolved = getResolutionDate(worklog);
    return !!resolved && !!worklog.logTime && differenceInCalendarDays(worklog.logTime, resolved) > 0;
}

interface HygieneRule {
    key: string;
    title: string;
    description: string;
    matches: (worklog: VisualizationWorklog) => boolean;
}

const commentRule: HygieneRule = {
    key: 'no-comment',
    title: 'Without comment',
    description: 'Worklogs with no description of the work done',
    matches: (w) => !w.comment?.trim(),
};

const epicRule: HygieneRule = {
    key: 'no-epic',
    title: 'Without epic',
    description: 'Time logged on issues not linked to any epic',
    matches: (w) => !w.epicDisplay,
};

const resolvedRule: HygieneRule = {
    key: 'after-resolved',
    title: 'After resolved',
    description: 'Work dated after the day the issue was resolved',
    matches: isLoggedAfterResolved,
};

export function buildHygieneMetrics(worklogs: VisualizationWorklog[], totalTimeSpent: number, includeEpic: boolean): HygieneMetric[] {
    const rules = includeEpic ? [commentRule, epicRule, resolvedRule] : [commentRule, resolvedRule];

    return rules.map(({ key, title, description, matches }) => {
        const matched = worklogs.filter(matches);
        const timeSpent = matched.reduce((sum, w) => sum + (w.timeSpent || 0), 0);
        return { key, title, description, worklogCount: matched.length, timeSpent, percentage: toPercentage(timeSpent, totalTimeSpent) };
    });
}
