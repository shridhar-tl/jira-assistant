import { usePokerStore } from '@/stores/poker-store';

import ControlBox from './ControlBox';

export default function InfoBox() {
    const { viewingIssueId, votesMap, members, currentIssueId, issuesMap } = usePokerStore();
    const issue = issuesMap[viewingIssueId || ''] || {};
    const vote = votesMap[viewingIssueId || ''] || {};
    const revealed = !!vote.reveal;
    const isCurrent = !!viewingIssueId && viewingIssueId === currentIssueId;

    const votedCount = isCurrent ? members.filter((m) => !!m[`vote_${viewingIssueId}` as keyof typeof m]).length : 0;
    const totalCount = members.length;
    const percentage = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

    let statusLabel = 'No round in progress';
    let statusColor = 'text-[var(--text-secondary)]';
    let statusBg = 'bg-[var(--bg-secondary)]';
    let statusBorder = 'border-[var(--border-color)]';
    let statusIcon = 'fa fa-circle-o';

    if (revealed) {
        statusLabel = 'Votes revealed';
        statusColor = 'text-emerald-700 dark:text-emerald-300';
        statusBg = 'bg-emerald-500/10';
        statusBorder = 'border-emerald-500/30';
        statusIcon = 'fa fa-check-circle';
    } else if (isCurrent) {
        statusLabel = 'Voting in progress';
        statusColor = 'text-amber-700 dark:text-amber-300';
        statusBg = 'bg-amber-500/10';
        statusBorder = 'border-amber-500/30';
        statusIcon = 'fa fa-clock-o';
    }

    return (
        <section className="poker-stage relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-lg sm:rounded-3xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
            <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative px-4 py-5 sm:px-7 sm:py-6">
                <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                        <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${statusBg} ${statusBorder}`}>
                            <span className={`${statusIcon} text-[11px] ${statusColor}`} />
                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
                        </div>

                        <IssueDetail issue={issue} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:shrink-0">
                        <VoteStats revealed={revealed} finalScore={vote.finalScore} average={vote.average} />
                        <div className="hidden lg:block">
                            <ControlBox variant="inline" />
                        </div>
                    </div>
                </div>

                {isCurrent && (
                    <div className="mt-5">
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)]">
                            <span>
                                <span className="font-bold text-[var(--text-primary)]">{votedCount}</span> of {totalCount} voted
                            </span>
                            <span>{percentage}%</span>
                        </div>
                        <div className="relative h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                    revealed
                                        ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500'
                                        : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                            />
                            {!revealed && percentage < 100 && (
                                <div
                                    className="absolute top-0 h-full w-12 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    style={{ left: `${percentage}%` }}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-4 lg:hidden">
                    <ControlBox variant="inline" />
                </div>
            </div>
        </section>
    );
}

interface IssueShape {
    key?: string;
    summary?: string;
    icon?: string;
    url?: string;
}

function IssueDetail({ issue }: { issue: IssueShape }) {
    if (!issue.key) {
        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                    <span className="fa fa-inbox text-[var(--text-secondary)]" />
                    No issue selected
                </div>
                <p className="text-xs text-[var(--text-secondary)] sm:text-sm">Pick or add an issue from the issues panel to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                {issue.icon && <img src={issue.icon} alt="" className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />}
                <span className="text-base font-bold tracking-wide text-[var(--primary-color)] sm:text-lg">
                    {issue.url ? (
                        <a href={issue.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {issue.key}
                        </a>
                    ) : (
                        issue.key
                    )}
                </span>
            </div>
            {issue.summary && (
                <p className="line-clamp-2 text-sm font-medium text-[var(--text-primary)] sm:text-base sm:font-semibold">{issue.summary}</p>
            )}
        </div>
    );
}

interface VoteStatsProps {
    revealed: boolean;
    finalScore?: number | string;
    average?: number;
}

function VoteStats({ revealed, finalScore, average }: VoteStatsProps) {
    return (
        <div className="flex items-stretch gap-2 sm:gap-3">
            <Stat
                label="Final"
                value={revealed && finalScore !== undefined ? finalScore : '—'}
                accent="text-[var(--primary-color)]"
                glow="from-indigo-500/15 to-indigo-500/0"
            />
            <Stat
                label="Average"
                value={revealed && average !== undefined ? average.toFixed(1) : '—'}
                accent="text-emerald-600 dark:text-emerald-300"
                glow="from-emerald-500/15 to-emerald-500/0"
            />
        </div>
    );
}

function Stat({ label, value, accent, glow }: { label: string; value: number | string; accent: string; glow: string }) {
    return (
        <div
            className="relative flex min-w-[68px] flex-col items-center gap-0.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-3 py-2 sm:min-w-[78px] sm:px-4"
        >
            <div className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b ${glow}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] sm:text-[11px]">{label}</span>
            <span className={`relative text-lg font-black tabular-nums sm:text-xl ${accent}`}>{value}</span>
        </div>
    );
}
