import { getJiraErrorMessage } from '../shared/jira-api';

import { createPlanId, loadPlans, showError } from './pi-actions';
import { deleteArt, saveArt } from './pi-storage';
import { usePiStore } from './pi-store';
import type { PiArt } from './pi-types';

const conflictMessage = 'Someone else changed this ART. The latest version is loaded. Apply your change again.';

export function createArtId(): string {
    return createPlanId().replace(/^pi-/, 'art-');
}

function sortArts(arts: PiArt[]): PiArt[] {
    return [...arts].sort((a, b) => a.name.localeCompare(b.name));
}

/** Saves an ART. A newer version saved by someone else is never overwritten. */
export async function saveArtDefinition(art: PiArt): Promise<PiArt | null> {
    try {
        const result = await saveArt(art);
        if (!result.ok) {
            if (result.conflict && result.latest) {
                const latest = result.latest;
                usePiStore.setState(({ arts }) => ({ arts: sortArts([...arts.filter((a) => a.id !== latest.id), latest]) }));
                showError(conflictMessage, 'ART changed');
            }
            return null;
        }
        const saved = result.art!;
        usePiStore.setState(({ arts }) => ({ arts: sortArts([...arts.filter((a) => a.id !== saved.id), saved]) }));
        return saved;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to save the ART');
        return null;
    }
}

export async function removeArt(art: PiArt): Promise<boolean> {
    try {
        const result = await deleteArt(art.id, art.version);
        if (!result.ok) {
            showError(conflictMessage, 'ART changed');
            await loadPlans();
            return false;
        }
        usePiStore.setState(({ arts }) => ({ arts: arts.filter((a) => a.id !== art.id) }));
        return true;
    } catch (err) {
        showError(getJiraErrorMessage(err), 'Unable to delete the ART');
        return false;
    }
}
