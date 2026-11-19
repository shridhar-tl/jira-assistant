import { useEffect, useMemo, useState } from 'react';

import { inject } from '@services';

import { Button } from '@components';

import { createDistributionContext, getIssueHours } from '../../../shared/capacity';
import { formatNumber, getDisplayUnit } from '../../../shared/format';
import { computeSprintHealth, type ScopeChange } from '../../../shared/health';
import { getIssuePlanParts, getPersonShares } from '../../../shared/load-distribution';
import { loadLoggedTime, loadScopeChange, type LoggedTime } from '../../../shared/sprint-tracking';
import type { PlannerIssue } from '../../../shared/types';
import type { BoardModel } from '../../useBoardModel';
import SprintHealthCard from './SprintHealthCard';

interface HealthViewProps {
    model: BoardModel;
    compact?: boolean;
}

function getIssueUrl(key: string): string {
    const { $userutils } = inject('UserUtilsService');
    return $userutils.getTicketUrl(key) || '';
}

export default function HealthView({ model, compact }: HealthViewProps) {
    const { data, openSprints, capacities, blocking } = model;
    const unit = getDisplayUnit(data.team.planningUnit, data.estimateUnit);
    const activeSprint = openSprints.find((s) => s.state === 'active') || null;
    const [scopeChanges, setScopeChanges] = useState<Record<number, ScopeChange | null>>({});
    const [logged, setLogged] = useState<LoggedTime | null>(null);
    const [isLoadingLogged, setIsLoadingLogged] = useState(false);

    const sprintIssues = useMemo(() => {
        const result: Record<number, PlannerIssue[]> = {};
        openSprints.forEach((s) => (result[s.id] = (data.columns[String(s.id)] || []).map((k) => data.issues[k]).filter((i): i is PlannerIssue => !!i)));
        return result;
    }, [openSprints, data.columns, data.issues]);

    useEffect(() => {
        if (!activeSprint) {
            return;
        }
        let cancelled = false;
        const keys = (sprintIssues[activeSprint.id] || []).filter((i) => !i.isSubtask).map((i) => i.key);
        loadScopeChange(data.board.id, activeSprint.id, keys)
            .then((change) => !cancelled && setScopeChanges((prev) => ({ ...prev, [activeSprint.id]: change })))
            .catch((err) => console.warn('Unable to read the scope change of the sprint', err));
        return () => {
            cancelled = true;
        };
    }, [data.board.id, activeSprint?.id]);

    const openSprintIds = useMemo(() => new Set(openSprints.map((s) => s.id)), [openSprints]);

    const healths = useMemo(
        () =>
            openSprints.map((sprint) => ({
                sprint,
                health: computeSprintHealth({
                    sprint,
                    range: data.sprintRanges.get(sprint.id) || null,
                    issues: sprintIssues[sprint.id] || [],
                    capacity: capacities.get(sprint.id) || null,
                    blockingDependencies: blocking,
                    openSprintIds,
                    estimateUnit: data.estimateUnit,
                    scopeChange: scopeChanges[sprint.id] ?? null,
                }),
            })),
        [openSprints, data, sprintIssues, capacities, blocking, openSprintIds, scopeChanges],
    );

    const activeCapacity = activeSprint ? capacities.get(activeSprint.id) : undefined;
    const activeRange = activeSprint ? data.sprintRanges.get(activeSprint.id) : undefined;

    const loadLogged = async () => {
        if (!activeSprint || !activeRange) {
            return;
        }
        setIsLoadingLogged(true);
        try {
            setLogged(await loadLoggedTime(activeSprint.id, activeRange.start, activeRange.end));
        } catch (err) {
            console.error('Unable to load the logged time', err);
        } finally {
            setIsLoadingLogged(false);
        }
    };

    const hoursByMember = useMemo(() => {
        const result: Record<string, { committed: number; remaining: number }> = {};
        if (!activeSprint) {
            return result;
        }
        const ctx = createDistributionContext(data.members, data.team, data.leaveIndex, data.sprintRanges.get(activeSprint.id) || null);
        for (const issue of sprintIssues[activeSprint.id] || []) {
            const committed = (issue.originalEstimate || 0) / 3600;
            const remaining = issue.statusCategory === 'done' ? 0 : getIssueHours(issue);
            const shares = getPersonShares(getIssuePlanParts(issue, remaining, ctx).parts, ctx);
            shares.forEach((share, personId) => {
                const entry = result[personId] || (result[personId] = { committed: 0, remaining: 0 });
                entry.committed += committed * share;
                entry.remaining += remaining * share;
            });
        }
        return result;
    }, [activeSprint, sprintIssues, data.members, data.team, data.leaveIndex, data.sprintRanges]);

    if (!openSprints.length) {
        return <div className="p-6 text-center text-sm text-(--text-secondary)">This board has no active or future sprints.</div>;
    }

    return (
        <div className="flex flex-col gap-4 p-3">
            {compact && <div className="text-xs text-(--text-secondary)">The sprint board needs a larger screen. Here is the summary of each sprint.</div>}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {healths.map(({ sprint, health }) => (
                    <SprintHealthCard key={sprint.id} sprint={sprint} health={health} capacity={capacities.get(sprint.id) || null} unit={unit} issueUrl={getIssueUrl} />
                ))}
            </div>

            {!compact && activeSprint && activeCapacity && (
                <section className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Planned vs actual · {activeSprint.name}</h3>
                        <span className="flex-1" />
                        <Button size="sm" layout="outlined" label={logged ? 'Reload logged time' : 'Load logged time'} isLoading={isLoadingLogged} onClick={loadLogged} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="exportable w-full min-w-[520px] border-collapse text-sm" data-export-sheet-name="Planned vs actual">
                            <thead>
                                <tr className="border-b border-(--border-primary) text-left text-xs text-(--text-secondary)">
                                    <th className="px-2 py-1">Member</th>
                                    <th className="px-2 py-1 text-right">Capacity (h)</th>
                                    <th className="px-2 py-1 text-right">Committed, original estimate (h)</th>
                                    <th className="px-2 py-1 text-right">Remaining estimate (h)</th>
                                    <th className="px-2 py-1 text-right">Logged in sprint (h)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeCapacity.members.map((row) => (
                                    <tr key={row.member.id} className="border-b border-(--border-secondary)">
                                        <td className="px-2 py-1">{row.member.displayName}</td>
                                        <td className="px-2 py-1 text-right">{formatNumber(row.capacityHours)}</td>
                                        <td className="px-2 py-1 text-right">{formatNumber(hoursByMember[row.member.id]?.committed || 0)}</td>
                                        <td className="px-2 py-1 text-right">{formatNumber(hoursByMember[row.member.id]?.remaining || 0)}</td>
                                        <td className="px-2 py-1 text-right">{logged ? formatNumber(logged.byMember[row.member.id] || 0) : '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {logged && logged.partialIssues.length > 0 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                            Some issues have more worklogs than Jira returns in a search, so their logged time is incomplete: {logged.partialIssues.join(', ')}
                        </span>
                    )}
                </section>
            )}
        </div>
    );
}
