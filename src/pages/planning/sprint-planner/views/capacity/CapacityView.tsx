import { useMemo, useState } from 'react';

import HeatmapGrid from '@/gadgets/WorkloadHeatmap/HeatmapGrid';
import HeatmapLegend from '@/gadgets/WorkloadHeatmap/HeatmapLegend';
import HeatmapOverlay from '@/gadgets/WorkloadHeatmap/HeatmapOverlay';
import '@/gadgets/WorkloadHeatmap/WorkloadHeatmap.css';

import { Dropdown, SelectButton } from '@components';

import type { SprintCapacity } from '../../../shared/capacity';
import { getDisplayUnit, getUnitLabel } from '../../../shared/format';
import { buildPlannerHeatmapModel } from '../../../shared/heatmap-adapter';
import { leaveNeedsBoardAdmin } from '../../../shared/leave-store';
import { buildPeriods, computePeriodCapacity, type PeriodMode } from '../../../shared/period-capacity';
import { computePersonLoads } from '../../../shared/person-load';
import type { PlannerSprint } from '../../../shared/types';
import { usePlannerStore } from '../../store';
import type { BoardModel } from '../../useBoardModel';

import CapacityTable from './CapacityTable';
import LeavePanel from './LeavePanel';
import VelocityPanel from './VelocityPanel';

interface CapacityViewProps {
    model: BoardModel;
}

const periodItems = [
    { label: 'Weeks', value: 'week' },
    { label: 'Months', value: 'month' },
];
const periodCounts: Record<PeriodMode, number> = { week: 6, month: 3 };

/** Capacity of the team per sprint (or per week / month on kanban boards), velocity, leave and day-level load (CP-1 to CP-9). */
export default function CapacityView({ model }: CapacityViewProps) {
    const { data, openSprints, capacities, velocity } = model;
    const settings = usePlannerStore((s) => s.settings);
    const teamReadOnly = !!usePlannerStore((s) => s.teamReadOnlyReason);
    const isKanban = data.config.type === 'kanban';
    const unit = isKanban ? 'hours' : getDisplayUnit(data.team.planningUnit, data.estimateUnit);
    const [periodMode, setPeriodMode] = useState<PeriodMode>('week');
    const [heatmapColumn, setHeatmapColumn] = useState<number | null>(null);

    const personLoads = useMemo(
        () =>
            computePersonLoads({
                issues: Object.values(data.issues),
                members: data.members,
                team: data.team,
                leaveIndex: data.leaveIndex,
                sprintRanges: data.sprintRanges,
                estimateUnit: data.estimateUnit,
                leadTimeDays: settings.leadTimeDays,
            }),
        [data, settings.leadTimeDays],
    );

    const { columns, columnCapacities } = useMemo(() => {
        if (!isKanban) {
            return { columns: openSprints, columnCapacities: capacities };
        }
        const periods = buildPeriods(periodMode, periodCounts[periodMode]);
        const map = new Map<number, SprintCapacity>();
        periods.forEach((p) => map.set(p.sprint.id, computePeriodCapacity(p, data.members, data.team, data.leaveIndex, personLoads.loads)));
        return { columns: periods.map((p) => p.sprint), columnCapacities: map };
    }, [isKanban, openSprints, capacities, periodMode, data, personLoads]);

    const selectedColumn: PlannerSprint | undefined = columns.find((c) => c.id === heatmapColumn) || columns[0];
    const selectedRange = selectedColumn ? columnCapacities.get(selectedColumn.id)?.range : null;

    const heatmapModel = useMemo(
        () =>
            selectedRange
                ? buildPlannerHeatmapModel(data.board.name, data.members, data.team, data.leaveIndex, personLoads, data.issues, selectedRange)
                : null,
        [selectedRange, data, personLoads],
    );

    return (
        <div className="flex flex-col gap-4 p-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-(--text-secondary)">
                <span>
                    {data.members.length} members · focus factor {data.team.focusFactor}% · {data.team.defaults.hoursPerDay} h/day
                    {data.team.planningUnit !== 'hours' && ` · ${data.team.hoursPerPoint} h per point`}
                </span>
                {isKanban && (
                    <span className="ms-auto">
                        <SelectButton items={periodItems} value={periodMode} onChange={(e) => setPeriodMode(e.value as PeriodMode)} />
                    </span>
                )}
            </div>

            {columns.length ? (
                <CapacityTable sprints={columns} capacities={columnCapacities} members={data.members} unit={unit} showHours={data.team.planningUnit === 'both'} />
            ) : (
                <div className="text-sm text-(--text-secondary)">There are no active or future sprints to plan.</div>
            )}

            {heatmapModel && selectedColumn && (
                <section className="flex flex-col gap-2 rounded-lg border border-(--border-primary)">
                    <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
                        <h3 className="me-auto text-sm font-semibold">Daily load</h3>
                        <div className="w-64">
                            <Dropdown options={columns.map((c) => ({ label: c.name, value: c.id }))} value={selectedColumn.id} onChange={(e) => setHeatmapColumn(e.value as number)} />
                        </div>
                    </div>
                    <div className="workload-heatmap max-h-[420px] overflow-auto">
                        <HeatmapOverlay>
                            <HeatmapGrid model={heatmapModel} />
                        </HeatmapOverlay>
                    </div>
                    <div className="border-t border-(--border-primary) bg-(--bg-secondary) px-3 py-2">
                        <HeatmapLegend capacityPerDay={heatmapModel.capacityPerDay} />
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {!isKanban && <VelocityPanel team={data.team} velocity={velocity} unitLabel={getUnitLabel(data.estimateUnit)} readOnly={teamReadOnly} />}
                <LeavePanel data={data} readOnly={teamReadOnly && leaveNeedsBoardAdmin} />
            </div>
        </div>
    );
}
