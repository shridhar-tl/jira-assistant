import { inject } from '@services';

export interface PiPageSettings {
    artId: string | null;
}

const pageSettingsKey = 'programPlanner';

export function getPiPageSettings(): PiPageSettings {
    const { $session } = inject('SessionService');
    const stored = $session.pageSettings?.[pageSettingsKey] as Partial<PiPageSettings> | undefined;
    return { artId: typeof stored?.artId === 'string' ? stored.artId : null };
}

export function savePiPageSettings(settings: PiPageSettings): Promise<void> {
    const { $config } = inject('ConfigService');
    return $config.saveSettings(pageSettingsKey, settings);
}
