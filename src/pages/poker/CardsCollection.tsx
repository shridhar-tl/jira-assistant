import { usePokerStore } from '@/stores/poker-store';

import { usePokerActions } from './actions';
import { scoresList } from './constants';

const scoreColorClasses: string[] = [
    'from-emerald-500 to-green-700 border-emerald-400/60',
    'from-emerald-400 to-teal-600 border-emerald-300/60',
    'from-yellow-400 to-amber-600 border-yellow-300/60',
    'from-amber-500 to-orange-600 border-amber-400/60',
    'from-orange-500 to-orange-700 border-orange-400/60',
    'from-red-500 to-rose-700 border-red-400/60',
    'from-red-600 to-red-900 border-red-500/60',
];

function getCardColorClass(index: number, totalNumeric: number): string {
    const ratio = totalNumeric > 1 ? index / (totalNumeric - 1) : 0;
    const colorIndex = Math.min(Math.floor(ratio * scoreColorClasses.length), scoreColorClasses.length - 1);
    return scoreColorClasses[colorIndex];
}

export default function CardsCollection() {
    const { votesMap, sid, currentIssueId, viewingIssueId, maxPoints, scoreType, showHalfScore } = usePokerStore();
    const { submitVote } = usePokerActions();

    const allowVoting = !!(currentIssueId && currentIssueId === viewingIssueId);
    const vote = votesMap[viewingIssueId || ''];
    const revealed = !!vote?.reveal;
    const currentVote = allowVoting && !revealed ? vote?.[sid] : undefined;

    let storypoints = scoresList[scoreType];
    if (!storypoints) {
        return null;
    }

    if (scoreType < 3) {
        storypoints = (storypoints as number[]).filter((p) => p >= 0 && p <= maxPoints && (showHalfScore || p !== 0.5));
    }

    const numericCards = storypoints.map((value, i) => ({ value, colorClass: getCardColorClass(i, storypoints.length) }));

    const disabled = !allowVoting || revealed;

    let hint = '';
    let hintIcon = 'fa fa-hand-pointer-o';
    if (!viewingIssueId) {
        hint = 'Select an issue to view the deck';
        hintIcon = 'fa fa-bookmark-o';
    } else if (revealed) {
        hint = 'Round revealed — waiting for the next round';
        hintIcon = 'fa fa-eye';
    } else if (!allowVoting) {
        hint = 'Waiting for the moderator to start the round';
        hintIcon = 'fa fa-clock-o';
    } else if (currentVote !== undefined) {
        hint = 'Tap a card to change your vote';
    } else {
        hint = 'Choose your estimate';
    }

    return (
        <div className="poker-deck pointer-events-none fixed inset-x-0 bottom-0 z-20">
            <div className="pointer-events-auto relative">
                <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
                <div
                    className={`border-t border-[var(--border-color)] bg-[var(--bg-primary)]/95 px-2 pb-3 pt-4 backdrop-blur-md transition-opacity sm:px-4 sm:pb-4 sm:pt-5 ${
                        disabled ? 'opacity-70' : ''
                    }`}
                >
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:text-xs">
                                <span className={`${hintIcon} text-[var(--primary-color)]`} />
                                {hint}
                            </p>
                            {currentVote !== undefined && allowVoting && !revealed && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                    <span className="fa fa-check-circle" />
                                    Voted: {currentVote}
                                </span>
                            )}
                        </div>

                        <div className="flex items-end gap-1.5 overflow-x-auto pb-2 pt-2 sm:gap-2" style={{ scrollbarWidth: 'thin' }}>
                            <div className="mx-auto flex items-end gap-1.5 px-2 sm:gap-2.5 md:gap-3">
                                {numericCards.map((card, i) => (
                                    <PlayingCard
                                        key={card.value.toString()}
                                        value={card.value}
                                        colorClass={card.colorClass}
                                        selected={currentVote === card.value}
                                        onSelect={submitVote}
                                        index={i}
                                        disabled={disabled}
                                    />
                                ))}

                                <PlayingCard
                                    value="?"
                                    colorClass="from-orange-500 to-rose-700 border-orange-400/60"
                                    selected={currentVote === '?'}
                                    onSelect={submitVote}
                                    icon="fa fa-question"
                                    label="Not sure"
                                    index={numericCards.length}
                                    disabled={disabled}
                                />

                                <PlayingCard
                                    value="~"
                                    colorClass="from-purple-500 to-indigo-700 border-purple-400/60"
                                    selected={currentVote === '~'}
                                    onSelect={submitVote}
                                    icon="fa fa-coffee"
                                    label="Break"
                                    index={numericCards.length + 1}
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PlayingCardProps {
    value: number | string;
    colorClass: string;
    selected: boolean;
    onSelect: (vote: number | string) => void;
    icon?: string;
    label?: string;
    index: number;
    disabled: boolean;
}

function PlayingCard({ value, colorClass, selected, onSelect, icon, label, index, disabled }: PlayingCardProps) {
    const handleClick = () => {
        if (disabled) return;
        onSelect(value);
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            title={label ? `${label} (${value})` : value.toString()}
            style={{ animationDelay: `${index * 30}ms` }}
            className={`group relative h-[72px] w-12 shrink-0 rounded-xl border-2 bg-gradient-to-br p-1 font-black text-white shadow-lg transition-all duration-200 sm:h-[84px] sm:w-14 sm:rounded-2xl md:h-[96px] md:w-16
                ${colorClass}
                ${
                    disabled
                        ? 'cursor-not-allowed opacity-60'
                        : selected
                          ? '-translate-y-3 scale-[1.06] cursor-pointer shadow-2xl ring-4 ring-white/70 ring-offset-2 ring-offset-[var(--bg-primary)] sm:-translate-y-4'
                          : 'cursor-pointer hover:-translate-y-2 hover:scale-105 hover:shadow-xl active:scale-100'
                }
            `}
        >
            <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_60%)] sm:rounded-2xl" />

            {icon ? (
                <div className="relative flex h-full w-full flex-col items-center justify-center gap-0.5">
                    <span className={`${icon} text-xl sm:text-2xl`} />
                    {label && <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">{label}</span>}
                </div>
            ) : (
                <div className="relative flex h-full w-full flex-col items-stretch justify-between">
                    <span className="self-start text-[10px] leading-none sm:text-xs">{value}</span>
                    <span className="self-center text-lg leading-none sm:text-xl md:text-2xl">{value}</span>
                    <span className="self-end rotate-180 text-[10px] leading-none sm:text-xs">{value}</span>
                </div>
            )}

            {selected && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-emerald-600 shadow-md">
                    <span className="fa fa-check" />
                </span>
            )}
        </button>
    );
}
