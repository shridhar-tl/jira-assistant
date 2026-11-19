import { inject } from '@services';

import { convertToDate } from '@utils/helpers';

import { getCached, writeCache } from './cache';
import { cacheTtl, defaultTeamDefinition, teamDefinitionVersion, teamPropertyKey } from './constants';
import { getBoardPropertyDirect, getJiraErrorMessage } from './jira-api';
import { assertPropertySize } from './property-limits';
import { ensureStorageAllowed } from './storage-consent';
import { writeTeamProperty } from './team-property-writer';
import type { LeaveSourceConfig, TeamDefinition, TeamMember } from './types';

const maxMembers = 300;
const maxMappings = 300;
const maxSprintOverrides = 30;
const maxSegmentLabels = 30;
const maxSources = 20;

export class TeamConflictError extends Error {
    latest: TeamDefinition;

    constructor(latest: TeamDefinition) {
        super('The team settings were changed by someone else. The latest version is loaded. Apply your change again.');
        this.latest = latest;
    }
}

function getTeamCacheKey(boardId: number): string {
    return `team_${boardId}`;
}

function normalizeMember(member: Partial<TeamMember>): TeamMember | null {
    if (!member?.id) {
        return null;
    }
    const allocation = Number(member.allocation);
    return {
        id: String(member.id),
        displayName: member.displayName || String(member.id),
        avatarUrl: member.avatarUrl,
        email: member.email,
        allocation: Number.isFinite(allocation) && allocation >= 0 ? Math.min(100, allocation) : 100,
        hoursPerDay: typeof member.hoursPerDay === 'number' && member.hoursPerDay > 0 ? member.hoursPerDay : null,
        workingDays: Array.isArray(member.workingDays) && member.workingDays.length ? [...member.workingDays] : null,
    };
}

function normalizeSources(sources: unknown): LeaveSourceConfig[] {
    if (!Array.isArray(sources)) {
        return [];
    }
    return (sources as LeaveSourceConfig[])
        .filter((s) => s?.id && s.type)
        .slice(0, maxSources)
        .map((s) => ({
            id: s.id,
            type: s.type,
            kind: s.kind === 'holiday' ? 'holiday' : 'leave',
            name: s.name || '',
            calendarId: s.calendarId || '',
            url: s.url,
            memberIds: Array.isArray(s.memberIds) ? s.memberIds : undefined,
            importedAt: s.importedAt,
            importedCount: s.importedCount,
            rules: {
                keywords: Array.isArray(s.rules?.keywords) ? s.rules.keywords : [],
                showAs: Array.isArray(s.rules?.showAs) ? s.rules.showAs : ['any'],
                allDayOnly: !!s.rules?.allDayOnly,
            },
        }));
}

function normalizeMapping(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object') {
        return {};
    }
    const entries = Object.entries(value as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string' && !!e[0]);
    return Object.fromEntries(entries.slice(-maxMappings));
}

function normalizeSprintOverrides(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object') {
        return {};
    }
    const entries = Object.entries(value as Record<string, unknown>)
        .filter((e): e is [string, number] => /^\d+$/.test(e[0]) && typeof e[1] === 'number' && Number.isFinite(e[1]) && e[1] >= 0)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .slice(0, maxSprintOverrides);
    return Object.fromEntries(entries);
}

export function createDefaultTeam(): TeamDefinition {
    const { $session } = inject('SessionService');
    const workingDays = $session.CurrentUser?.workingDays;
    return {
        ...structuredClone(defaultTeamDefinition),
        defaults: {
            ...defaultTeamDefinition.defaults,
            workingDays: workingDays?.length ? [...workingDays] : [...defaultTeamDefinition.defaults.workingDays],
        },
        updated: '',
        updatedBy: '',
    };
}

function normalizeTimestamp(value: unknown): string {
    const date = value ? convertToDate(value) : undefined;
    return date ? date.toISOString() : '';
}

