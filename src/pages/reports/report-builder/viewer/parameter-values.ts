import type { ReportDefinition } from '@components/report-viewer';

import { convertToDate } from '@utils/helpers';

/**
 * Parameter values persisted as JSON lose their Date objects. Date ranges are restored so the
 * date range picker and date functions receive real dates again.
 */
export function reviveParameterValues(
    definition: ReportDefinition,
    values: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
    if (!values) return undefined;
    const revived: Record<string, unknown> = { ...values };
    for (const p of definition.parameters) {
        const value = revived[p.id];
        if (p.type === 'date-range-picker' && Array.isArray(value)) {
            const dates = value.map((v) => convertToDate(v));
            revived[p.id] = dates.length === 2 && dates.every(Boolean) ? dates : undefined;
        }
    }
    return revived;
}

export function pickDefinedParameterValues(definition: ReportDefinition, values: Record<string, unknown>): Record<string, unknown> {
    const ids = new Set(definition.parameters.map((p) => p.id));
    return Object.fromEntries(Object.entries(values).filter(([id, v]) => ids.has(id) && v !== undefined));
}
