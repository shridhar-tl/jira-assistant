import { lazy, Suspense, useEffect, useState } from 'react';

import { withInitParams } from '@/layouts/initialization/index.plugin';
import CapacityBar from '@/pages/planning/shared/components/CapacityBar';
import { formatDateRange, getDisplayUnit, getUnitLabel } from '@/pages/planning/shared/format';
import { loadActiveSprintCapacity, type ActiveSprintCapacity } from '@/pages/planning/shared/sprint-capacity-loader';
import AssigneeBreakdown from '@/pages/planning/sprint-planner/views/board/AssigneeBreakdown';

import { BlockLoading, Loading } from '@components';

import withSimpleAuth from '../../../layouts/authorization/simple-auth';
import GadgetMessage from '../../components/GadgetMessage';
import { type DashboardItemProps, getDashboardItemConfig, isDashboardItemEdit } from '../../dashboard-host';
import { normalizeSprintCapacitySettings, type SprintCapacitySettings } from './settings';

const EditConfig = lazy(() => import('./EditConfig'));

function getStoredSettings(jiraContext: DashboardItemProps['jiraContext']): SprintCapacitySettings {
    return normalizeSprintCapacitySettings(getDashboardItemConfig<SprintCapacitySettings>(jiraContext));
}

function TeamCapacity({ item, showMembers }: { item: ActiveSprintCapacity; showMembers: boolean }) {
    const unit = getDisplayUnit(item.team.planningUnit, item.estimateUnit);
    if (!item.sprint || !item.capacity) {
        return (
            <div className="rounded border border-(--border-primary) p-2 text-sm">
                <div className="font-semibold">{item.board.name}</div>
                <div className="text-xs text-(--text-secondary)">No active sprint</div>
            </div>
        );
    }
    const committed = unit === 'hours' ? item.capacity.committedHours : item.capacity.committedPoints;
    const capacity = unit === 'hours' ? item.capacity.capacityHours : item.capacity.capacityPoints;
    return (
        <div className="flex flex-col gap-1.5 rounded border border-(--border-primary) p-2 text-sm">
            <div className="flex items-baseline gap-2">
                <span className="truncate font-semibold">{item.board.name}</span>
                <span className="truncate text-xs text-(--text-secondary)">
                    {item.sprint.name} · {formatDateRange(item.capacity.range?.start, item.capacity.range?.end)}
                </span>
            </div>
            <CapacityBar committed={committed} capacity={capacity} level={item.capacity.level} unit={getUnitLabel(unit)} label="Commitment vs capacity" />
            {showMembers && <AssigneeBreakdown capacity={item.capacity} unit={unit} />}
        </div>
    );
}

function SprintCapacityDisplay({ settings }: { settings: SprintCapacitySettings }) {
    const [items, setItems] = useState<ActiveSprintCapacity[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all(settings.boardIds.map(loadActiveSprintCapacity))
            .then((result) => !cancelled && setItems(result))
            .catch((err: Error) => !cancelled && setError(err?.message || 'Unable to load the sprint capacity'));
        return () => {
            cancelled = true;
        };
    }, [settings.boardIds.join(',')]);

    if (!settings.boardIds.length) {
        return <GadgetMessage icon="fa-cog" title="Not configured" text="Edit the widget and choose the teams (boards) to show." />;
    }
    if (error) {
        return <GadgetMessage icon="fa-exclamation-triangle" variant="error" title="Unable to load" text={error} />;
    }
    if (!items) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loading size="lg" />
            </div>
        );
    }
    return (
        <div className="flex h-full flex-col gap-2 overflow-auto p-2">
            {items.map((item) => (
                <TeamCapacity key={item.board.id} item={item} showMembers={settings.showMembers} />
            ))}
        </div>
    );
}

/** Dashboard widget: commitment vs capacity of the active sprint of each chosen team (TR-3). */
function SprintCapacityWidget({ jiraContext }: DashboardItemProps) {
    if (isDashboardItemEdit(jiraContext)) {
        return (
            <Suspense fallback={<BlockLoading text="Loading..." />}>
                <EditConfig settings={getStoredSettings(jiraContext)} />
            </Suspense>
        );
    }
    return <SprintCapacityDisplay settings={getStoredSettings(jiraContext)} />;
}

export default withInitParams(withSimpleAuth(SprintCapacityWidget));
