import { useCallback, useEffect, useRef, useState } from 'react';

import { Modal } from '@forge/bridge';
import { widgetEdit, type WidgetConfig } from '@forge/dashboards-bridge';

import { getSettingsError, normalizeSettings } from '@/gadgets/TimeInStatus/settings';
import SettingsForm from '@/gadgets/TimeInStatus/SettingsForm';
import type { TimeInStatusSettings } from '@/gadgets/TimeInStatus/types';
import type { UserGroup } from '@/types';

import GadgetMessage from '../../components/GadgetMessage';

interface EditConfigProps {
    settings: TimeInStatusSettings;
}

interface UserGroupModalResult {
    userGroups?: UserGroup[];
}

function toWidgetConfig(settings: TimeInStatusSettings): WidgetConfig {
    return { ...settings };
}

export default function EditConfig({ settings: initialSettings }: EditConfigProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [saveError, setSaveError] = useState<string | null>(null);
    const settingsRef = useRef(initialSettings);

    useEffect(() => {
        widgetEdit.onProductSave(async () => {
            const current = normalizeSettings(settingsRef.current);
            const error = getSettingsError(current);
            if (error) {
                throw new Error(error);
            }
            return toWidgetConfig(current);
        });

        widgetEdit.onSaveError((error) => setSaveError(error.message));
    }, []);

    const handleChange = useCallback((changes: Partial<TimeInStatusSettings>) => {
        const updated = { ...settingsRef.current, ...changes };
        settingsRef.current = updated;
        setSettings(updated);
        setSaveError(null);
        widgetEdit.updateConfig(toWidgetConfig(updated)).catch((err: unknown) => console.error('Failed to update widget config:', err));
    }, []);

    const manageGroups = useCallback(() => {
        const modal = new Modal({
            onClose: (result?: UserGroupModalResult) => {
                if (result?.userGroups) {
                    handleChange({ userGroups: result.userGroups });
                }
            },
            size: 'max',
            context: { modalId: 'ja-dlg-user-groups', groups: settingsRef.current.userGroups ?? undefined },
        });
        modal.open();
    }, [handleChange]);

    return (
        <div className="p-4">
            {saveError && <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Unable to save" text={saveError} />}
            <SettingsForm settings={settings} onChange={handleChange} onManageGroups={manageGroups} />
        </div>
    );
}
