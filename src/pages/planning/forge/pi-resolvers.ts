import { asUser, route } from '@forge/api';
import { kvs, WhereConditions } from '@forge/kvs';
import type Resolver from '@forge/resolver';

import type { PiDocument, PiProgramSettings, PiSummary } from '../pi-planner/pi-types';

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

const summaryKeyPrefix = 'pi-sum-';
const listPageSize = 100;
const maxListPages = 20;
const settingsKey = 'pi-settings';
const docKeyPrefix = 'pi-doc-';
const maxDocSize = 230000;
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

function reject(status: number, message: string) {
    return Promise.reject({ status, statusText: message, text: message });
}

async function getSettings(): Promise<PiProgramSettings> {
    const stored = (await kvs.get(settingsKey)) as PiProgramSettings | undefined;
    return { ...defaultSettings, ...(stored || {}) };
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
    const response = await asUser().requestJira(route`/rest/api/3/myself?expand=groups`, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        return false;
    }
    const me = (await response.json()) as { groups?: { items?: { groupId?: string; name?: string }[] } };
    const groups = me.groups?.items || [];
    return groups.some((g) => settings.editors.groupIds.includes(g.groupId || '') || settings.editors.groupIds.includes(g.name || ''));
}

async function ensureEditor(context: CallContext) {
    const settings = await getSettings();
    if (!(await canEdit(context.accountId, settings))) {
        return reject(403, 'You are not allowed to change program plans. Ask an editor listed in the plan settings.');
    }
    return settings;
}

function toSummary(doc: PiDocument): PiSummary {
    return { id: doc.id, name: doc.name, startDate: doc.startDate, endDate: doc.endDate, boardIds: doc.teams.map((t) => t.boardId), version: doc.version };
}

async function readSummaries(): Promise<PiSummary[]> {
    const summaries: PiSummary[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < maxListPages; page++) {
        let query = kvs.query().where('key', WhereConditions.beginsWith(summaryKeyPrefix)).limit(listPageSize);
        if (cursor) {
            query = query.cursor(cursor);
        }
        const result = await query.getMany<PiSummary>();
        summaries.push(...result.results.map((r) => r.value));
        cursor = result.nextCursor;
        if (!cursor) {
            break;
        }
    }
    return summaries;
}

async function savePi(payload: SavePayload, context: CallContext) {
    const { doc } = payload;
    if (!doc || !idPattern.test(doc.id) || !doc.name?.trim()) {
        return reject(400, 'Invalid plan');
    }
    await ensureEditor(context);

    const key = docKeyPrefix + doc.id;
    const existing = (await kvs.get(key)) as PiDocument | undefined;
    if (existing && existing.version !== doc.version) {
        return { ok: false, conflict: true, latest: existing };
    }

    const toSave: PiDocument = { ...doc, version: (existing?.version || 0) + 1, updated: new Date().toISOString(), updatedBy: context.accountId || '' };
    if (JSON.stringify(toSave).length > maxDocSize) {
        return reject(413, 'The plan is too large to be saved.');
    }

    await kvs.transact().set(key, toSave).set(summaryKeyPrefix + doc.id, toSummary(toSave)).execute();

    return { ok: true, doc: toSave };
}

async function deletePi(payload: DeletePayload, context: CallContext) {
    if (!payload || !idPattern.test(payload.id)) {
        return reject(400, 'Invalid plan');
    }
    await ensureEditor(context);

    const key = docKeyPrefix + payload.id;
    const existing = (await kvs.get(key)) as PiDocument | undefined;
    if (existing && existing.version !== payload.version) {
        return { ok: false, conflict: true, latest: existing };
    }
    await kvs.transact().delete(key).delete(summaryKeyPrefix + payload.id).execute();
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
        toSave.editors = { ...toSave.editors, accountIds: [...toSave.editors.accountIds, context.accountId] };
    }
    await kvs.set(settingsKey, toSave);
    return { ok: true, settings: toSave };
}

export function registerPiResolvers(resolver: Resolver) {
    resolver.define('PiList', async (req) => {
        const settings = await getSettings();
        const canEditPlans = await canEdit((req.context as CallContext).accountId, settings);
        return { plans: await readSummaries(), settings, canEdit: canEditPlans };
    });

    resolver.define('PiGet', async (req) => {
        const { id } = req.payload as { id: string };
        if (!idPattern.test(id)) {
            return reject(400, 'Invalid plan');
        }
        return ((await kvs.get(docKeyPrefix + id)) as PiDocument | undefined) || null;
    });

    resolver.define('PiSave', (req) => savePi(req.payload as unknown as SavePayload, req.context as CallContext));
    resolver.define('PiDelete', (req) => deletePi(req.payload as unknown as DeletePayload, req.context as CallContext));
    resolver.define('PiSettingsSave', (req) => saveSettings(req.payload as unknown as { settings: PiProgramSettings }, req.context as CallContext));
}
