import type { PiDocument, PiListResult, PiProgramSettings, PiSaveResult } from './pi-types';

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

export function saveProgramSettings(_settings: PiProgramSettings): Promise<PiSaveResult<PiProgramSettings>> {
    return unavailable();
}
