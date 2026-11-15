import { addDays, addWeeks, isAfter, isBefore, startOfDay } from 'date-fns';

import type { ResourceTimelineEvent } from '@components';

import type { BoardData } from '../../../shared/board-loader';
import { createDistributionContext, getIssueHours } from '../../../shared/capacity';
import { getContrastText, getParentColor, statusCategoryBarColors } from '../../../shared/colors';
import { getIssuePlanParts } from '../../../shared/load-distribution';
import type { BarColorMode, PlannerIssue } from '../../../shared/types';

export interface ResourceEventData extends Record<string, unknown> {
    issueKey: string;
    segmentId: string | null;
    personId: string;
    derived: boolean;
    allocation: number;
}

export interface ResourceModel {
    events: ResourceTimelineEvent[];
    unscheduled: PlannerIssue[];
    range: { start: Date; end: Date };
}

const defaultWeeks = 8;
const pastDays = 7;

function getColor(issue: PlannerIssue, mode: BarColorMode, data: BoardData): string {
    if (mode === 'epic') {
        const parentKey = issue.epicKey || issue.parentKey;
        if (parentKey) {
            return getParentColor(parentKey, data.parents[parentKey]?.color);
        }
    }
    return statusCategoryBarColors[issue.statusCategory];
}

/**
 * Bars of the resource timeline: each planned segment per person, otherwise the assignee over the native or derived dates.
 * Issues of team members (or unassigned issues) that cannot be placed in time go to the unscheduled list.
 */
export function buildResourceModel(data: BoardData, colorMode: BarColorMode, leadTimeDays: number, canEdit: boolean): ResourceModel {
    const memberIds = new Set(data.members.map((m) => m.id));
    const events: ResourceTimelineEvent[] = [];
    const unscheduled: PlannerIssue[] = [];
    const keys = new Set(Object.keys(data.issues));
    const today = startOfDay(new Date());
    let start = addDays(today, -pastDays);
    let end = addWeeks(today, defaultWeeks);

    for (const issue of Object.values(data.issues)) {
        if (issue.statusCategory === 'done' || (issue.isSubtask && issue.parentKey && keys.has(issue.parentKey) && !issue.segments.length)) {
            continue;
        }
        const range = issue.currentSprintId ? data.sprintRanges.get(issue.currentSprintId) || null : null;
        const ctx = createDistributionContext(data.members, data.team, data.leaveIndex, range, leadTimeDays);
        const { parts, isDerived } = getIssuePlanParts(issue, getIssueHours(issue), ctx);
        const visibleParts = parts.filter((p) => memberIds.has(p.personId));

        if (!visibleParts.length) {
            if (!parts.length && (!issue.assignee || memberIds.has(issue.assignee.id))) {
                unscheduled.push(issue);
            }
            continue;
        }

        const color = getColor(issue, colorMode, data);
        for (const part of visibleParts) {
            if (isBefore(part.start, start) && isAfter(part.end, start)) {
                start = part.start;
            }
            if (isAfter(part.end, end)) {
                end = part.end;
            }
            events.push({
                id: `${issue.key}::${part.segmentId || 'plan'}::${part.personId}`,
                resourceId: part.personId,
                start: part.start,
                end: part.end,
                title: `${issue.key} ${part.label ? `[${part.label}] ` : ''}${issue.summary}`,
                color: isDerived ? `${color}66` : color,
                textColor: isDerived ? '#172b4d' : getContrastText(color),
                draggable: canEdit,
                resizable: canEdit,
                data: {
                    issueKey: issue.key,
                    segmentId: part.segmentId || null,
                    personId: part.personId,
                    derived: isDerived,
                    allocation: Math.round(part.weight * 100),
                } satisfies ResourceEventData,
            });
        }
    }

    const lastSprint = data.sprints[data.sprints.length - 1];
    const lastEnd = lastSprint ? data.sprintRanges.get(lastSprint.id)?.end : undefined;
    if (lastEnd && isAfter(lastEnd, end)) {
        end = lastEnd;
    }

    return { events, unscheduled: unscheduled.sort((a, b) => a.key.localeCompare(b.key)), range: { start, end: addDays(end, 3) } };
}
