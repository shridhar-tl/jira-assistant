import { asUser, route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';
import type Resolver from '@forge/resolver';

import { applyDependencyResponse, applyRiskResponse, isValidItemResponse, normalizeDocument, normalizeSummary, rangesOverlap, toPlanSummary } from '../pi-planner/pi-items';
import type { PiArt, PiDocument, PiIncomingResult, PiItemResponse, PiProgramSettings, PiSummary, PiTeamRef, PiUserRef } from '../pi-planner/pi-types';

interface CallContext {
    accountId?: string;
}

interface SavePayload {
    doc: PiDocument;
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
const maxArtTeams = 100;
const maxIncomingPlans = 20;
const idPattern = /^[a-z0-9-]{4,40}$/;

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

function isValidTeamRef(team: PiTeamRef): boolean {
    return !!team && Number.isInteger(team.boardId) && team.boardId > 0 && typeof team.name === 'string' && !!team.name.trim();
}

function reject(status: number, message: string) {
    return Promise.reject({ status, statusText: message, text: message });
}

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
    if (!settings.editors.restricted) {
        return true;
    }
    if (settings.editors.accountIds.includes(accountId)) {
        return true;
    }
    if (!settings.editors.groupIds.length) {
        return false;
    }
    const me = await getMyself(true);
    const groups = me?.groups?.items || [];
    return groups.some((g) => settings.editors.groupIds.includes(g.groupId || '') || settings.editors.groupIds.includes(g.name || ''));
}

async function ensureEditor(context: CallContext) {
    const settings = await getSettings();
    if (!(await canEdit(context.accountId, settings))) {
        return reject(403, 'You are not allowed to change program plans. Ask an editor listed in the plan settings.');
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

async function writeDocument(doc: PiDocument) {
    if (JSON.stringify(doc).length > maxDocSize) {
        return reject(413, 'The plan is too large to be saved.');
    }
    await kvs.transact().set(docKeyPrefix + doc.id, doc).set(summaryKeyPrefix + doc.id, toPlanSummary(doc)).execute();
    return doc;
}

async function savePi(payload: SavePayload, context: CallContext) {
    const doc = payload?.doc ? normalizeDocument(payload.doc) : null;
    if (!doc || !idPattern.test(doc.id) || !doc.name?.trim() || (doc.artId !== null && !idPattern.test(doc.artId))) {
        return reject(400, 'Invalid plan');
    }
    await ensureEditor(context);

    const existing = await readDocument(doc.id);
    if (existing && existing.version !== doc.version) {
        return { ok: false, conflict: true, latest: existing };
    }

    const caller = await getCaller(context);
    const now = new Date().toISOString();
    const toSave: PiDocument = {
        ...doc,
        version: (existing?.version || 0) + 1,
        created: existing?.created || now,
        createdBy: existing ? existing.createdBy : caller,
        updated: now,
        updatedBy: context.accountId || '',
        updatedByUser: caller,
    };
    await writeDocument(toSave);
    return { ok: true, doc: toSave };
}

async function deletePi(payload: DeletePayload, context: CallContext) {
    if (!payload || !idPattern.test(payload.id)) {
        return reject(400, 'Invalid plan');
    }
    await ensureEditor(context);

    const key = docKeyPrefix + payload.id;
    const existing = await readDocument(payload.id);
    if (existing && existing.version !== payload.version) {
        return { ok: false, conflict: true, latest: existing };
    }
    await kvs.transact().delete(key).delete(summaryKeyPrefix + payload.id).execute();
    return { ok: true };
}

async function saveArt(payload: { art: PiArt }, context: CallContext) {
    const art = payload?.art;
    if (!art || !idPattern.test(art.id) || !art.name?.trim() || !Array.isArray(art.teams) || art.teams.length > maxArtTeams || !art.teams.every(isValidTeamRef)) {
        return reject(400, 'Invalid ART');
    }
    await ensureEditor(context);

    const key = artKeyPrefix + art.id;
    const existing = (await kvs.get(key)) as PiArt | undefined;
    if (existing && existing.version !== art.version) {
        return { ok: false, conflict: true, latest: existing };
    }
    const caller = await getCaller(context);
    const now = new Date().toISOString();
    const toSave: PiArt = {
        id: art.id,
        name: art.name.trim().slice(0, 80),
        description: (art.description || '').slice(0, 2000),
        teams: art.teams.map((t) => ({ boardId: t.boardId, name: t.name.trim().slice(0, 200) })),
        version: (existing?.version || 0) + 1,
        created: existing?.created || now,
        createdBy: existing ? existing.createdBy : caller,
        updated: now,
        updatedBy: caller,
    };
    await kvs.set(key, toSave);
    return { ok: true, art: toSave };
}

async function deleteArt(payload: DeletePayload, context: CallContext) {
    if (!payload || !idPattern.test(payload.id)) {
        return reject(400, 'Invalid ART');
    }
    await ensureEditor(context);

    const key = artKeyPrefix + payload.id;
    const existing = (await kvs.get(key)) as PiArt | undefined;
    if (existing && existing.version !== payload.version) {
        return { ok: false, conflict: true, latest: existing };
    }
    if ((await readSummaries()).some((s) => s.artId === payload.id)) {
        return reject(409, 'This ART still has plans. Delete them or move them to another ART first.');
    }
    await kvs.delete(key);
    return { ok: true };
}

/** Dependencies and risks raised in other plans on the teams of this plan, e.g. by a team of another ART. */
async function getIncoming(payload: { id: string }): Promise<PiIncomingResult> {
    if (!payload || !idPattern.test(payload.id)) {
        return reject(400, 'Invalid plan');
    }
    const doc = await readDocument(payload.id);
    if (!doc) {
        return { dependencies: [], risks: [] };
    }
    const boardIds = new Set(doc.teams.map((t) => t.boardId));
    const candidates = (await readSummaries())
        .filter((s) => s.id !== doc.id && s.externalBoardIds.some((id) => boardIds.has(id)) && rangesOverlap(s.startDate, s.endDate, doc.startDate, doc.endDate))
        .slice(0, maxIncomingPlans);
    const sources = (await Promise.all(candidates.map((s) => readDocument(s.id)))).filter((d): d is PiDocument => !!d);

    const result: PiIncomingResult = { dependencies: [], risks: [] };
    for (const source of sources) {
        const teamName = (boardId: number | null) => source.teams.find((t) => t.boardId === boardId)?.name || source.name;
        const base = { piId: source.id, piName: source.name, artId: source.artId };
        source.dependencies
            .filter((d) => boardIds.has(d.toTeam.boardId))
            .forEach((item) => result.dependencies.push({ ...base, fromBoardName: teamName(item.fromBoardId), item }));
        source.risks
            .filter((r) => r.targetTeam && boardIds.has(r.targetTeam.boardId))
            .forEach((item) => result.risks.push({ ...base, fromBoardName: teamName(item.teamBoardId), item }));
    }
    return result;
}

/** The team a dependency or risk is raised on answers it. Only the answer fields are changed in the plan that owns the item. */
async function respond(payload: RespondPayload, context: CallContext) {
    if (!payload || !idPattern.test(payload.piId) || !isValidItemResponse(payload.response)) {
        return reject(400, 'Invalid response');
    }
    await ensureEditor(context);

    const doc = await readDocument(payload.piId);
    if (!doc) {
        return reject(404, 'The plan of this item does not exist any more.');
    }
    const caller = await getCaller(context);
    const now = new Date().toISOString();
    const { response } = payload;
    let next: PiDocument;
    if (response.kind === 'dependency') {
        if (!doc.dependencies.some((d) => d.id === response.itemId)) {
            return reject(404, 'This dependency does not exist any more.');
        }
        next = { ...doc, dependencies: doc.dependencies.map((d) => (d.id === response.itemId ? applyDependencyResponse(d, response.response, caller, now) : d)) };
    } else {
        if (!doc.risks.some((r) => r.id === response.itemId)) {
            return reject(404, 'This risk does not exist any more.');
        }
        next = { ...doc, risks: doc.risks.map((r) => (r.id === response.itemId ? applyRiskResponse(r, response.response, caller, now) : r)) };
    }
    await writeDocument({ ...next, version: doc.version + 1, updated: now, updatedBy: context.accountId || '', updatedByUser: caller });
    return { ok: true };
}

async function saveSettings(payload: { settings: PiProgramSettings }, context: CallContext) {
    const current = await ensureEditor(context);
    const { settings } = payload;
    if (!settings || current.version !== settings.version) {
        return { ok: false, conflict: true, latest: current };
    }
    const toSave: PiProgramSettings = { ...defaultSettings, ...settings, version: current.version + 1 };
    if (toSave.editors.restricted && context.accountId && !toSave.editors.accountIds.includes(context.accountId) && !toSave.editors.groupIds.length) {
        // Prevent the editor from locking everyone out
        const caller = await getCaller(context);
        toSave.editors = {
            ...toSave.editors,
            accountIds: [...toSave.editors.accountIds, context.accountId],
            names: { ...toSave.editors.names, [context.accountId]: caller?.displayName || context.accountId },
        };
    }
    await kvs.set(settingsKey, toSave);
    return { ok: true, settings: toSave };
}

export function registerPiResolvers(resolver: Resolver) {
    resolver.define('PiList', async (req) => {
        const settings = await getSettings();
        const [canEditPlans, plans, arts] = await Promise.all([canEdit((req.context as CallContext).accountId, settings), readSummaries(), readByPrefix<PiArt>(artKeyPrefix)]);
        return { arts, plans, settings, canEdit: canEditPlans };
    });

    resolver.define('PiGet', async (req) => {
        const { id } = req.payload as { id: string };
        if (!idPattern.test(id)) {
            return reject(400, 'Invalid plan');
        }
        return { doc: await readDocument(id) };
    });

    resolver.define('PiSave', (req) => savePi(req.payload as unknown as SavePayload, req.context as CallContext));
    resolver.define('PiDelete', (req) => deletePi(req.payload as unknown as DeletePayload, req.context as CallContext));
    resolver.define('PiArtSave', (req) => saveArt(req.payload as unknown as { art: PiArt }, req.context as CallContext));
    resolver.define('PiArtDelete', (req) => deleteArt(req.payload as unknown as DeletePayload, req.context as CallContext));
    resolver.define('PiIncoming', (req) => getIncoming(req.payload as unknown as { id: string }));
    resolver.define('PiRespond', (req) => respond(req.payload as unknown as RespondPayload, req.context as CallContext));
    resolver.define('PiSettingsSave', (req) => saveSettings(req.payload as unknown as { settings: PiProgramSettings }, req.context as CallContext));
}
