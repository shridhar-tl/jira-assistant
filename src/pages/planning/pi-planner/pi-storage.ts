import type { PiArt, PiDocument, PiIncomingResult, PiItemResponse, PiListResult, PiProgramSettings, PiSaveResult } from './pi-types';

const unavailableMessage = 'Program planning is available only in the Jira Assistant Forge app.';

function unavailable<T>(): Promise<T> {
    return Promise.reject(new Error(unavailableMessage));
}

export function listPlans(): Promise<PiListResult> {
    return unavailable();
}

export function getPlan(_id: string): Promise<PiDocument | null> {
    return unavailable();
}

export function savePlan(_doc: PiDocument): Promise<PiSaveResult<PiDocument>> {
    return unavailable();
}

export function deletePlan(_id: string, _version: number): Promise<PiSaveResult<PiDocument>> {
    return unavailable();
}

export function saveArt(_art: PiArt): Promise<PiSaveResult<PiArt>> {
    return unavailable();
}

export function deleteArt(_id: string, _version: number): Promise<PiSaveResult<PiArt>> {
    return unavailable();
}

export function getIncomingItems(_id: string): Promise<PiIncomingResult> {
    return unavailable();
}

export function respondToItem(_piId: string, _response: PiItemResponse): Promise<{ ok: boolean }> {
    return unavailable();
}

export function saveProgramSettings(_settings: PiProgramSettings): Promise<PiSaveResult<PiProgramSettings>> {
    return unavailable();
}
