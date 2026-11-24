import { useMemo, useState } from 'react';

import classNames from 'classnames';

import { inject } from '@services';

import { Button, SelectButton } from '@components';

import { getJiraErrorMessage } from '../../shared/jira-api';
import type { PlannerUser } from '../../shared/types';
import { syncRiskToJira, updatePlan } from '../pi-actions';
import { respondToRisk } from '../pi-item-actions';
import type { PiData } from '../pi-loader';
import { buildRiskEntries, needsRiskAttention, type RiskEntry } from '../pi-risk-model';
import { usePiStore } from '../pi-store';
import type { PiDocument, PiRisk, RoamStatus } from '../pi-types';
import { lowerTerm, type TermSet } from '../terminology';
import usePlanIssues from '../usePlanIssues';

import ViewToolbar from './common/ViewToolbar';
import { roamHeaderClassNames, roamOrder } from './risks/risk-styles';
import RiskCard from './risks/RiskCard';
import RiskDialog from './risks/RiskDialog';
import RiskResponseDialog from './risks/RiskResponseDialog';

interface RisksViewProps {
    doc: PiDocument;
    data: PiData;
    terms: TermSet;
    canEdit: boolean;
    people: PlannerUser[];
}

type Scope = 'all' | 'ours' | 'onUs' | 'attention';

function matchesScope(entry: RiskEntry, scope: Scope): boolean {
    switch (scope) {
        case 'ours':
            return entry.isOwn;
        case 'onUs':
            return entry.isOnUs;
        case 'attention':
            return needsRiskAttention(entry);
        default:
            return true;
    }
}

/** Risks on a ROAM board: raised by the plan's teams or on them by other plans, with impact, resolve-by dates and acceptance (PI-7). */
export default function RisksView({ doc, data, terms, canEdit, people }: RisksViewProps) {
    const incoming = usePiStore((s) => s.incoming);
    const { issues } = usePlanIssues(doc, data);
    const [editing, setEditing] = useState<PiRisk | 'new' | null>(null);
    const [responding, setResponding] = useState<RiskEntry | null>(null);
    const [scope, setScope] = useState<Scope>('all');

    const entries = useMemo(() => buildRiskEntries(doc, incoming, terms.program), [doc, incoming, terms.program]);
    const visible = entries.filter((e) => matchesScope(e, scope));
    const attention = entries.filter(needsRiskAttention).length;
    const overdue = entries.filter((e) => e.due === 'overdue').length;
    const toAccept = entries.filter((e) => e.isOnUs && e.awaitingAcceptance).length;
    const openCount = entries.filter((e) => e.risk.roam === 'open').length;

    const showError = (err: unknown) => {
        const { $message } = inject('MessageService');
        $message.error(getJiraErrorMessage(err), `Unable to save the ${lowerTerm(terms.risk)}`);
    };

    const changeRoam = async (entry: RiskEntry, roam: RoamStatus) => {
        const { risk } = entry;
        if (!entry.isOwn) {
            await respondToRisk(entry.piId, risk.id, {
                acceptance: risk.acceptance?.status || 'accepted',
                note: risk.acceptance?.note || '',
                roam,
                ownerId: risk.ownerId,
                ownerName: risk.ownerName,
            });
            return;
        }
        try {
            const next = await syncRiskToJira({ ...risk, roam }, terms.roam[roam]);
            await updatePlan({ risks: doc.risks.map((r) => (r.id === risk.id ? next : r)) });
        } catch (err) {
            showError(err);
        }
    };

    const remove = (entry: RiskEntry) => updatePlan({ risks: doc.risks.filter((r) => r.id !== entry.risk.id) });

    const scopeItems = [
        { label: `All (${entries.length})`, value: 'all' },
        { label: 'Raised by us', value: 'ours' },
        { label: `Raised on us${toAccept ? ` (${toAccept} to accept)` : ''}`, value: 'onUs' },
        { label: `Needs attention (${attention})`, value: 'attention' },
    ];

    return (
        <div className="flex flex-col gap-3 p-3">
            <ViewToolbar
                actions={
                    <>
                        <SelectButton items={scopeItems} value={scope} onChange={(e) => setScope(e.value as Scope)} ariaLabel={`Show ${lowerTerm(terms.risks)}`} />
                        {canEdit && <Button size="sm" label={`Raise ${lowerTerm(terms.risk)}`} leftIcon={<i className="fa fa-plus" />} onClick={() => setEditing('new')} />}
                    </>
                }
            >
                <span>{openCount} open</span>
                {overdue > 0 && <span className="font-semibold text-red-600 dark:text-red-400">{overdue} overdue</span>}
                {toAccept > 0 && <span className="font-semibold text-(--primary-color)">{toAccept} waiting for our acceptance</span>}
            </ViewToolbar>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {roamOrder.map((status) => {
                    const column = visible.filter((e) => e.risk.roam === status);
                    return (
                        <section key={status} className={classNames('flex flex-col gap-2 rounded-lg border-t-4 bg-(--bg-secondary) p-2', roamHeaderClassNames[status])} aria-label={terms.roam[status]}>
                            <div className="flex items-center justify-between px-0.5 text-sm font-semibold">
                                {terms.roam[status]}
                                <span className="rounded-full bg-(--bg-primary) px-2 text-xs font-normal text-(--text-secondary)">{column.length}</span>
                            </div>
                            {column.map((entry) => (
                                <RiskCard
                                    key={`${entry.piId}-${entry.risk.id}`}
                                    entry={entry}
                                    terms={terms}
                                    issues={issues}
                                    canEdit={canEdit}
                                    onEdit={(e) => setEditing(e.risk)}
                                    onRemove={remove}
                                    onRespond={setResponding}
                                    onRoamChange={changeRoam}
                                />
                            ))}
                            {!column.length && <span className="px-0.5 py-3 text-center text-xs text-(--text-tertiary)">Nothing here</span>}
                        </section>
                    );
                })}
            </div>

            <table className="exportable hidden" data-export-sheet-name={terms.risks}>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Raised by</th>
                        <th>Raised on</th>
                        <th>Acceptance</th>
                        <th>Resolve by</th>
                        <th>Impact</th>
                        <th>Owner</th>
                        <th>{terms.plan}</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(({ risk, piId, piName, fromTeamName }) => (
                        <tr key={`${piId}-${risk.id}`}>
                            <td>{risk.title}</td>
                            <td>{terms.roam[risk.roam]}</td>
                            <td>{fromTeamName}</td>
                            <td>{risk.targetTeam?.name || ''}</td>
                            <td>{risk.targetTeam ? risk.acceptance?.status || 'pending' : ''}</td>
                            <td>{risk.resolveBy || ''}</td>
                            <td>{risk.impact}</td>
                            <td>{risk.ownerName}</td>
                            <td>{piName}</td>
                            <td>{[risk.jiraKey, ...risk.issueKeys].filter(Boolean).join(', ')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editing && <RiskDialog risk={editing === 'new' ? null : editing} doc={doc} terms={terms} people={people} issues={issues} onHide={() => setEditing(null)} />}
            {responding && <RiskResponseDialog entry={responding} terms={terms} people={people} onHide={() => setResponding(null)} />}
        </div>
    );
}
