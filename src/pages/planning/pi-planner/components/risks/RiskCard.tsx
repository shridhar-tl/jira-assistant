import classNames from 'classnames';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

import { Button, Dropdown } from '@components';

import { parseDateKey } from '../../../shared/segments';
import type { IssueLookup } from '../../pi-progress';
import type { RiskEntry } from '../../pi-risk-model';
import type { RoamStatus } from '../../pi-types';
import { lowerTerm, type TermSet } from '../../terminology';
import IssueLink from '../common/IssueLink';
import PersonChip from '../common/PersonChip';

import { acceptanceClassNames, dueBadgeClassNames, roamOrder } from './risk-styles';

interface RiskCardProps {
    entry: RiskEntry;
    terms: TermSet;
    issues: IssueLookup;
    canEdit: boolean;
    onEdit: (entry: RiskEntry) => void;
    onRemove: (entry: RiskEntry) => void;
    onRespond: (entry: RiskEntry) => void;
    onRoamChange: (entry: RiskEntry, roam: RoamStatus) => void;
}

function dueLabel(resolveBy: string, due: RiskEntry['due']): string {
    const days = differenceInCalendarDays(parseDateKey(resolveBy), startOfDay(new Date()));
    if (due === 'overdue') {
        return `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}`;
    }
    if (due === 'dueSoon') {
        return days === 0 ? 'Due today' : `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
    }
    return `By ${resolveBy}`;
}

const acceptanceLabels = { pending: 'Awaiting acceptance', accepted: 'Accepted', declined: 'Declined' } as const;

/** A risk on the ROAM board with the team that raised it, the team it is raised on and whether that team accepted it. */
export default function RiskCard({ entry, terms, issues, canEdit, onEdit, onRemove, onRespond, onRoamChange }: RiskCardProps) {
    const { risk, due } = entry;
    const acceptance = risk.targetTeam ? risk.acceptance?.status || 'pending' : null;
    const canMove = canEdit && (entry.isOwn || (entry.isOnUs && acceptance === 'accepted'));

    return (
        <article
            className={classNames('flex flex-col gap-1.5 rounded-lg border bg-(--bg-primary) p-2.5 text-xs shadow-sm', {
                'border-red-500 ring-1 ring-red-500/40': due === 'overdue',
                'border-amber-400': due === 'dueSoon',
                'border-(--border-primary)': due !== 'overdue' && due !== 'dueSoon',
            })}
            data-risk-id={risk.id}
        >
            <div className="flex items-start gap-1">
                <span className="min-w-0 flex-1 text-sm font-medium">{risk.title}</span>
                {canEdit && entry.isOwn && (
                    <>
                        <Button size="xs" layout="plain" leftIcon={<i className="fa fa-pencil" />} ariaLabel={`Edit ${lowerTerm(terms.risk)}`} title="Edit" onClick={() => onEdit(entry)} />
                        <Button
                            size="xs"
                            layout="plain"
                            variant="danger"
                            leftIcon={<i className="fa fa-trash" />}
                            ariaLabel={`Delete ${lowerTerm(terms.risk)}`}
                            title="Delete"
                            confirmText={risk.dependencyId ? 'Delete this entry? The dependency stays and is no longer raised as a risk.' : 'Delete this entry from the plan?'}
                            onClick={() => onRemove(entry)}
                        />
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-1">
                {risk.resolveBy && due !== 'none' && <span className={classNames('rounded-full px-2 py-0.5 text-[11px] font-semibold', dueBadgeClassNames[due])}>{dueLabel(risk.resolveBy, due)}</span>}
                {acceptance && (
                    <span className={classNames('rounded-full px-2 py-0.5 text-[11px] font-semibold', acceptanceClassNames[acceptance])} title={risk.acceptance?.note || undefined}>
                        {acceptanceLabels[acceptance]}
                    </span>
                )}
                {risk.dependencyId && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        <i className="fa fa-link me-1" />
                        Dependency
                    </span>
                )}
                {!entry.isOwn && <span className="rounded-full bg-(--bg-tertiary) px-2 py-0.5 text-[11px] text-(--text-secondary)">From {entry.piName}</span>}
            </div>

            {risk.description && <p className="whitespace-pre-wrap text-(--text-secondary)">{risk.description}</p>}
            {risk.impact && (
                <p className="whitespace-pre-wrap rounded bg-orange-50 px-2 py-1 text-orange-900 dark:bg-orange-900/20 dark:text-orange-200">
                    <span className="font-semibold">If it happens: </span>
                    {risk.impact}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-1 text-(--text-secondary)">
                <span className="font-medium text-(--text-primary)">{entry.fromTeamName}</span>
                {risk.targetTeam && (
                    <>
                        <i className="fa fa-long-arrow-right" aria-label="raised on" />
                        <span className="font-medium text-(--text-primary)">{risk.targetTeam.name}</span>
                    </>
                )}
                {risk.ownerName && <span>· owner {risk.ownerName}</span>}
            </div>

            {(risk.jiraKey || risk.issueKeys.length > 0) && (
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    {[risk.jiraKey, ...risk.issueKeys].filter((k): k is string => !!k).map((key) => (
                        <IssueLink key={key} issueKey={key} issue={issues[key]} />
                    ))}
                </div>
            )}

            {risk.acceptance?.status === 'declined' && risk.acceptance.note && (
                <p className="rounded bg-red-50 px-2 py-1 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                    <span className="font-semibold">{risk.targetTeam?.name}: </span>
                    {risk.acceptance.note}
                </p>
            )}

            <PersonChip user={risk.raisedBy} prefix="Raised by" />

            {canEdit && (canMove || entry.isOnUs) && (
                <div className="flex items-center gap-1 pt-1">
                    {canMove && (
                        <div className="min-w-0 flex-1">
                            <Dropdown
                                options={roamOrder.map((r) => ({ label: terms.roam[r], value: r }))}
                                value={risk.roam}
                                ariaLabel="ROAM status"
                                onChange={(e) => onRoamChange(entry, e.value as RoamStatus)}
                            />
                        </div>
                    )}
                    {entry.isOnUs && (
                        <Button
                            size="sm"
                            layout={acceptance === 'pending' ? 'default' : 'outlined'}
                            label={acceptance === 'pending' ? 'Accept or decline' : 'Change answer'}
                            onClick={() => onRespond(entry)}
                        />
                    )}
                </div>
            )}
        </article>
    );
}
