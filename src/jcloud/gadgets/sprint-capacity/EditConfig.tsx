import BoardPicker from '@/pages/planning/shared/components/BoardPicker';

import { InputSwitch } from '@components';

import ConfigPanel from '../../components/ConfigPanel';
import ConfigSection from '../../components/ConfigSection';
import useDashboardItemConfig from '../../useDashboardItemConfig';

import { normalizeSprintCapacitySettings, type SprintCapacitySettings } from './settings';

interface EditConfigProps {
    settings: SprintCapacitySettings;
}

const boardRequiredMessage = 'Choose at least one board.';

function validate(settings: SprintCapacitySettings): string | null {
    return settings.boardIds.length ? null : boardRequiredMessage;
}

export default function EditConfig({ settings: initialSettings }: EditConfigProps) {
    const { settings, saveError, update } = useDashboardItemConfig({
        hostType: 'widget',
        initialSettings,
        prepare: normalizeSprintCapacitySettings,
        validate,
    });

    return (
        <ConfigPanel saveError={saveError}>
            <ConfigSection icon="fa-columns" title="Teams (boards)" description="The active sprint of each chosen Scrum board is shown on the widget.">
                <BoardPicker
                    multiple
                    scrumOnly
                    placeholder="Choose the boards"
                    value={settings.boardIds}
                    onChange={(boards) => update({ boardIds: boards.map((b) => b.id) })}
                />
            </ConfigSection>
            <ConfigSection icon="fa-user-friends" title="Display">
                <InputSwitch label="Show each member" checked={settings.showMembers} onChange={(e) => update({ showMembers: e.value })} />
            </ConfigSection>
        </ConfigPanel>
    );
}
