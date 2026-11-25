import { asUser, route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';
import type Resolver from '@forge/resolver';

import { defineResolver, rejectWith, ResolverError } from '../../../common/resolver-result';
import { applyDependencyResponse, applyRiskResponse, isValidItemResponse, normalizeDocument, normalizeSummary, rangesOverlap, toPlanSummary } from '../pi-planner/pi-items';
import type { PiArt, PiDocument, PiIncomingResult, PiItemResponse, PiListResult, PiProgramSettings, PiSummary, PiUserRef } from '../pi-planner/pi-types';

import { getVisibleBoards } from './board-access';
import {
    answerNotAllowedMessage,
    applyAttribution,
    boardsOfDocument,
    boardsOfSummary,
    ensureAllVisible,
    isVisiblePlan,
    mergeHiddenParts,
    noAccessToBoardMessage,
    redactArt,
    redactDocument,
    redactSummary,
    restrictedTeamName,
} from './pi-access';
import { piIdPattern, validateArt, validateDocument, validateSettings } from './pi-validation';
import { deleteVersioned, type Transaction, writeVersioned } from './version-guard';

interface CallContext {
    accountId?: string;
}

interface SavePayload {
    doc: unknown;
}

interface DeletePayload {
    id: string;
    version: number;
}

interface RespondPayload {
    piId: string;
    response: PiItemResponse;
}

interface RawMyself {
    accountId?: string;
    displayName?: string;
    avatarUrls?: Record<string, string>;
    groups?: { items?: { groupId?: string; name?: string }[] };
}

const summaryKeyPrefix = 'pi-sum-';
const artKeyPrefix = 'pi-art-';
const listPageSize = 100;
const maxListPages = 20;
const settingsKey = 'pi-settings';
const docKeyPrefix = 'pi-doc-';
const maxDocSize = 230000;
const maxIncomingPlans = 20;
const respondAttempts = 3;
const otherPlanName = 'Another plan';
const deleteHiddenMessage = 'This plan has teams whose boards you cannot see, so only someone who can see all of them can delete it.';
const deleteArtHiddenMessage = 'This program has teams whose boards you cannot see, so only someone who can see all of them can delete it.';

const defaultSettings: PiProgramSettings = {
    version: 0,
    terminology: 'neutral',
    cadence: 'aligned',
    ipSprint: true,
    objectiveStorage: { mode: 'ja', issueTypeId: null, plannedValueField: null, actualValueField: null },
    riskStorage: { mode: 'ja', issueTypeId: null, roamField: null },
    editors: { restricted: false, accountIds: [], groupIds: [] },
    featureIssueTypes: [],
    dependencyLinkTypes: [{ name: 'Blocks', outwardBlocks: true }],
};

function isPiId(value: unknown): value is string {
    return typeof value === 'string' && piIdPattern.test(value);
}

function isVersion(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

async function getSettings(): Promise<PiProgramSettings> {
    const stored = (await kvs.get(settingsKey)) as PiProgramSettings | undefined;
    return { ...defaultSettings, ...(stored || {}) };
}

async function getMyself(expandGroups: boolean): Promise<RawMyself | null> {
    const response = expandGroups
        ? await asUser().requestJira(route`/rest/api/3/myself?expand=groups`, { headers: { Accept: 'application/json' } })
        : await asUser().requestJira(route`/rest/api/3/myself`, { headers: { Accept: 'application/json' } });
    return response.ok ? ((await response.json()) as RawMyself) : null;
}

async function getCaller(context: CallContext): Promise<PiUserRef | null> {
    if (!context.accountId) {
        return null;
    }
    const me = await getMyself(false);
    return {
        id: context.accountId,
        displayName: me?.displayName || context.accountId,
        avatarUrl: me?.avatarUrls?.['48x48'] || me?.avatarUrls?.['32x32'] || me?.avatarUrls?.['24x24'],
    };
}

async function canEdit(accountId: string | undefined, settings: PiProgramSettings): Promise<boolean> {
    if (!accountId) {
        return false;
    }
    const editors = settings.editors;
    if (!editors || editors.restricted !== true) {
        return true;
    }
    const accountIds = strings(editors.accountIds);
    const groupIds = strings(editors.groupIds);
    if (accountIds.includes(accountId)) {
        return true;
    }
    if (!groupIds.length) {
        return false;
    }
    const me = await getMyself(true);
    const groups = me?.groups?.items || [];
    return groups.some((g) => groupIds.includes(g.groupId || '') || groupIds.includes(g.name || ''));
}

async function ensureEditor(context: CallContext) {
    const settings = await getSettings();
    if (!(await canEdit(context.accountId, settings))) {
        return rejectWith(403, 'You are not allowed to change program plans. Ask an editor listed in the plan settings.');
    }
    return settings;
}

async function readByPrefix<T>(prefix: string): Promise<T[]> {
    const values: T[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < maxListPages; page++) {
        let query = kvs.query().where('key', WhereConditions.beginsWith(prefix)).limit(listPageSize);
        if (cursor) {
            query = query.cursor(cursor);
        }
        const result = await query.getMany<T>();
        values.push(...result.results.map((r) => r.value));
        cursor = result.nextCursor;
        if (!cursor) {
            break;
        }
    }
    return values;
}

async function readSummaries(): Promise<PiSummary[]> {
    return (await readByPrefix<PiSummary>(summaryKeyPrefix)).map(normalizeSummary);
}

async function readDocument(id: string): Promise<PiDocument | null> {
    const stored = (await kvs.get(docKeyPrefix + id)) as PiDocument | undefined;
    return stored ? normalizeDocument(stored) : null;
}

async function writeDocument(doc: PiDocument, readVersion: number | null): Promise<boolean> {
    if (JSON.stringify(doc).length > maxDocSize) {
        return rejectWith(413, 'The plan is too large to be saved.');
    }
    return writeVersioned(docKeyPrefix + doc.id, readVersion, doc.version, (transaction) =>
        transaction.set(docKeyPrefix + doc.id, doc).set(summaryKeyPrefix + doc.id, toPlanSummary(doc)),
    );
}

async function planConflict(id: string, context: CallContext) {
    const latest = await readDocument(id);
    if (!latest) {
        return rejectWith(404, 'This plan does not exist any more.');
    }
    const visible = await getVisibleBoards(context.accountId, boardsOfDocument(latest));
    if (!isVisiblePlan(teamBoards(latest.teams), visible)) {
        return rejectWith(404, 'This plan does not exist any more.');
    }
    return { ok: false, conflict: true, latest: redactDocument(latest, visible) };
}

async function artConflict(id: string, context: CallContext) {
    const latest = (await kvs.get(artKeyPrefix + id)) as PiArt | undefined;
    if (!latest) {
        return rejectWith(404, 'This program does not exist any more.');
    }
    const visible = await getVisibleBoards(context.accountId, teamBoards(latest.teams));
    if (!isVisiblePlan(teamBoards(latest.teams), visible)) {
        return rejectWith(404, 'This program does not exist any more.');
    }
    return { ok: false, conflict: true, latest: redactArt(latest, visible) };
}

const teamBoards = (teams: { boardId: number }[] | undefined) => (teams || []).map((t) => t.boardId);

async function listPlans(context: CallContext): Promise<PiListResult> {
    const settings = await getSettings();
    const [canEditPlans, summaries, storedArts] = await Promise.all([canEdit(context.accountId, settings), readSummaries(), readByPrefix<PiArt>(artKeyPrefix)]);
    const visible = await getVisibleBoards(context.accountId, [...summaries.flatMap(boardsOfSummary), ...storedArts.flatMap((a) => teamBoards(a.teams))]);
    const plans = summaries.filter((s) => isVisiblePlan(s.boardIds, visible));
    const arts = storedArts.filter((a) => isVisiblePlan(teamBoards(a.teams), visible));
    return {
        arts: arts.map((a) => redactArt(a, visible)),
        plans: plans.map((s) => redactSummary(s, visible)),
        settings,
        canEdit: canEditPlans,
        hiddenPlans: summaries.length - plans.length,
        hiddenArts: storedArts.length - arts.length,
    };
}

async function getPlan(payload: { id?: unknown }, context: CallContext) {
    if (!isPiId(payload?.id)) {
        return rejectWith(400, 'Invalid plan');
    }
    const doc = await readDocument(payload.id);
    if (!doc) {
        return { doc: null };
    }
    const visible = await getVisibleBoards(context.accountId, boardsOfDocument(doc));
    return { doc: isVisiblePlan(teamBoards(doc.teams), visible) ? redactDocument(doc, visible) : null };
}

async function savePi(payload: SavePayload, context: CallContext) {
    const incoming = validateDocument(payload?.doc);
    await ensureEditor(context);

    const existing = await readDocument(incoming.id);
    const visible = await getVisibleBoards(context.accountId, [...boardsOfDocument(incoming), ...(existing ? boardsOfDocument(existing) : [])]);
    if (existing && !isVisiblePlan(teamBoards(existing.teams), visible)) {
        return rejectWith(404, 'This plan does not exist any more.');
    }
    if (existing && existing.version !== incoming.version) {
        return { ok: false, conflict: true, latest: redactDocument(existing, visible) };
    }

    const caller = await getCaller(context);
    const now = new Date().toISOString();
    const merged = applyAttribution(mergeHiddenParts(incoming, existing, visible), existing, caller, now, visible);
    const toSave: PiDocument = {
        ...merged,
        version: (existing?.version || 0) + 1,
        created: existing?.created || now,
        createdBy: existing ? existing.createdBy : caller,
        updated: now,
        updatedBy: context.accountId || '',
        updatedByUser: caller,
    };
    if (!(await writeDocument(toSave, existing ? existing.version : null))) {
        return planConflict(incoming.id, context);
    }
    return { ok: true, doc: redactDocument(toSave, visible) };
}

async function deletePi(payload: DeletePayload, context: CallContext) {
    if (!isPiId(payload?.id) || !isVersion(payload.version)) {
        return rejectWith(400, 'Invalid plan');
    }
    await ensureEditor(context);

    const { id } = payload;
    const remove = (transaction: Transaction) => transaction.delete(docKeyPrefix + id).delete(summaryKeyPrefix + id);
    const existing = await readDocument(id);
    if (!existing) {
        await remove(kvs.transact()).execute();
        return { ok: true };
    }
    const visible = await getVisibleBoards(context.accountId, boardsOfDocument(existing));
    await ensureAllVisible(teamBoards(existing.teams), visible, deleteHiddenMessage);
    if (existing.version !== payload.version) {
        return { ok: false, conflict: true, latest: redactDocument(existing, visible) };
    }
    return (await deleteVersioned(docKeyPrefix + id, existing.version, remove)) ? { ok: true } : planConflict(id, context);
}

async function saveArt(payload: { art: unknown }, context: CallContext) {
    const art = validateArt(payload?.art);
    await ensureEditor(context);

    const key = artKeyPrefix + art.id;
    const existing = (await kvs.get(key)) as PiArt | undefined;
    const visible = await getVisibleBoards(context.accountId, [...teamBoards(art.teams), ...teamBoards(existing?.teams)]);
    if (existing && !isVisiblePlan(teamBoards(existing.teams), visible)) {
        return rejectWith(404, 'This program does not exist any more.');
    }
    if (existing && existing.version !== art.version) {
        return { ok: false, conflict: true, latest: redactArt(existing, visible) };
    }
    const storedTeams = new Map((existing?.teams || []).map((t) => [t.boardId, t]));
    const teams = art.teams.map((t) => {
        if (visible.has(t.boardId)) {
            return t;
        }
        const stored = storedTeams.get(t.boardId);
        if (!stored) {
            throw new ResolverError(403, noAccessToBoardMessage);
        }
        return { boardId: stored.boardId, name: stored.name };
    });
    const kept = new Set(teamBoards(teams));
    teams.push(...(existing?.teams || []).filter((t) => !visible.has(t.boardId) && !kept.has(t.boardId)));

    const caller = await getCaller(context);
    const now = new Date().toISOString();
    const toSave: PiArt = {
        id: art.id,
        name: art.name,
        description: art.description,
        teams,
        version: (existing?.version || 0) + 1,
        created: existing?.created || now,
        createdBy: existing ? existing.createdBy : caller,
        updated: now,
        updatedBy: caller,
    };
    if (!(await writeVersioned(key, existing ? existing.version : null, toSave.version, (transaction) => transaction.set(key, toSave)))) {
        return artConflict(art.id, context);
    }
    return { ok: true, art: redactArt(toSave, visible) };
}

async function deleteArt(payload: DeletePayload, context: CallContext) {
    if (!isPiId(payload?.id) || !isVersion(payload.version)) {
        return rejectWith(400, 'Invalid ART');
    }
    await ensureEditor(context);

    const { id } = payload;
    const key = artKeyPrefix + id;
    const existing = (await kvs.get(key)) as PiArt | undefined;
    if (existing) {
        const visible = await getVisibleBoards(context.accountId, teamBoards(existing.teams));
        await ensureAllVisible(teamBoards(existing.teams), visible, deleteArtHiddenMessage);
        if (existing.version !== payload.version) {
            return { ok: false, conflict: true, latest: redactArt(existing, visible) };
        }
    }
    if ((await readSummaries()).some((s) => s.artId === id)) {
        return rejectWith(409, 'This ART still has plans. Delete them or move them to another ART first.');
    }
    if (!existing) {
        await kvs.delete(key);
        return { ok: true };
    }
    return (await deleteVersioned(key, existing.version, (transaction) => transaction.delete(key))) ? { ok: true } : artConflict(id, context);
}

/** Dependencies and risks raised in other plans on the teams of this plan, e.g. by a team of another ART. */
async function getIncoming(payload: { id?: unknown }, context: CallContext): Promise<PiIncomingResult> {
    if (!isPiId(payload?.id)) {
        return rejectWith(400, 'Invalid plan');
    }
    const doc = await readDocument(payload.id);
    if (!doc) {
        return { dependencies: [], risks: [] };
    }
    const summaries = (await readSummaries()).filter((s) => s.id !== doc.id && rangesOverlap(s.startDate, s.endDate, doc.startDate, doc.endDate));
    const visible = await getVisibleBoards(context.accountId, [...teamBoards(doc.teams), ...summaries.flatMap(boardsOfSummary)]);
    const boardIds = new Set(teamBoards(doc.teams).filter((id) => visible.has(id)));
    const candidates = summaries.filter((s) => s.externalBoardIds.some((id) => boardIds.has(id))).slice(0, maxIncomingPlans);
    const sources = (await Promise.all(candidates.map((s) => readDocument(s.id)))).filter((d): d is PiDocument => !!d);

    const result: PiIncomingResult = { dependencies: [], risks: [] };
    for (const source of sources) {
        const sourceVisible = isVisiblePlan(teamBoards(source.teams), visible);
        const piName = sourceVisible ? source.name : otherPlanName;
        const teamName = (boardId: number | null) => (boardId !== null && !visible.has(boardId) ? restrictedTeamName : source.teams.find((t) => t.boardId === boardId)?.name || piName);
        const base = { piId: source.id, piName, artId: source.artId };
        source.dependencies
            .filter((d) => boardIds.has(d.toTeam.boardId))
            .forEach((item) => result.dependencies.push({ ...base, fromBoardName: teamName(item.fromBoardId), item }));
        source.risks
            .filter((r) => r.targetTeam && boardIds.has(r.targetTeam.boardId))
            .forEach((item) => result.risks.push({ ...base, fromBoardName: teamName(item.teamBoardId), item }));
    }
    return result;
}

function answeringBoard(doc: PiDocument, response: PiItemResponse): number | null | undefined {
    if (response.kind === 'dependency') {
        return doc.dependencies.find((d) => d.id === response.itemId)?.toTeam.boardId;
    }
    const risk = doc.risks.find((r) => r.id === response.itemId);
    return risk?.targetTeam?.boardId ?? risk?.teamBoardId;
}

/** The team a dependency or risk is raised on answers it. Only the answer fields are changed in the plan that owns the item. */
async function respond(payload: RespondPayload, context: CallContext) {
    if (!payload || !isPiId(payload.piId) || !isValidItemResponse(payload.response)) {
        return rejectWith(400, 'Invalid response');
    }
    await ensureEditor(context);

    const caller = await getCaller(context);
    for (let attempt = 1; attempt <= respondAttempts; attempt++) {
        const doc = await readDocument(payload.piId);
        if (!doc) {
            return rejectWith(404, 'The plan of this item does not exist any more.');
        }
        if (await writeDocument(await answeredDocument(doc, payload.response, context, caller), doc.version)) {
            return { ok: true };
        }
    }
    return rejectWith(409, 'The plan is being changed by someone else. Please try again.');
}

async function answeredDocument(doc: PiDocument, response: PiItemResponse, context: CallContext, caller: PiUserRef | null): Promise<PiDocument> {
    const boardId = answeringBoard(doc, response);
    const visible = await getVisibleBoards(context.accountId, typeof boardId === 'number' ? [boardId] : teamBoards(doc.teams));
    if (typeof boardId === 'number' ? !visible.has(boardId) : !isVisiblePlan(teamBoards(doc.teams), visible)) {
        return rejectWith(403, answerNotAllowedMessage);
    }
    const now = new Date().toISOString();
    let next: PiDocument;
    if (response.kind === 'dependency') {
        if (!doc.dependencies.some((d) => d.id === response.itemId)) {
            return rejectWith(404, 'This dependency does not exist any more.');
        }
        next = { ...doc, dependencies: doc.dependencies.map((d) => (d.id === response.itemId ? applyDependencyResponse(d, response.response, caller, now) : d)) };
    } else {
        if (!doc.risks.some((r) => r.id === response.itemId)) {
            return rejectWith(404, 'This risk does not exist any more.');
        }
        next = { ...doc, risks: doc.risks.map((r) => (r.id === response.itemId ? applyRiskResponse(r, response.response, caller, now) : r)) };
    }
    return { ...next, version: doc.version + 1, updated: now, updatedBy: context.accountId || '', updatedByUser: caller };
}

async function saveSettings(payload: { settings: unknown }, context: CallContext) {
    const settings = validateSettings(payload?.settings);
    const current = await ensureEditor(context);
    if (current.version !== settings.version) {
        return { ok: false, conflict: true, latest: current };
    }
    const toSave: PiProgramSettings = { ...settings, version: current.version + 1 };
    if (toSave.editors.restricted && context.accountId && !toSave.editors.accountIds.includes(context.accountId) && !toSave.editors.groupIds.length) {
        // Prevent the editor from locking everyone out
        const caller = await getCaller(context);
        toSave.editors = {
            ...toSave.editors,
            accountIds: [...toSave.editors.accountIds, context.accountId],
            names: { ...toSave.editors.names, [context.accountId]: caller?.displayName || context.accountId },
        };
    }
    if (!(await writeVersioned(settingsKey, current.version, toSave.version, (transaction) => transaction.set(settingsKey, toSave)))) {
        return { ok: false, conflict: true, latest: await getSettings() };
    }
    return { ok: true, settings: toSave };
}

export function registerPiResolvers(resolver: Resolver) {
    const contextOf = (req: { context: unknown }) => req.context as CallContext;
    defineResolver(resolver, 'PiList', (req) => listPlans(contextOf(req)));
    defineResolver(resolver, 'PiGet', (req) => getPlan(req.payload as { id?: unknown }, contextOf(req)));
    defineResolver(resolver, 'PiSave', (req) => savePi(req.payload as unknown as SavePayload, contextOf(req)));
    defineResolver(resolver, 'PiDelete', (req) => deletePi(req.payload as unknown as DeletePayload, contextOf(req)));
    defineResolver(resolver, 'PiArtSave', (req) => saveArt(req.payload as { art: unknown }, contextOf(req)));
    defineResolver(resolver, 'PiArtDelete', (req) => deleteArt(req.payload as unknown as DeletePayload, contextOf(req)));
    defineResolver(resolver, 'PiIncoming', (req) => getIncoming(req.payload as { id?: unknown }, contextOf(req)));
    defineResolver(resolver, 'PiRespond', (req) => respond(req.payload as unknown as RespondPayload, contextOf(req)));
    defineResolver(resolver, 'PiSettingsSave', (req) => saveSettings(req.payload as { settings: unknown }, contextOf(req)));
}
