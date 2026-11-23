import { inject } from '@services';

import { featurePropertyKey } from '../shared/constants';
import {
    createIssueLink,
    deleteIssueProperty,
    getAssigneeFieldValue,
    getJiraErrorMessage,
    moveIssuesToBacklog,
    moveIssuesToSprint,
    searchIssuePages,
    setIssueProperty,
    updateIssueFields,
} from '../shared/jira-api';
import { toDateKey } from '../shared/segments';
import type { FeaturePlacement, StatusCategory } from '../shared/types';

import { loadPiData, type PiData } from './pi-loader';
import { deletePlan, getPlan, listPlans, savePlan, saveProgramSettings } from './pi-storage';
import { usePiStore } from './pi-store';
import type { PiDocument, PiObjective, PiProgramSettings, PiRisk, PiSummary } from './pi-types';

const conflictMessage = 'Someone else changed this plan. The latest version is loaded. Apply your change again.';

function showError(message: string, title = 'Program planner') {
    const { $message } = inject('MessageService');
    $message.error(message, title);
}

export function createPlanId(): string {
    return `pi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createItemId(prefix: string): string {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

let listRequest: Promise<void> | null = null;

export function loadPlans(): Promise<void> {
    if (listRequest) {
        return listRequest;
    }
    usePiStore.setState({ isListLoading: true, listError: null });
    listRequest = listPlans()
        .then(({ plans, settings, canEdit }) => {
            usePiStore.setState({ plans: [...plans].sort((a, b) => b.startDate.localeCompare(a.startDate)), settings, canEdit, isListLoading: false });
        })
        .catch((err) => {
            usePiStore.setState({ isListLoading: false, listError: getJiraErrorMessage(err) });
        })
        .finally(() => {
            listRequest = null;
        });
    return listRequest;
}

async function getSettings(): Promise<PiProgramSettings | null> {
    if (!usePiStore.getState().settings) {
        await loadPlans();
    }
    return usePiStore.getState().settings;
}

function clearOutdatedPlacements(doc: PiDocument, data: PiData) {
    if (!usePiStore.getState().canEdit) {
        return;
    }
    const withStories = new Set(Object.values(data.stories).map((s) => s.epicKey || s.parentKey));
    Object.values(data.features)
        .filter((f) => f.featurePlacement?.piId === doc.id && withStories.has(f.key))
        .forEach((f) => clearFeaturePlacement(f.key));
}

export async function openPlan(id: string | null, force?: boolean): Promise<void> {
    if (!id) {
        usePiStore.setState({ doc: null, data: null, error: null });
        return;
    }
    usePiStore.setState({ isLoading: true, error: null, ...(usePiStore.getState().doc?.id !== id ? { doc: null, data: null } : {}) });
    try {
        const doc = await getPlan(id);
        if (!doc) {
            usePiStore.setState({ isLoading: false, error: 'This plan does not exist any more.' });
            return;
        }
        const settings = await getSettings();
        const data = await loadPiData(doc, settings?.featureIssueTypes || [], force);
        usePiStore.setState({ doc, data, isLoading: false });
        clearOutdatedPlacements(doc, data);
    } catch (err) {
        usePiStore.setState({ isLoading: false, error: getJiraErrorMessage(err) });
    }
}

export async function reloadPlanData(force = true): Promise<void> {
    const { doc } = usePiStore.getState();
    if (doc) {
        await openPlan(doc.id, force);
    }
}

/** Saves the plan document. A newer version saved by someone else is never overwritten. */
export async function savePlanDocument(doc: PiDocument): Promise<boolean> {
    usePiStore.setState({ isSaving: true });
    try {
        const result = await savePlan(doc);
        if (!result.ok) {
            if (result.conflict && result.latest) {
                usePiStore.setState({ doc: result.latest });
                showError(conflictMessage, 'Plan changed');
            }
            return false;
        }
        const saved = result.doc!;
        const { plans, doc: current } = usePiStore.getState();
        usePiStore.setState({
            doc: current?.id === saved.id || !current ? saved : current,
            plans: [...plans.filter((p) => p.id !== saved.id), { id: saved.id, name: saved.name, startDate: saved.startDate, endDate: saved.endDate, boardIds: saved.teams.map((t) => t.boardId), version: saved.version }].sort((a, b) => b.startDate.localeCompare(a.startDate)),
        });
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to save the plan');
        return false;
    } finally {
        usePiStore.setState({ isSaving: false });
    }
}

export function updatePlan(changes: Partial<PiDocument>): Promise<boolean> {
    const { doc } = usePiStore.getState();
    return doc ? savePlanDocument({ ...doc, ...changes }) : Promise.resolve(false);
}

export async function removePlan(id: string, version: number): Promise<boolean> {
    try {
        const result = await deletePlan(id, version);
        if (!result.ok) {
            showError(conflictMessage, 'Plan changed');
            await loadPlans();
            return false;
        }
        usePiStore.setState(({ plans, doc }) => ({ plans: plans.filter((p) => p.id !== id), ...(doc?.id === id ? { doc: null, data: null } : {}) }));
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to delete the plan');
        return false;
    }
}

export async function saveSettings(settings: PiProgramSettings): Promise<boolean> {
    try {
        const result = await saveProgramSettings(settings);
        if (!result.ok) {
            if (result.latest) {
                usePiStore.setState({ settings: result.latest as PiProgramSettings });
            }
            showError('The program settings were changed by someone else. The latest settings are loaded.', 'Settings changed');
            return false;
        }
        const previous = usePiStore.getState().settings;
        usePiStore.setState({ settings: result.settings! });
        if (JSON.stringify(previous?.featureIssueTypes) !== JSON.stringify(result.settings!.featureIssueTypes)) {
            await reloadPlanData(false);
        }
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to save the settings');
        return false;
    }
}

/** Moves the chosen child stories of a feature into the team's sprint (or the backlog) with one bulk request per target. */
export async function moveFeatureStories(storyKeys: string[], sprintId: number | null): Promise<boolean> {
    if (!storyKeys.length) {
        return true;
    }
    try {
        if (sprintId) {
            await moveIssuesToSprint(sprintId, storyKeys);
        } else {
            await moveIssuesToBacklog(storyKeys);
        }
        await reloadPlanData(false);
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to move the stories');
        await reloadPlanData(false);
        return false;
    }
}

/** Plans a feature that has no stories yet: the placement and rough estimate are stored on the feature (PI-2). */
export async function placeFeature(featureKey: string, boardId: number, sprintId: number | null, estimate: number | null): Promise<boolean> {
    const { doc, data } = usePiStore.getState();
    if (!doc || !data) {
        return false;
    }
    const placement: FeaturePlacement = { v: 1, boardId, sprintId, piId: doc.id, estimate };
    try {
        await setIssueProperty(featureKey, featurePropertyKey, placement);
        const feature = data.features[featureKey];
        if (feature) {
            usePiStore.setState({ data: { ...data, features: { ...data.features, [featureKey]: { ...feature, featurePlacement: placement } } } });
        }
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to plan the feature');
        return false;
    }
}

export async function clearFeaturePlacement(featureKey: string): Promise<void> {
    const { data } = usePiStore.getState();
    try {
        await deleteIssueProperty(featureKey, featurePropertyKey);
        const feature = data?.features[featureKey];
        if (data && feature) {
            usePiStore.setState({ data: { ...data, features: { ...data.features, [featureKey]: { ...feature, featurePlacement: null } } } });
        }
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to remove the placement');
    }
}

function getTeamProjectKey(boardId: number | null): string | null {
    const { data, doc } = usePiStore.getState();
    const teamBoardId = boardId ?? doc?.teams[0]?.boardId;
    const team = teamBoardId ? data?.teams[teamBoardId] : undefined;
    return team?.config.projectKey || team?.board.projectKey || null;
}

/** Objectives stored as Jira issues: creates or updates the issue and keeps its key in the plan. */
export async function syncObjectiveToJira(objective: PiObjective): Promise<PiObjective> {
    const { settings } = usePiStore.getState();
    const storage = settings?.objectiveStorage;
    if (!storage || storage.mode !== 'jira' || !storage.issueTypeId) {
        return objective;
    }
    const fields: Record<string, unknown> = { summary: objective.text };
    if (storage.plannedValueField) {
        fields[storage.plannedValueField] = objective.plannedValue;
    }
    if (storage.actualValueField) {
        fields[storage.actualValueField] = objective.actualValue;
    }
    if (objective.jiraKey) {
        await updateIssueFields(objective.jiraKey, fields);
        return objective;
    }
    const projectKey = getTeamProjectKey(objective.teamBoardId);
    if (!projectKey) {
        return objective;
    }
    const { $jira } = inject('JiraService');
    const created = (await $jira.createIssue({ ...fields, project: { key: projectKey }, issuetype: { id: storage.issueTypeId } })) as { key: string };
    return { ...objective, jiraKey: created.key };
}

/** Risks stored as Jira issues: creates or updates the issue (ROAM status in the chosen field) and keeps its key in the plan. */
export async function syncRiskToJira(risk: PiRisk, roamLabel: string): Promise<PiRisk> {
    const { settings } = usePiStore.getState();
    const storage = settings?.riskStorage;
    if (!storage || storage.mode !== 'jira' || !storage.issueTypeId) {
        return risk;
    }
    const fields: Record<string, unknown> = { summary: risk.title, description: risk.description || undefined };
    if (storage.roamField) {
        fields[storage.roamField] = { value: roamLabel };
    }
    if (risk.ownerId) {
        fields.assignee = getAssigneeFieldValue(risk.ownerId);
    }
    if (risk.jiraKey) {
        await updateIssueFields(risk.jiraKey, fields);
        return risk;
    }
    const projectKey = getTeamProjectKey(risk.teamBoardId);
    if (!projectKey) {
        return risk;
    }
    const { $jira } = inject('JiraService');
    const created = (await $jira.createIssue({ ...fields, project: { key: projectKey }, issuetype: { id: storage.issueTypeId } })) as { key: string };
    return { ...risk, jiraKey: created.key };
}

export async function addDependency(blockerKey: string, dependantKey: string): Promise<boolean> {
    const linkType = (await getSettings())?.dependencyLinkTypes[0];
    if (!linkType) {
        return false;
    }
    const [inwardKey, outwardKey] = linkType.outwardBlocks ? [blockerKey, dependantKey] : [dependantKey, blockerKey];
    try {
        await createIssueLink(linkType.name, inwardKey, outwardKey);
        await reloadPlanData(false);
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to add the dependency');
        return false;
    }
}

export interface ExternalSprint {
    id: number;
    name: string;
    boardId: number | null;
    start: Date | null;
    end: Date | null;
}

export interface ExternalIssue {
    key: string;
    summary: string;
    statusCategory: StatusCategory;
    sprint: ExternalSprint | null;
    planName: string | null;
}

interface RawExternalSprint {
    id: number;
    name: string;
    state?: string;
    boardId?: number;
    startDate?: string;
    endDate?: string;
}

const maxExternalKeys = 100;

function toDate(value?: string): Date | null {
    return value ? new Date(value) : null;
}

function pickSprint(value: unknown): ExternalSprint | null {
    const sprints = Array.isArray(value) ? (value as RawExternalSprint[]).filter((s) => s && typeof s === 'object' && s.id) : [];
    const sprint = sprints.find((s) => s.state === 'active') || sprints.find((s) => s.state === 'future') || sprints[sprints.length - 1];
    return sprint ? { id: sprint.id, name: sprint.name, boardId: sprint.boardId ?? null, start: toDate(sprint.startDate), end: toDate(sprint.endDate) } : null;
}

function findPlan(plans: PiSummary[], currentId: string, sprint: ExternalSprint | null): string | null {
    const boardId = sprint?.boardId;
    if (!boardId) {
        return null;
    }
    const sprintDate = sprint.start || sprint.end;
    const day = sprintDate ? toDateKey(sprintDate) : undefined;
    const plan = plans.find((p) => p.id !== currentId && p.boardIds.includes(boardId) && (!day || (day >= p.startDate && day <= p.endDate)));
    return plan?.name || null;
}

export async function loadExternalIssues(keys: string[]): Promise<Record<string, ExternalIssue>> {
    const { data, doc, plans } = usePiStore.getState();
    const sprintField = data?.fieldIds.sprint;
    const unique = [...new Set(keys)].slice(0, maxExternalKeys);
    if (!data || !doc || !unique.length) {
        return {};
    }
    const { issues } = await searchIssuePages(`key in (${unique.join(',')})`, ['summary', 'status', ...(sprintField ? [sprintField] : [])], { pageSize: unique.length });
    const result: Record<string, ExternalIssue> = {};
    for (const issue of issues) {
        const status = issue.fields.status as { statusCategory?: { key?: string } } | undefined;
        const category = status?.statusCategory?.key;
        const sprint = sprintField ? pickSprint(issue.fields[sprintField]) : null;
        result[issue.key] = {
            key: issue.key,
            summary: (issue.fields.summary as string) || '',
            statusCategory: category === 'done' ? 'done' : category === 'indeterminate' ? 'indeterminate' : 'new',
            sprint,
            planName: findPlan(plans, doc.id, sprint),
        };
    }
    return result;
}
