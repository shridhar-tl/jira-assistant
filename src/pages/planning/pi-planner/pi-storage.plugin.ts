import { invoke } from '@forge/bridge';

import { normalizeDocument } from './pi-items';
import type { PiArt, PiDocument, PiIncomingResult, PiItemResponse, PiListResult, PiProgramSettings, PiSaveResult } from './pi-types';

/** Resolver call without metadata: Forge returns the body itself in that case. */
async function call<T>(functionKey: string, payload: Record<string, unknown>): Promise<T> {
    return (await invoke<T>(functionKey, payload)) as T;
}

export function listPlans(): Promise<PiListResult> {
    return call<PiListResult>('PiList', {});
}

export async function getPlan(id: string): Promise<PiDocument | null> {
    const { doc } = await call<{ doc: PiDocument | null }>('PiGet', { id });
    return doc ? normalizeDocument(doc) : null;
}

export function savePlan(doc: PiDocument): Promise<PiSaveResult<PiDocument>> {
    return call<PiSaveResult<PiDocument>>('PiSave', { doc });
}

export function deletePlan(id: string, version: number): Promise<PiSaveResult<PiDocument>> {
    return call<PiSaveResult<PiDocument>>('PiDelete', { id, version });
}

export function saveArt(art: PiArt): Promise<PiSaveResult<PiArt>> {
    return call<PiSaveResult<PiArt>>('PiArtSave', { art });
}

export function deleteArt(id: string, version: number): Promise<PiSaveResult<PiArt>> {
    return call<PiSaveResult<PiArt>>('PiArtDelete', { id, version });
}

export function getIncomingItems(id: string): Promise<PiIncomingResult> {
    return call<PiIncomingResult>('PiIncoming', { id });
}

export function respondToItem(piId: string, response: PiItemResponse): Promise<{ ok: boolean }> {
    return call<{ ok: boolean }>('PiRespond', { piId, response });
}

export function saveProgramSettings(settings: PiProgramSettings): Promise<PiSaveResult<PiProgramSettings>> {
    return call<PiSaveResult<PiProgramSettings>>('PiSettingsSave', { settings });
}
