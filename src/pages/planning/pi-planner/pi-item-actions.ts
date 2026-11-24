import { inject } from '@services';

import { toPlannerUser } from '../shared/issue-mapper';
import { getJiraErrorMessage, type RawJiraUser } from '../shared/jira-api';

import { createItemId, loadIncoming, showError, updatePlan } from './pi-actions';
import { applyDependencyResponse, applyRiskResponse, normalizeRisk } from './pi-items';
import { respondToItem } from './pi-storage';
import { usePiStore } from './pi-store';
import type { PiAcceptance, PiDependencyResponse, PiRisk, PiRiskResponse, PiTeamDependency, PiUserRef } from './pi-types';

export function getCurrentUserRef(): PiUserRef | null {
    const { $session } = inject('SessionService');
    const current = $session.CurrentUser;
    const user = toPlannerUser(current.jiraUser as RawJiraUser | undefined);
    if (user) {
        return { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl };
    }
    const id = current.accountId || current.name;
    return id ? { id, displayName: current.displayName || id } : null;
}

const unansweredDependency: Pick<PiTeamDependency, 'status' | 'committedDate' | 'responseNote' | 'providerKeys' | 'respondedBy' | 'respondedAt'> = {
    status: 'requested',
    committedDate: null,
    responseNote: '',
    providerKeys: [],
    respondedBy: null,
    respondedAt: null,
};

const pendingAcceptance: PiAcceptance = { status: 'pending', by: null, at: null, note: '' };

/** Adds or updates a team dependency raised by a team of the open plan. When it is moved to another team, the answer of the previous team is dropped. */
export function saveTeamDependency(dependency: PiTeamDependency): Promise<boolean> {
    const { doc } = usePiStore.getState();
    if (!doc) {
        return Promise.resolve(false);
    }
    const existing = doc.dependencies.find((d) => d.id === dependency.id);
    const teamChanged = !!existing && existing.toTeam.boardId !== dependency.toTeam.boardId;
    const next = teamChanged ? { ...dependency, ...unansweredDependency } : dependency;
    const dependencies = existing ? doc.dependencies.map((d) => (d.id === next.id ? next : d)) : [...doc.dependencies, next];
    const risks = doc.risks.map((r) =>
        r.dependencyId === next.id
            ? { ...r, title: next.title, targetTeam: next.toTeam, resolveBy: next.neededBy, teamBoardId: next.fromBoardId, acceptance: teamChanged ? pendingAcceptance : r.acceptance }
            : r,
    );
    return updatePlan({ dependencies, risks });
}

export function removeTeamDependency(id: string): Promise<boolean> {
    const { doc } = usePiStore.getState();
    if (!doc) {
        return Promise.resolve(false);
    }
    return updatePlan({ dependencies: doc.dependencies.filter((d) => d.id !== id), risks: doc.risks.filter((r) => r.dependencyId !== id) });
}

/** Raises a dependency as a risk on the ROAM board, or removes that risk again. The risk follows the dependency's teams and date. */
export function setDependencyRisk(dependency: PiTeamDependency, impact: string | null): Promise<boolean> {
    const { doc } = usePiStore.getState();
    if (!doc) {
        return Promise.resolve(false);
    }
    if (impact === null) {
        return updatePlan({ risks: doc.risks.filter((r) => r.dependencyId !== dependency.id) });
    }
    const existing = doc.risks.find((r) => r.dependencyId === dependency.id);
    if (existing) {
        return updatePlan({ risks: doc.risks.map((r) => (r.id === existing.id ? { ...r, impact } : r)) });
    }
    const risk: PiRisk = normalizeRisk({
        id: createItemId('r'),
        title: dependency.title,
        description: dependency.description,
        impact,
        teamBoardId: dependency.fromBoardId,
        targetTeam: dependency.toTeam,
        resolveBy: dependency.neededBy,
        acceptance: pendingAcceptance,
        dependencyId: dependency.id,
        issueKeys: dependency.dependantKeys,
        roam: 'open',
        raisedBy: getCurrentUserRef(),
        raisedAt: new Date().toISOString(),
    });
    return updatePlan({ risks: [...doc.risks, risk] });
}

/** The providing team answers a dependency. Dependencies of another plan are answered in that plan. */
export async function respondToDependency(piId: string, dependencyId: string, response: PiDependencyResponse): Promise<boolean> {
    const { doc } = usePiStore.getState();
    if (!doc) {
        return false;
    }
    if (piId === doc.id) {
        const by = getCurrentUserRef();
        const at = new Date().toISOString();
        return updatePlan({ dependencies: doc.dependencies.map((d) => (d.id === dependencyId ? applyDependencyResponse(d, response, by, at) : d)) });
    }
    try {
        await respondToItem(piId, { kind: 'dependency', itemId: dependencyId, response });
        await loadIncoming();
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to answer the dependency');
        return false;
    }
}

/** The team a risk is raised on accepts or declines it and moves it on the ROAM board. Risks of another plan are changed in that plan. */
export async function respondToRisk(piId: string, riskId: string, response: PiRiskResponse): Promise<boolean> {
    const { doc } = usePiStore.getState();
    if (!doc) {
        return false;
    }
    if (piId === doc.id) {
        const by = getCurrentUserRef();
        const at = new Date().toISOString();
        return updatePlan({ risks: doc.risks.map((r) => (r.id === riskId ? applyRiskResponse(r, response, by, at) : r)) });
    }
    try {
        await respondToItem(piId, { kind: 'risk', itemId: riskId, response });
        await loadIncoming();
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to answer the risk');
        return false;
    }
}
