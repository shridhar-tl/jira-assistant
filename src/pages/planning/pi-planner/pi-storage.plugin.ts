import { invokeResolver } from '../../../common/invoke-resolver.plugin';

import { normalizeDocument } from './pi-items';
import type { PiArt, PiDocument, PiIncomingResult, PiItemResponse, PiListResult, PiProgramSettings, PiSaveResult } from './pi-types';

export function listPlans(): Promise<PiListResult> {
    return invokeResolver<PiListResult>('PiList', {});
}

export async function getPlan(id: string): Promise<PiDocument | null> {
    const { doc } = await invokeResolver<{ doc: PiDocument | null }>('PiGet', { id });
    return doc ? normalizeDocument(doc) : null;
}

export function savePlan(doc: PiDocument): Promise<PiSaveResult<PiDocument>> {
    return invokeResolver<PiSaveResult<PiDocument>>('PiSave', { doc });
}

export function deletePlan(id: string, version: number): Promise<PiSaveResult<PiDocument>> {
    return invokeResolver<PiSaveResult<PiDocument>>('PiDelete', { id, version });
}

export function saveArt(art: PiArt): Promise<PiSaveResult<PiArt>> {
    return invokeResolver<PiSaveResult<PiArt>>('PiArtSave', { art });
}

export function deleteArt(id: string, version: number): Promise<PiSaveResult<PiArt>> {
    return invokeResolver<PiSaveResult<PiArt>>('PiArtDelete', { id, version });
}

export function getIncomingItems(id: string): Promise<PiIncomingResult> {
    return invokeResolver<PiIncomingResult>('PiIncoming', { id });
}

export function respondToItem(piId: string, response: PiItemResponse): Promise<{ ok: boolean }> {
    return invokeResolver<{ ok: boolean }>('PiRespond', { piId, response });
}

export function saveProgramSettings(settings: PiProgramSettings): Promise<PiSaveResult<PiProgramSettings>> {
    return invokeResolver<PiSaveResult<PiProgramSettings>>('PiSettingsSave', { settings });
}
