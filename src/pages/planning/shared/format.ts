import { format } from 'date-fns';

import type { EstimateUnit } from './capacity';
import type { PlanningUnit } from './types';

export function formatNumber(value: number | null | undefined, decimals = 1): string {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return '–';
    }
    const factor = 10 ** decimals;
    const rounded = Math.round(value * factor) / factor;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
}

export function formatShortDate(date: Date | null | undefined): string {
    return date ? format(date, 'd MMM') : '';
}

export function formatDateRange(start: Date | null | undefined, end: Date | null | undefined): string {
    if (!start && !end) {
        return 'No dates';
    }
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export function getUnitLabel(unit: PlanningUnit | EstimateUnit): string {
    return unit === 'hours' ? 'h' : 'pts';
}

/** Unit used to compare commitment with capacity: hours when the team plans in hours or the board estimates in hours. */
export function getDisplayUnit(planningUnit: PlanningUnit, estimateUnit: EstimateUnit): EstimateUnit {
    return planningUnit === 'hours' || estimateUnit === 'hours' ? 'hours' : 'points';
}

export function formatEstimate(points: number | null, seconds: number | null, unit: EstimateUnit): string {
    if (unit === 'points') {
        return points === null ? '' : formatNumber(points);
    }
    return seconds === null ? '' : `${formatNumber(seconds / 3600)}h`;
}
