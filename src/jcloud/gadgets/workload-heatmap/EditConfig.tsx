import { useCallback } from 'react';

import { Modal } from '@forge/bridge';

import { getSettingsError, normalizeSettings } from '@/gadgets/WorkloadHeatmap/settings';
import SettingsForm from '@/gadgets/WorkloadHeatmap/SettingsForm';
import type { WorkloadHeatmapSettings } from '@/gadgets/WorkloadHeatmap/types';
import type { UserGroup } from '@/types';

import ConfigPanel from '../../components/ConfigPanel';
import useDashboardItemConfig from '../../useDashboardItemConfig';

interface EditConfigProps {
    settings: WorkloadHeatmapSettings;
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
        <ConfigPanel saveError={saveError}>
            <SettingsForm settings={settings} onChange={update} onManageGroups={manageGroups} />
        </ConfigPanel>
    );
}
