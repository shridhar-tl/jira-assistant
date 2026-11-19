import { useMemo, useState } from 'react';

import classNames from 'classnames';

import { inject } from '@services';

import { Button, InputSwitch } from '@components';

import { conflictLabels, type Dependency } from '../dependencies';
import type { PlannerIssue } from '../types';

interface DependencyTableProps {
    dependencies: Dependency[];
    issues: Record<string, PlannerIssue>;
    locationOf: (key: string) => string;
    teamOf?: (key: string) => string;
    summaryOf?: (key: string) => string | undefined;
    canRemove: boolean;
    onRemove: (dependency: Dependency) => void;
}

function issueUrl(key: string): string {
    const { $userutils } = inject('UserUtilsService');
    return $userutils.getTicketUrl(key) || '';
}

export default function DependencyTable({ dependencies, issues, locationOf, teamOf, summaryOf, canRemove, onRemove }: DependencyTableProps) {
    const [conflictsOnly, setConflictsOnly] = useState(false);
    const [crossTeamOnly, setCrossTeamOnly] = useState(false);

    const rows = useMemo(
        () =>
            dependencies
                .filter((d) => (!conflictsOnly || (d.conflict !== 'none' && !d.blockerDone)) && (!crossTeamOnly || d.crossTeam))
                .sort((a, b) => Number(b.conflict !== 'none') - Number(a.conflict !== 'none') || a.dependantKey.localeCompare(b.dependantKey)),
        [dependencies, conflictsOnly, crossTeamOnly],
    );

    const renderIssue = (key: string) => (
        <div className="flex min-w-0 flex-col">
            <a href={issueUrl(key)} target="_blank" rel="noreferrer" className="cursor-pointer font-medium hover:underline">
                {key}
            </a>
            <span className="truncate text-xs text-(--text-secondary)" title={issues[key]?.summary}>
                {issues[key]?.summary || summaryOf?.(key) || 'Not loaded in this plan'}
            </span>
        </div>
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-(--text-secondary)">
                    {dependencies.length} dependencies · {dependencies.filter((d) => d.conflict !== 'none' && !d.blockerDone).length} conflicts
                </span>
                <span className="flex-1" />
                <InputSwitch label="Conflicts only" checked={conflictsOnly} onChange={(e) => setConflictsOnly(e.value)} />
                <InputSwitch label="Cross-team only" checked={crossTeamOnly} onChange={(e) => setCrossTeamOnly(e.value)} />
            </div>
            <div className="overflow-x-auto">
                <table className="exportable w-full min-w-[640px] border-collapse text-sm" data-export-sheet-name="Dependencies">
                    <thead>
                        <tr className="bg-(--bg-secondary) text-left text-xs text-(--text-secondary)">
                            <th className="px-2 py-1.5">Blocker</th>
                            <th className="px-2 py-1.5">Planned in</th>
                            <th className="px-2 py-1.5">Blocks</th>
                            <th className="px-2 py-1.5">Planned in</th>
                            <th className="px-2 py-1.5">State</th>
                            <th className="px-2 py-1.5" data-export-ignore="true" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((dep) => {
                            const conflict = dep.conflict !== 'none' && !dep.blockerDone;
                            return (
                                <tr key={dep.id} className={classNames('border-t border-(--border-secondary)', { 'bg-red-50 dark:bg-red-900/20': conflict })}>
                                    <td className="max-w-64 px-2 py-1.5">{renderIssue(dep.blockerKey)}</td>
                                    <td className="px-2 py-1.5 text-xs">
                                        {dep.blockerDone ? 'Done' : locationOf(dep.blockerKey)}
                                        {teamOf && <div className="text-(--text-tertiary)">{teamOf(dep.blockerKey)}</div>}
                                    </td>
                                    <td className="max-w-64 px-2 py-1.5">{renderIssue(dep.dependantKey)}</td>
                                    <td className="px-2 py-1.5 text-xs">
                                        {locationOf(dep.dependantKey)}
                                        {teamOf && <div className="text-(--text-tertiary)">{teamOf(dep.dependantKey)}</div>}
                                    </td>
                                    <td className={classNames('px-2 py-1.5 text-xs', conflict ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                                        {dep.blockerDone ? 'Resolved' : conflictLabels[dep.conflict]}
                                        {dep.crossTeam && <span className="ms-1 rounded bg-(--bg-tertiary) px-1 text-(--text-secondary)">cross-team</span>}
                                    </td>
                                    <td className="px-2 py-1.5 text-right">
                                        {canRemove && (
                                            <Button size="xs" layout="plain" variant="danger" leftIcon={<i className="fa fa-chain-broken" />} ariaLabel="Remove dependency" confirmText="Remove this issue link from Jira?" onClick={() => onRemove(dep)} />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {!rows.length && (
                            <tr data-export-ignore="true">
                                <td colSpan={6} className="px-2 py-6 text-center text-(--text-tertiary)">
                                    No dependencies to show.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
