import { useCallback, useEffect } from 'react';

import { Dialog } from '@/dialogs';
import { IssuePicker } from '@/jira-controls';
import { usePokerStore } from '@/stores/poker-store';

import { Checkbox, Dropdown } from '@components';

import { usePokerActions } from './actions';
import { maxScores } from './constants';
import type { PokerIssue } from './types';

export default function IssueCollection() {
    const { showConfigs, currentIssueId, viewingIssueId, issues, sid, moderatorId } = usePokerStore();
    const { hideSettings, addNewIssue } = usePokerActions();
    const isModerator = sid === moderatorId;

    const handlePick = useCallback(
        (issue: any) => {
            if (!issue) {
                return;
            }
            addNewIssue(issue);
        },
        [addNewIssue],
    );

    useEffect(() => {
        if (!showConfigs) {
            return;
        }
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                hideSettings();
            }
        };
        document.addEventListener('keydown', escHandler);
        return () => document.removeEventListener('keydown', escHandler);
    }, [showConfigs, hideSettings]);

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
                    showConfigs ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={hideSettings}
                aria-hidden
            />

            <aside
                className={`fixed top-0 bottom-0 right-0 z-50 flex w-full max-w-md flex-col bg-[var(--bg-primary)] shadow-2xl transition-transform duration-300 ease-out sm:w-[420px] ${
                    showConfigs ? 'translate-x-0' : 'translate-x-full'
                }`}
                role="dialog"
                aria-label="Issues and settings"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                            <span className="fa fa-list-ul text-sm" />
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-[var(--text-primary)]">{isModerator ? 'Issues & Settings' : 'Issues'}</h3>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                                {issues.length} {issues.length === 1 ? 'issue' : 'issues'} in this round
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={hideSettings}
                        title="Close"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--text-secondary)] transition-all hover:bg-red-500/10 hover:text-red-500 active:scale-95"
                    >
                        <span className="fa fa-times" />
                    </button>
                </div>

                {isModerator && (
                    <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/40 px-5 py-4">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            <span className="fa fa-plus-circle text-[var(--primary-color)]" />
                            Add an issue
                        </label>
                        <IssuePicker onPick={handlePick} returnObject placeholder="Type issue key or summary…" />
                        <p className="mt-1.5 text-[10px] text-[var(--text-secondary)]">
                            Paste a Jira key like <span className="font-mono text-[var(--text-primary)]">PROJ-123</span> or search by summary.
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    <div className="px-5 py-4">
                        <h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            <span className="fa fa-bookmark-o" />
                            Backlog
                        </h4>

                        {issues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-color)] py-10 text-center">
                                <span className="fa fa-inbox text-3xl text-[var(--text-secondary)] opacity-40" />
                                <p className="text-sm font-medium text-[var(--text-primary)]">No issues yet</p>
                                {isModerator ? (
                                    <p className="text-xs text-[var(--text-secondary)]">Add an issue to start estimating with the team.</p>
                                ) : (
                                    <p className="text-xs text-[var(--text-secondary)]">The moderator hasn't added any issues yet.</p>
                                )}
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {issues.map((issue) => (
                                    <IssueItem
                                        key={issue.id}
                                        issue={issue}
                                        selected={viewingIssueId === issue.id}
                                        estimating={currentIssueId === issue.id}
                                        isModerator={isModerator}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>

                    {isModerator && (
                        <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/40 px-5 py-5">
                            <Settings />
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

function Settings() {
    const { autoReveal, showHalfScore, maxPoints, scoreType } = usePokerStore();
    const { saveSettings } = usePokerActions();

    return (
        <>
            <h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <span className="fa fa-sliders" />
                Round settings
            </h4>
            <div className="flex flex-col gap-4">
                <Checkbox
                    checked={autoReveal}
                    onChange={(e) => saveSettings(e.value, 'autoReveal')}
                    label="Auto-reveal votes when everyone has voted"
                />

                {scoreType < 3 && (
                    <Checkbox
                        checked={showHalfScore}
                        onChange={(e) => saveSettings(e.value, 'showHalfScore')}
                        label="Show 0.5 story-point card"
                    />
                )}

                {scoreType < 3 && (
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Max score shown</label>
                        <Dropdown
                            value={maxPoints}
                            onChange={(e) => saveSettings(e.value, 'maxPoints')}
                            options={maxScores[scoreType as 1 | 2].map((opt) => ({ value: opt.value, label: opt.label }))}
                        />
                    </div>
                )}
            </div>
        </>
    );
}

interface IssueItemProps {
    issue: PokerIssue;
    selected: boolean;
    estimating: boolean;
    isModerator: boolean;
}

function IssueItem({ issue, selected, estimating, isModerator }: IssueItemProps) {
    const { selectIssue, removeIssue } = usePokerActions();

    const handleRemove = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            Dialog.confirmDelete(`Are you sure you want to delete "${issue.key}"?`, 'Delete issue').then(() => removeIssue(issue.id));
        },
        [issue.key, issue.id, removeIssue],
    );

    return (
        <li>
            <div
                onClick={() => selectIssue(issue.id)}
                title={issue.summary}
                className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all ${
                    selected
                        ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5 shadow-md ring-1 ring-[var(--primary-color)]/20'
                        : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--primary-color)]/40 hover:shadow-sm'
                }`}
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)]">
                    {issue.icon ? (
                        <img src={issue.icon} alt="" className="h-5 w-5" />
                    ) : (
                        <span className="fa fa-tag text-[var(--text-secondary)]" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className={`truncate text-sm font-bold ${selected ? 'text-[var(--primary-color)]' : 'text-[var(--text-primary)]'}`}>
                            {issue.key}
                        </span>
                        {estimating && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                <span className="fa fa-clock-o" />
                                Voting
                            </span>
                        )}
                        {selected && !estimating && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-color)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary-color)]">
                                <span className="fa fa-eye" />
                                Viewing
                            </span>
                        )}
                    </div>
                    {issue.summary && <p className="truncate text-xs text-[var(--text-secondary)]">{issue.summary}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {issue.url && (
                        <a
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open in Jira"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-color)]"
                        >
                            <span className="fa fa-external-link text-xs" />
                        </a>
                    )}
                    {isModerator && (
                        <button
                            onClick={handleRemove}
                            title="Remove issue"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                        >
                            <span className="fa fa-trash text-xs" />
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
}
