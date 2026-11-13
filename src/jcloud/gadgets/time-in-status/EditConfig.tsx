import { useCallback } from 'react';

import { Modal } from '@forge/bridge';

import { getSettingsError, normalizeSettings } from '@/gadgets/TimeInStatus/settings';
import SettingsForm from '@/gadgets/TimeInStatus/SettingsForm';
import type { TimeInStatusSettings } from '@/gadgets/TimeInStatus/types';
import type { UserGroup } from '@/types';

import GadgetMessage from '../../components/GadgetMessage';
import useDashboardItemConfig from '../../useDashboardItemConfig';

interface EditConfigProps {
    settings: TimeInStatusSettings;
}

interface UserGroupModalResult {
    userGroups?: UserGroup[];
}

export default function EditConfig({ settings: initialSettings }: EditConfigProps) {
    const { settings, saveError, update } = useDashboardItemConfig({
        hostType: 'widget',
        initialSettings,
        prepare: normalizeSettings,
        validate: getSettingsError,
    });

    const manageGroups = useCallback(() => {
        const modal = new Modal({
            onClose: (result?: UserGroupModalResult) => {
                if (result?.userGroups) {
                    update({ userGroups: result.userGroups });
                }
            },
            size: 'max',
            context: { modalId: 'ja-dlg-user-groups', groups: settings.userGroups ?? undefined },
        });
        modal.open();
    }, [settings.userGroups, update]);

    return (
        <div className="p-4">
            {saveError && <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Unable to save" text={saveError} />}
            <SettingsForm settings={settings} onChange={update} onManageGroups={manageGroups} />
        </div>
    );
}
