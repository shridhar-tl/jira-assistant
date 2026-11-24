import { useState } from 'react';

import classNames from 'classnames';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { Button } from '@components';

import type { DependencyEntry } from '../../pi-dependency-model';
import { getDueState, type DueState, type IssueLookup, type IssueProgress } from '../../pi-progress';
import { lowerTerm, type TermSet } from '../../terminology';
import HealthBadge from '../common/HealthBadge';
import IssueLink from '../common/IssueLink';
import PersonChip from '../common/PersonChip';
import ProgressMeter from '../common/ProgressMeter';
import StatusPill from '../common/StatusPill';

interface DependencyCardProps {
    entry: DependencyEntry;
    terms: TermSet;
    issues: IssueLookup;
    canEdit: boolean;
    onEdit: (entry: DependencyEntry) => void;
    onRemove: (entry: DependencyEntry) => void;
    onRespond: (entry: DependencyEntry) => void;
}

const dueClassNames: Record<DueState, string> = {
    none: 'text-(--text-secondary)',
    ok: 'text-(--text-secondary)',
    dueSoon: 'font-semibold text-amber-700 dark:text-amber-300',
    overdue: 'font-semibold text-red-600 dark:text-red-400',
    closed: 'text-(--text-secondary)',
};

const borderClassNames: Record<DependencyEntry['health'], string> = {
    awaiting: 'border-l-slate-400',
    onTrack: 'border-l-sky-500',
    atRisk: 'border-l-amber-500',
    late: 'border-l-red-500',
    declined: 'border-l-red-500',
    delivered: 'border-l-emerald-500',
};

