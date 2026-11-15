import { create } from 'zustand';

import { isPluginBuild } from '@/constants/build-info';

export const isStorageConsentRequired = !isPluginBuild;

const consentRequiredMessage =
    'Nothing was saved. Saving is turned off until you accept the note about storing planner data in Jira, shown at the top of the planner.';

interface StorageConsentState {
    accepted: boolean;
}

export const useStorageConsent = create<StorageConsentState>(() => ({ accepted: !isStorageConsentRequired }));

export class StorageConsentError extends Error {
    constructor() {
        super(consentRequiredMessage);
        this.name = 'StorageConsentError';
    }
}

export function setStorageConsent(accepted: boolean): void {
    useStorageConsent.setState({ accepted: accepted || !isStorageConsentRequired });
}

export function isStorageAllowed(): boolean {
    return useStorageConsent.getState().accepted;
}

export function ensureStorageAllowed(): void {
    if (!isStorageAllowed()) {
        throw new StorageConsentError();
    }
}
