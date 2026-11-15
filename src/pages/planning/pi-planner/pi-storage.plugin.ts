import { invoke } from '@forge/bridge';

import type { PiDocument, PiListResult, PiProgramSettings, PiSaveResult } from './pi-types';

/** Resolver call without metadata: Forge returns the body itself in that case. */
async function call<T>(functionKey: string, payload: Record<string, unknown>): Promise<T> {
    return (await invoke<T>(functionKey, payload)) as T;
}

export function listPlans(): Promise<PiListResult> {
    return call<PiListResult>('PiList', {});
}

export function getPlan(id: string): Promise<PiDocument | null> {
    return call<PiDocument | null>('PiGet', { id });
}

export function savePlan(doc: PiDocument): Promise<PiSaveResult<PiDocument>> {
    return call<PiSaveResult<PiDocument>>('PiSave', { doc });
}

export function deletePlan(id: string, version: number): Promise<PiSaveResult<PiDocument>> {
    return call<PiSaveResult<PiDocument>>('PiDelete', { id, version });
}

export function saveProgramSettings(settings: PiProgramSettings): Promise<PiSaveResult<PiProgramSettings>> {
    return call<PiSaveResult<PiProgramSettings>>('PiSettingsSave', { settings });
}
