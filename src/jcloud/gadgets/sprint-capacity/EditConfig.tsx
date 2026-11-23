import BoardPicker from '@/pages/planning/shared/components/BoardPicker';

import { InputSwitch } from '@components';

import GadgetMessage from '../../components/GadgetMessage';
import useDashboardItemConfig from '../../useDashboardItemConfig';

import { normalizeSprintCapacitySettings, type SprintCapacitySettings } from './settings';

interface EditConfigProps {
    settings: SprintCapacitySettings;
}

function validate(settings: SprintCapacitySettings): string | null {
    return settings.boardIds.length ? null : 'Choose at least one board.';
}

export default function EditConfig({ settings: initialSettings }: EditConfigProps) {
    const { settings, saveError, update } = useDashboardItemConfig({
        hostType: 'widget',
        initialSettings,
        prepare: normalizeSprintCapacitySettings,
        validate,
    });

    return (
        <div className="flex flex-col gap-4 p-4">
            {saveError && <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Unable to save" text={saveError} />}
            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Teams (boards)</span>
                <BoardPicker multiple scrumOnly value={settings.boardIds} onChange={(boards) => update({ boardIds: boards.map((b) => b.id) })} />
            </label>
            <InputSwitch label="Show each member" checked={settings.showMembers} onChange={(e) => update({ showMembers: e.value })} />
        </div>
    );
}