export function normalizeTeamDefinition(value: Partial<TeamDefinition> | null | undefined): TeamDefinition {
    const defaults = createDefaultTeam();
    if (!value || typeof value !== 'object') {
        return defaults;
    }

    const focusFactor = Number(value.focusFactor);
    const hoursPerPoint = Number(value.hoursPerPoint);

    return {
        ...defaults,
        groupName: value.groupName ?? null,
        atlassianTeamId: value.atlassianTeamId ?? null,
        version: teamDefinitionVersion,
        updated: normalizeTimestamp(value.updated),
        updatedBy: value.updatedBy || '',
        memberSource: value.memberSource === 'group' || value.memberSource === 'atlassianTeam' ? value.memberSource : 'board',
        members: (Array.isArray(value.members) ? value.members : []).map(normalizeMember).filter((m): m is TeamMember => !!m).slice(0, maxMembers),
        excludedMemberIds: Array.isArray(value.excludedMemberIds) ? value.excludedMemberIds : [],
        defaults: {
            hoursPerDay: Number(value.defaults?.hoursPerDay) > 0 ? Number(value.defaults?.hoursPerDay) : defaults.defaults.hoursPerDay,
            workingDays: value.defaults?.workingDays?.length ? value.defaults.workingDays : defaults.defaults.workingDays,
        },
        focusFactor: Number.isFinite(focusFactor) && focusFactor > 0 ? Math.min(100, focusFactor) : defaults.focusFactor,
        planningUnit: value.planningUnit === 'hours' || value.planningUnit === 'both' ? value.planningUnit : 'points',
        hoursPerPoint: Number.isFinite(hoursPerPoint) && hoursPerPoint > 0 ? hoursPerPoint : defaults.hoursPerPoint,
        velocity: { ...defaults.velocity, ...(value.velocity || {}) },
        leaveSources: normalizeSources(value.leaveSources),
        userMapping: normalizeMapping(value.userMapping),
        sprintOverrides: normalizeSprintOverrides(value.sprintOverrides),
        segmentLabels: Array.isArray(value.segmentLabels)
            ? value.segmentLabels.filter((l): l is string => typeof l === 'string' && !!l.trim()).slice(0, maxSegmentLabels)
            : defaults.segmentLabels,
    };
}

export function loadTeamDefinition(boardId: number, force?: boolean): Promise<TeamDefinition> {
    return getCached(
        getTeamCacheKey(boardId),
        cacheTtl.team,
        async () => normalizeTeamDefinition(await getBoardPropertyDirect<TeamDefinition>(boardId, teamPropertyKey)),
        force,
    ).then((team) => normalizeTeamDefinition(team));
}

export async function loadTeamDefinitions(boardIds: number[], force?: boolean): Promise<Record<number, TeamDefinition>> {
    const teams = await Promise.all(boardIds.map((id) => loadTeamDefinition(id, force)));
    return boardIds.reduce<Record<number, TeamDefinition>>((result, id, index) => {
        result[id] = teams[index];
        return result;
    }, {});
}

export async function saveTeamDefinition(boardId: number, team: TeamDefinition): Promise<TeamDefinition> {
    ensureStorageAllowed();
    const { $session } = inject('SessionService');
    const latest = normalizeTeamDefinition(await getBoardPropertyDirect<TeamDefinition>(boardId, teamPropertyKey));

    if (latest.updated && latest.updated !== team.updated) {
        writeCache(getTeamCacheKey(boardId), latest, cacheTtl.team);
        throw new TeamConflictError(latest);
    }

    const user = $session.CurrentUser;
    const toSave: TeamDefinition = {
        ...normalizeTeamDefinition(team),
        updated: new Date().toISOString(),
        updatedBy: user?.accountId || user?.name || '',
    };
    assertPropertySize(toSave, 'The team settings');

    await writeTeamProperty(boardId, teamPropertyKey, toSave);
    writeCache(getTeamCacheKey(boardId), toSave, cacheTtl.team);
    return toSave;
}

const boardPermissionMessage = /nopermission/i;

export function isPermissionError(err: unknown): boolean {
    const status = (err as { status?: number })?.status;
    return status === 401 || status === 403 || (status === 404 && boardPermissionMessage.test(getJiraErrorMessage(err)));
}
