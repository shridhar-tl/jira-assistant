import type { DashboardHostType } from '../dashboard-host';
import useDashboardItemConfig from '../useDashboardItemConfig';

import GadgetMessage from './GadgetMessage';

interface NoSettingsConfigProps {
    hostType: DashboardHostType;
}

const emptySettings = {};

export default function NoSettingsConfig({ hostType }: NoSettingsConfigProps) {
    const { saveError } = useDashboardItemConfig({ hostType, initialSettings: emptySettings });

    if (saveError) {
        return <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Unable to save" text={saveError} />;
    }

    return <GadgetMessage icon="fa-check-circle" title="Nothing to configure" text="This widget does not need any settings. Save it to add it to your dashboard." />;
}