function IssueList({ title, keys, progress, issues }: { title: string; keys: string[]; progress: IssueProgress; issues: IssueLookup }) {
    return (
        <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-(--text-tertiary)">{title}</span>
            {keys.length ? (
                <>
                    <ProgressMeter progress={progress} health={progress.percent >= 100 ? 'delivered' : 'onTrack'} />
                    <ul className="flex flex-col gap-0.5">
                        {keys.map((key) => (
                            <li key={key} className="flex min-w-0 items-center gap-2 text-xs">
                                <IssueLink issueKey={key} issue={issues[key]} />
                                <span className="min-w-0 flex-1 truncate text-(--text-secondary)">{issues[key]?.summary}</span>
                                {issues[key] && <StatusPill status={issues[key].status} category={issues[key].statusCategory} />}
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <span className="text-xs text-(--text-tertiary)">None tagged</span>
            )}
        </div>
    );
}

/** A team dependency with who needs what from whom and by when, the answer of the delivering team and the progress of both sides. */
export default function DependencyCard({ entry, terms, issues, canEdit, onEdit, onRemove, onRespond }: DependencyCardProps) {
    const [expanded, setExpanded] = useState(false);
    const { dependency, health } = entry;
    const isOpen = health !== 'delivered' && health !== 'declined';
    const due = getDueState(dependency.neededBy, !isOpen);
    const linkCount = dependency.dependantKeys.length + dependency.providerKeys.length;

    return (
        <article
            className={classNames('flex flex-col gap-2 rounded-lg border border-l-4 border-(--border-primary) bg-(--bg-primary) p-3 shadow-sm', borderClassNames[health])}
            data-dependency-id={dependency.id}
        >
            <div className="flex flex-wrap items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{dependency.title}</span>
                        <HealthBadge health={health} />
                        {entry.crossArt && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                Cross-{terms.program === 'ART' ? 'ART' : lowerTerm(terms.program)}
                            </span>
                        )}
                        {entry.riskId && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                <i className="fa fa-exclamation-triangle me-1" />
                                {terms.risk}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="font-medium">{entry.fromTeamName || 'Unknown team'}</span>
                        {entry.fromArtName && entry.crossArt && <span className="text-xs text-(--text-tertiary)">({entry.fromArtName})</span>}
                        <i className="fa fa-long-arrow-right text-(--text-tertiary)" aria-label="needs from" />
                        <span className="font-medium">{dependency.toTeam.name}</span>
                        {entry.toArtName && entry.crossArt && <span className="text-xs text-(--text-tertiary)">({entry.toArtName})</span>}
                        {!entry.isOwn && <span className="text-xs text-(--text-tertiary)">· raised in {entry.piName}</span>}
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                    {canEdit && entry.isProvidedHere && isOpen && (
                        <Button size="sm" label={dependency.status === 'requested' ? 'Answer' : 'Update answer'} leftIcon={<i className="fa fa-reply" />} onClick={() => onRespond(entry)} />
                    )}
                    {canEdit && entry.isProvidedHere && !isOpen && <Button size="sm" layout="outlined" label="Change answer" onClick={() => onRespond(entry)} />}
                    {canEdit && entry.isOwn && (
                        <>
                            <Button size="sm" layout="plain" leftIcon={<i className="fa fa-pencil" />} ariaLabel="Edit dependency" title="Edit" onClick={() => onEdit(entry)} />
                            <Button
                                size="sm"
                                layout="plain"
                                variant="danger"
                                leftIcon={<i className="fa fa-trash" />}
                                ariaLabel="Delete dependency"
                                title="Delete"
                                confirmText={entry.riskId ? `Delete this dependency and the ${lowerTerm(terms.risk)} raised for it?` : 'Delete this dependency?'}
                                onClick={() => onRemove(entry)}
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className={dueClassNames[due]}>
                    <i className="fa fa-calendar me-1" />
                    Needed by {dependency.neededBy || 'not set'}
                    {due === 'overdue' && ' · overdue'}
                    {due === 'dueSoon' && ' · due soon'}
                </span>
                {dependency.committedDate && (
                    <span className={classNames({ 'font-semibold text-amber-700 dark:text-amber-300': !!dependency.neededBy && dependency.committedDate > dependency.neededBy })}>
                        <i className="fa fa-handshake-o me-1" />
                        Committed for {dependency.committedDate}
                    </span>
                )}
                <PersonChip user={dependency.raisedBy} prefix="Raised by" />
                {dependency.respondedBy && dependency.respondedAt && (
                    <span className="text-(--text-secondary)" title={dependency.respondedAt}>
                        Answered by {dependency.respondedBy.displayName} {formatDistanceToNow(parseISO(dependency.respondedAt), { addSuffix: true })}
                    </span>
                )}
            </div>

            {dependency.responseNote && (
                <p className="whitespace-pre-wrap rounded-md bg-(--bg-secondary) px-2 py-1.5 text-xs text-(--text-secondary)">
                    <span className="font-semibold text-(--text-primary)">{dependency.toTeam.name}: </span>
                    {dependency.responseNote}
                </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-(--text-tertiary)">Delivering work</span>
                    {entry.provider.issueCount ? (
                        <ProgressMeter progress={entry.provider} health={health} />
                    ) : (
                        <span className="text-xs text-(--text-tertiary)">{dependency.status === 'requested' ? 'Not answered yet' : 'No stories tagged by the delivering team'}</span>
                    )}
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-(--text-tertiary)">Waiting stories</span>
                    {entry.dependant.issueCount ? (
                        <span className="text-xs">
                            {entry.dependant.issueCount - entry.dependant.doneCount} open of {entry.dependant.issueCount}
                        </span>
                    ) : (
                        <span className="text-xs text-(--text-tertiary)">None tagged</span>
                    )}
                </div>
            </div>

            {(linkCount > 0 || dependency.description) && (
                <Button
                    size="xs"
                    layout="plain"
                    className="self-start"
                    leftIcon={<i className={classNames('fa', expanded ? 'fa-chevron-up' : 'fa-chevron-down')} />}
                    label={expanded ? 'Hide details' : `Details${linkCount ? ` and ${linkCount} ${linkCount === 1 ? 'story' : 'stories'}` : ''}`}
                    onClick={() => setExpanded(!expanded)}
                />
            )}
            {expanded && (
                <div className="flex flex-col gap-3 border-t border-(--border-secondary) pt-2">
                    {dependency.description && <p className="whitespace-pre-wrap text-xs text-(--text-secondary)">{dependency.description}</p>}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <IssueList title={`Waiting in ${entry.fromTeamName || 'the needing team'}`} keys={dependency.dependantKeys} progress={entry.dependant} issues={issues} />
                        <IssueList title={`Delivered by ${dependency.toTeam.name}`} keys={dependency.providerKeys} progress={entry.provider} issues={issues} />
                    </div>
                </div>
            )}
        </article>
    );
}
