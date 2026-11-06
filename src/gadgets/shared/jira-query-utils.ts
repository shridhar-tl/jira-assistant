import type { UserGroup } from '@/types';

import { inject } from '@services';
import type { JiraUser } from '@services/jira-service';

const orderByPattern = /\border\s+by\b[\s\S]*$/i;

export function getJiraUserId(user: JiraUser & { key?: string }): string {
    return user.accountId || user.name || user.key || '';
}

export function getUserAvatarUrl(user: JiraUser): string | undefined {
    return user.avatarUrls?.['24x24'] || user.avatarUrls?.['32x32'];
}

export function escapeJqlValue(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function stripOrderBy(jql: string): string {
    return jql.replace(orderByPattern, '').trim();
}

export function getUserJqlValue(user: JiraUser): string {
    const { $session } = inject('SessionService');
    return ($session.CurrentUser?.isAtlasCloud ? user.accountId : user.name) || getJiraUserId(user);
}

/**
 * Returns the groups selected for a report along with the members of Jira groups.
 * When no groups are selected for the report, the user groups saved in settings are used.
 */
export async function resolveUserGroups(reportGroups: UserGroup[] | null): Promise<UserGroup[]> {
    const { $usergroup } = inject('UserGroupService');
    if (!reportGroups) {
        return ((await $usergroup.getUserGroups()) as UserGroup[]) || [];
    }

    const groups = reportGroups.map((g) => ({ ...g, users: [...(g.users || [])] }));
    await $usergroup.fillJiraGroupMembers(groups.filter((g) => g.isJiraGroup));
    return groups;
}

export function getGroupUsersJqlValues(groups: UserGroup[]): string[] {
    const values = new Map<string, string>();
    for (const group of groups) {
        for (const user of group.users || []) {
            const value = getUserJqlValue(user);
            if (value) {
                values.set(getJiraUserId(user), value);
            }
        }
    }
    return [...values.values()];
}
