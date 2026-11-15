import { useEffect, useMemo, useState } from 'react';

import { WeekDaysSelector } from '@/controls';

import { inject } from '@services';

import { Button, Dropdown, NumericInput, SelectButton } from '@components';

import type { BoardData } from '../../../../shared/board-loader';
import Field from '../../../../shared/components/Field';
import UserAvatar from '../../../../shared/components/UserAvatar';
import UserPicker from '../../../../shared/components/UserPicker';
import type { MemberSource, TeamDefinition, TeamMember } from '../../../../shared/types';

interface MembersTabProps {
    team: TeamDefinition;
    data: BoardData;
    onChange: (team: TeamDefinition) => void;
}

const sourceItems = [
    { label: 'Board assignees', value: 'board' },
    { label: 'JA user group', value: 'group' },
    { label: 'Atlassian team', value: 'atlassianTeam' },
];

function upsertMember(team: TeamDefinition, member: TeamMember): TeamDefinition {
    const exists = team.members.some((m) => m.id === member.id);
    return {
        ...team,
        members: exists ? team.members.map((m) => (m.id === member.id ? member : m)) : [...team.members, member],
        excludedMemberIds: team.excludedMemberIds.filter((id) => id !== member.id),
    };
}

/** Who is in the team, where the members come from, and each member's allocation and schedule overrides (CP-2). */
export default function MembersTab({ team, data, onChange }: MembersTabProps) {
    const { $session } = inject('SessionService');
    const isCloud = !!$session.CurrentUser?.isAtlasCloud;
    const [groups, setGroups] = useState<string[]>([]);
    const [editing, setEditing] = useState<string | null>(null);

    useEffect(() => {
        const { $usergroup } = inject('UserGroupService');
        $usergroup
            .getUserGroups()
            .then((list: { name: string }[]) => setGroups((list || []).map((g) => g.name)))
            .catch(console.error);
    }, []);

    const atlassianTeams = useMemo(() => {
        const map = new Map<string, string>();
        Object.values(data.issues).forEach((i) => i.teamId && map.set(i.teamId, i.teamName || i.teamId));
        return [...map.entries()].map(([value, label]) => ({ value, label }));
    }, [data.issues]);

    const members = useMemo(() => {
        const stored = new Map(team.members.map((m) => [m.id, m]));
        const list = data.members.map((m) => stored.get(m.id) || m);
        team.members.filter((m) => !list.some((l) => l.id === m.id) && !team.excludedMemberIds.includes(m.id)).forEach((m) => list.push(m));
        return list.filter((m) => !team.excludedMemberIds.includes(m.id)).sort((a, b) => a.displayName.localeCompare(b.displayName));
    }, [data.members, team.members, team.excludedMemberIds]);

    const excluded = data.members.length ? team.excludedMemberIds : [];

    return (
        <div className="flex flex-col gap-4">
            <Field label="Team members come from">
                <SelectButton
                    items={isCloud ? sourceItems : sourceItems.filter((s) => s.value !== 'atlassianTeam')}
                    value={team.memberSource}
                    onChange={(e) => onChange({ ...team, memberSource: e.value as MemberSource })}
                />
            </Field>
            {team.memberSource === 'group' && (
                <Field label="User group" hint="Groups are managed under Settings → User groups.">
                    <Dropdown options={groups.map((g) => ({ label: g, value: g }))} value={team.groupName || undefined} onChange={(e) => onChange({ ...team, groupName: e.value as string })} searchable />
                </Field>
            )}
            {team.memberSource === 'atlassianTeam' && (
                <Field label="Atlassian team" hint="Teams set in the Team field of this board's issues. Members are the assignees of that team's issues.">
                    <Dropdown options={atlassianTeams} value={team.atlassianTeamId || undefined} onChange={(e) => onChange({ ...team, atlassianTeamId: e.value as string })} emptyMessage="No issue on this board has a team" />
                </Field>
            )}

            <Field label="Add a person">
                <UserPicker
                    value={null}
                    suggestions={[]}
                    placeholder="Search Jira users"
                    onChange={(user) => user && onChange(upsertMember(team, { ...user, allocation: 100, hoursPerDay: null, workingDays: null }))}
                />
            </Field>

            <div className="flex flex-col divide-y divide-(--border-secondary) rounded border border-(--border-primary)">
                {members.map((member) => {
                    const isEditing = editing === member.id;
                    return (
                        <div key={member.id} className="flex flex-col gap-2 px-2 py-1.5">
                            <div className="flex items-center gap-2 text-sm">
                                <UserAvatar name={member.displayName} avatarUrl={member.avatarUrl} size="sm" />
                                <span className="min-w-0 flex-1 truncate">{member.displayName}</span>
                                <span className="text-xs text-(--text-secondary)">
                                    {member.allocation}% · {member.hoursPerDay ?? team.defaults.hoursPerDay} h/day
                                </span>
                                <Button size="xs" layout="plain" leftIcon={<i className="fa fa-sliders" />} ariaLabel="Edit schedule" onClick={() => setEditing(isEditing ? null : member.id)} />
                                <Button
                                    size="xs"
                                    layout="plain"
                                    variant="danger"
                                    leftIcon={<i className="fa fa-user-times" />}
                                    ariaLabel="Remove from team"
                                    onClick={() =>
                                        onChange({
                                            ...team,
                                            members: team.members.filter((m) => m.id !== member.id),
                                            excludedMemberIds: [...new Set([...team.excludedMemberIds, member.id])],
                                        })
                                    }
                                />
                            </div>
                            {isEditing && (
                                <div className="grid grid-cols-1 gap-2 ps-7 sm:grid-cols-3">
                                    <Field label="Allocation to this team (%)">
                                        <NumericInput value={member.allocation} min={0} max={100} step={10} onChange={(e) => onChange(upsertMember(team, { ...member, allocation: e.value ?? 100 }))} />
                                    </Field>
                                    <Field label="Hours per day" hint="Empty uses the team default.">
                                        <NumericInput value={member.hoursPerDay ?? undefined} min={0.5} max={24} step={0.5} maxDecimals={1} onChange={(e) => onChange(upsertMember(team, { ...member, hoursPerDay: e.value ?? null }))} />
                                    </Field>
                                    <Field label="Working days">
                                        <WeekDaysSelector
                                            field="workingDays"
                                            value={member.workingDays || team.defaults.workingDays}
                                            onChange={(value) => onChange(upsertMember(team, { ...member, workingDays: value.length ? value : null }))}
                                        />
                                    </Field>
                                </div>
                            )}
                        </div>
                    );
                })}
                {!members.length && <div className="p-3 text-center text-sm text-(--text-tertiary)">No members yet. Add people or choose another source.</div>}
            </div>

            {excluded.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-secondary)">
                    <span>Removed:</span>
                    {excluded.map((id) => (
                        <button
                            type="button"
                            key={id}
                            className="cursor-pointer rounded bg-(--bg-tertiary) px-1.5 hover:bg-(--bg-hover)"
                            title="Add back to the team"
                            onClick={() => onChange({ ...team, excludedMemberIds: team.excludedMemberIds.filter((e) => e !== id) })}
                        >
                            {data.issues && Object.values(data.issues).find((i) => i.assignee?.id === id)?.assignee?.displayName || id} <i className="fa fa-undo" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
