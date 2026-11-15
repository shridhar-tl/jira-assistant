import { WeekDaysSelector } from '@/controls';

import { Chips, NumericInput, SelectButton } from '@components';

import Field from '../../../../shared/components/Field';
import type { PlanningUnit, TeamDefinition } from '../../../../shared/types';

interface PlanningTabProps {
    team: TeamDefinition;
    onChange: (team: TeamDefinition) => void;
}

const unitItems = [
    { label: 'Story points', value: 'points' },
    { label: 'Hours', value: 'hours' },
    { label: 'Both', value: 'both' },
];

/** Team defaults for the people schedule and the planning settings of the team (CP-8, CP-9, RM-6 labels). */
export default function PlanningTab({ team, onChange }: PlanningTabProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hours per working day" hint="Default for members without their own value.">
                <NumericInput
                    value={team.defaults.hoursPerDay}
                    min={0.5}
                    max={24}
                    step={0.5}
                    maxDecimals={1}
                    onChange={(e) => e.value && onChange({ ...team, defaults: { ...team.defaults, hoursPerDay: e.value } })}
                />
            </Field>
            <Field label="Working days">
                <WeekDaysSelector field="workingDays" value={team.defaults.workingDays} onChange={(value) => value.length && onChange({ ...team, defaults: { ...team.defaults, workingDays: value } })} />
            </Field>
            <Field label="Focus factor (%)" hint="Share of available hours that can be planned. The rest covers meetings, support and unplanned work.">
                <NumericInput value={team.focusFactor} min={10} max={100} step={5} onChange={(e) => e.value && onChange({ ...team, focusFactor: e.value })} />
            </Field>
            <Field label="Planning unit">
                <SelectButton items={unitItems} value={team.planningUnit} onChange={(e) => onChange({ ...team, planningUnit: e.value as PlanningUnit })} />
            </Field>
            <Field label="Hours per story point" hint="Converts hours to points when there is no velocity yet, and shows hours next to points.">
                <NumericInput value={team.hoursPerPoint} min={0.25} max={80} step={0.5} maxDecimals={2} onChange={(e) => e.value && onChange({ ...team, hoursPerPoint: e.value })} />
            </Field>
            <Field label="Labels for planned segments" hint="Press Enter after each label.">
                <Chips value={team.segmentLabels} onChange={(e) => onChange({ ...team, segmentLabels: e.value })} placeholder="Dev, QA, Review" />
            </Field>
        </div>
    );
}
