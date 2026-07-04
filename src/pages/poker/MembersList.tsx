import type { CSSProperties, ReactNode } from 'react';

import { usePokerStore } from '@/stores/poker-store';

import { Avatar } from './Avatar';
import type { PokerMember } from './types';

export default function MembersList() {
    const { members, viewingIssueId, votesMap, moderatorId, sid, currentIssueId } = usePokerStore();
    const votes = votesMap[viewingIssueId || ''] || {};
    const revealed = !!votes.reveal;
    const isVotingActive = !!(currentIssueId && currentIssueId === viewingIssueId);

    const ordered = [...members].sort((a, b) => {
        if (a.id === sid) return -1;
        if (b.id === sid) return 1;
        if (a.id === moderatorId) return -1;
        if (b.id === moderatorId) return 1;
        return 0;
    });

    return (
        <section className="poker-table relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-md sm:rounded-3xl">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center bottom, rgba(16,185,129,0.06) 0%, transparent 65%)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-x-0 bottom-10 h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)',
                }}
            />

            <div className="relative px-3 py-5 sm:px-6 sm:py-7">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        <span className="fa fa-users" />
                        Players
                        <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-primary)]">
                            {members.length}
                        </span>
                    </h3>
                    {isVotingActive && !revealed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                            <span className="fa fa-clock-o" />
                            Round in progress
                        </span>
                    )}
                    {revealed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            <span className="fa fa-eye" />
                            Cards revealed
                        </span>
                    )}
                </div>

                {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-[var(--text-secondary)]">
                        <span className="fa fa-user-plus text-3xl opacity-40" />
                        <p className="text-sm font-medium">Waiting for players to join…</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-10 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {ordered.map((m) => (
                            <Figurine
                                key={m.id}
                                member={m}
                                vote={votes[m.id]}
                                issueId={viewingIssueId || ''}
                                isModerator={m.id === moderatorId}
                                isCurrentUser={m.id === sid}
                                isVotingActive={isVotingActive}
                                revealed={revealed}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

interface FigurineProps {
    member: PokerMember;
    vote?: number | string;
    issueId: string;
    isModerator: boolean;
    isCurrentUser: boolean;
    isVotingActive: boolean;
    revealed: boolean;
}

function Figurine({ member, vote, issueId, isModerator, isCurrentUser, isVotingActive, revealed }: FigurineProps) {
    const { avatarUrl, avatarId, name } = member;
    const hasVoted = !!member[`vote_${issueId}` as keyof PokerMember];
    const tone = computeTone({ vote, revealed, isVotingActive, hasVoted, isModerator });

    const haloAnim = isVotingActive && !hasVoted && !revealed ? 'animate-[aura-pulse_1.8s_ease-in-out_infinite]' : '';
    const glowAnim = revealed || (isCurrentUser && !revealed) ? 'animate-[aura-pulse_2.4s_ease-in-out_infinite]' : '';

    return (
        <div className="figurine-wrap relative pb-5">
            <div
                className="pointer-events-none absolute -bottom-1 left-1/2 h-2.5 w-[68%] -translate-x-1/2 rounded-[50%] blur-md"
                style={{ background: 'rgba(0,0,0,0.32)' }}
            />

            <div
                className={`pointer-events-none absolute inset-x-0 -inset-y-2 -z-10 ${glowAnim}`}
                style={tone.auraStyle}
            />

            <div className="relative mx-auto w-full max-w-[150px]">
                {isModerator && (
                    <div className="absolute left-1/2 top-[-14px] z-40 -translate-x-1/2" style={{ animation: 'float-y 3s ease-in-out infinite' }}>
                        <CrownIcon />
                    </div>
                )}

                <div className="relative z-30 mx-auto" style={{ width: '54%' }}>
                    <div className={`relative ${haloAnim}`} style={{ color: tone.haloColor }}>
                        <div
                            className="absolute -inset-1.5 rounded-full bg-current opacity-30 blur-md"
                            aria-hidden
                        />
                        <div
                            className="relative aspect-square w-full overflow-hidden rounded-full border-[3px] border-white/90 shadow-xl"
                            style={{
                                background: tone.headFillStyle,
                                boxShadow: '0 8px 18px rgba(0,0,0,0.18), inset 0 -6px 10px rgba(0,0,0,0.18), inset 0 6px 8px rgba(255,255,255,0.4)',
                            }}
                        >
                            <Avatar
                                avatarUrl={avatarUrl}
                                avatarId={avatarId}
                                name={name}
                                className="text-[3rem] sm:text-[3.5rem] md:text-[4rem]"
                            />
                        </div>
                    </div>
                    {isCurrentUser && (
                        <span
                            className="absolute -right-2 -top-1 z-40 rotate-12 rounded-md bg-[var(--primary-color)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-white shadow-md sm:text-[9px]"
                        >
                            You
                        </span>
                    )}
                </div>

                <div
                    className="relative z-20 mx-auto -mt-5 h-3 w-4"
                    style={{
                        background: tone.neckStyle,
                        clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                    }}
                />

                <div
                    className={`relative z-20 -mt-1 overflow-hidden border-2 shadow-xl ${tone.bodyBorder}`}
                    style={{
                        ...tone.bodyStyle,
                        clipPath: 'polygon(8% 0%, 92% 0%, 100% 35%, 88% 100%, 12% 100%, 0% 35%)',
                        height: '78px',
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-70"
                        style={{
                            background:
                                'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 25%, transparent 55%, rgba(0,0,0,0.18) 100%)',
                        }}
                    />

                    <div
                        className="absolute left-1/2 top-1.5 h-px w-[68%] -translate-x-1/2"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
                    />
                    <div
                        className="absolute left-1/2 bottom-1.5 h-px w-[60%] -translate-x-1/2"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.18), transparent)' }}
                    />

                    <div className="absolute inset-x-3 inset-y-2.5 flex items-center justify-center">
                        <ChestDisplay
                            vote={vote}
                            revealed={revealed}
                            isVotingActive={isVotingActive}
                            hasVoted={hasVoted}
                            tone={tone}
                        />
                    </div>
                </div>

                <div
                    className="relative z-30 -mt-2 mx-auto overflow-hidden rounded-md border shadow-md"
                    style={{
                        ...tone.pedestalStyle,
                        width: '94%',
                    }}
                >
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22), transparent 45%, rgba(0,0,0,0.22))' }}
                    />
                    <p
                        className="relative truncate px-2 py-1.5 text-center text-[11px] font-black uppercase tracking-[0.14em] text-white drop-shadow-sm sm:text-xs"
                        title={name}
                    >
                        {name}
                    </p>
                </div>
            </div>
        </div>
    );
}

function CrownIcon() {
    return (
        <svg width="22" height="14" viewBox="0 0 22 14" className="drop-shadow-md">
            <defs>
                <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
            </defs>
            <path
                d="M2 12 L3.5 4 L7 8 L11 2 L15 8 L18.5 4 L20 12 Z"
                fill="url(#crownGrad)"
                stroke="#78350f"
                strokeWidth="0.8"
                strokeLinejoin="round"
            />
            <circle cx="3.5" cy="4" r="1.2" fill="#fff7e6" stroke="#78350f" strokeWidth="0.5" />
            <circle cx="11" cy="2" r="1.2" fill="#fff7e6" stroke="#78350f" strokeWidth="0.5" />
            <circle cx="18.5" cy="4" r="1.2" fill="#fff7e6" stroke="#78350f" strokeWidth="0.5" />
            <rect x="2" y="11.5" width="18" height="1.5" fill="#92400e" />
        </svg>
    );
}

interface ChestDisplayProps {
    vote?: number | string;
    revealed: boolean;
    isVotingActive: boolean;
    hasVoted: boolean;
    tone: FigurineTone;
}

function ChestDisplay({ vote, revealed, isVotingActive, hasVoted, tone }: ChestDisplayProps) {
    if (revealed) {
        return <ChestPlate>{renderRevealedContent(vote, tone)}</ChestPlate>;
    }

    if (isVotingActive && hasVoted) {
        return (
            <div
                className="flex items-center justify-center rounded-md border-2 border-emerald-200/70 px-2 py-1 shadow-inner"
                style={{ background: 'linear-gradient(160deg, #064e3b, #022c22)' }}
            >
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200 drop-shadow-sm sm:text-[11px]">
                    <span className="fa fa-lock" />
                    Locked
                </span>
            </div>
        );
    }

    if (isVotingActive && !hasVoted) {
        return (
            <div
                className="flex items-center justify-center rounded-md border border-amber-300/60 px-2 py-1 shadow-inner"
                style={{ background: 'linear-gradient(160deg, rgba(120,53,15,0.7), rgba(69,26,3,0.85))' }}
            >
                <span className="inline-flex items-center gap-1.5 text-amber-200">
                    <span className="block h-1 w-1 rounded-full bg-current opacity-50" style={{ animation: 'float-y 1.4s ease-in-out infinite' }} />
                    <span className="block h-1 w-1 rounded-full bg-current opacity-75" style={{ animation: 'float-y 1.4s ease-in-out infinite 0.15s' }} />
                    <span className="block h-1 w-1 rounded-full bg-current" style={{ animation: 'float-y 1.4s ease-in-out infinite 0.3s' }} />
                </span>
            </div>
        );
    }

    return (
        <div
            className="rounded-md border border-slate-300/60 px-2 py-1 shadow-inner"
            style={{ background: 'linear-gradient(160deg, rgba(71,85,105,0.5), rgba(30,41,59,0.7))' }}
        >
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-100 sm:text-[10px]">Standby</span>
        </div>
    );
}

function ChestPlate({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-center justify-center">
            {children}
        </div>
    );
}

function renderRevealedContent(vote: number | string | undefined, tone: FigurineTone): ReactNode {
    if (vote === undefined || vote === null) {
        return (
            <div
                className="rounded-md border border-slate-300/60 px-2 py-1 shadow-inner"
                style={{ background: 'linear-gradient(160deg, rgba(71,85,105,0.5), rgba(30,41,59,0.7))' }}
            >
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-100">No vote</span>
            </div>
        );
    }
    if (vote === '?') {
        return <span className="text-3xl drop-shadow-md sm:text-4xl">❓</span>;
    }
    if (vote === '~') {
        return <span className="text-3xl drop-shadow-md sm:text-4xl">☕</span>;
    }
    return (
        <div
            className="flex h-9 min-w-[34px] items-center justify-center rounded-md border-2 px-1.5 shadow-inner sm:h-10 sm:min-w-[40px]"
            style={tone.scoreBoxStyle}
        >
            <span className="text-xl font-black tabular-nums leading-none text-white drop-shadow sm:text-2xl">{String(vote)}</span>
        </div>
    );
}

interface FigurineTone {
    bodyStyle: CSSProperties;
    bodyBorder: string;
    headFillStyle: string;
    haloColor: string;
    neckStyle: string;
    pedestalStyle: CSSProperties;
    auraStyle: CSSProperties;
    scoreBoxStyle: CSSProperties;
}

interface ToneInputs {
    vote?: number | string;
    revealed: boolean;
    isVotingActive: boolean;
    hasVoted: boolean;
    isModerator: boolean;
}

function computeTone({ vote, revealed, isVotingActive, hasVoted, isModerator }: ToneInputs): FigurineTone {
    if (revealed) {
        if (vote === '?') {
            return makeTone({
                main: '#f97316',
                deep: '#7c2d12',
                accent: '#fed7aa',
                halo: 'rgba(251,146,60,0.55)',
            });
        }
        if (vote === '~') {
            return makeTone({
                main: '#a855f7',
                deep: '#581c87',
                accent: '#e9d5ff',
                halo: 'rgba(168,85,247,0.55)',
            });
        }
        if (vote === undefined || vote === null) {
            return makeTone({ main: '#64748b', deep: '#1e293b', accent: '#cbd5e1', halo: 'rgba(100,116,139,0.5)' });
        }
        const num = typeof vote === 'number' ? vote : parseFloat(String(vote));
        if (num <= 1) return makeTone({ main: '#10b981', deep: '#064e3b', accent: '#a7f3d0', halo: 'rgba(16,185,129,0.55)' });
        if (num <= 3) return makeTone({ main: '#14b8a6', deep: '#134e4a', accent: '#99f6e4', halo: 'rgba(20,184,166,0.55)' });
        if (num <= 8) return makeTone({ main: '#f59e0b', deep: '#78350f', accent: '#fde68a', halo: 'rgba(245,158,11,0.6)' });
        if (num <= 13) return makeTone({ main: '#f97316', deep: '#7c2d12', accent: '#fed7aa', halo: 'rgba(249,115,22,0.6)' });
        if (num <= 34) return makeTone({ main: '#f43f5e', deep: '#881337', accent: '#fecdd3', halo: 'rgba(244,63,94,0.6)' });
        return makeTone({ main: '#dc2626', deep: '#450a0a', accent: '#fecaca', halo: 'rgba(220,38,38,0.65)' });
    }

    if (isVotingActive && hasVoted) {
        return makeTone({ main: '#10b981', deep: '#064e3b', accent: '#a7f3d0', halo: 'rgba(16,185,129,0.45)' });
    }

    if (isVotingActive && !hasVoted) {
        return makeTone({ main: '#f59e0b', deep: '#78350f', accent: '#fde68a', halo: 'rgba(245,158,11,0.55)' });
    }

    if (isModerator) {
        return makeTone({ main: '#f59e0b', deep: '#78350f', accent: '#fef3c7', halo: 'rgba(245,158,11,0.45)' });
    }

    return makeTone({ main: '#64748b', deep: '#1e293b', accent: '#cbd5e1', halo: 'rgba(100,116,139,0.4)' });
}

interface PaletteInput {
    main: string;
    deep: string;
    accent: string;
    halo: string;
}

function makeTone({ main, deep, accent, halo }: PaletteInput): FigurineTone {
    return {
        bodyStyle: {
            background: `linear-gradient(160deg, ${accent} 0%, ${main} 45%, ${deep} 100%)`,
        },
        bodyBorder: 'border-transparent',
        headFillStyle: `linear-gradient(160deg, ${accent}, ${main})`,
        haloColor: halo,
        neckStyle: `linear-gradient(180deg, ${main}, ${deep})`,
        pedestalStyle: {
            background: `linear-gradient(180deg, ${main} 0%, ${deep} 100%)`,
            borderColor: deep,
        },
        auraStyle: {
            background: `radial-gradient(ellipse at center, ${halo} 0%, transparent 70%)`,
            filter: 'blur(14px)',
        },
        scoreBoxStyle: {
            background: `linear-gradient(160deg, ${main}, ${deep})`,
            borderColor: accent,
            boxShadow: `inset 0 0 0 1px ${accent}, inset 0 -3px 6px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.25)`,
        },
    };
}
