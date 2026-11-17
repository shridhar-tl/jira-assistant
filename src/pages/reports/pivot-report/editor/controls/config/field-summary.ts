import { getAggregationLabel } from '../../../utils/format-functions';

interface SummaryField {
    colGroup?: boolean;
    enableGrouping?: boolean;
    agrFunc?: string;
    useDistinct?: boolean;
    schema?: { computed?: boolean };
}

const noAggregationFuncName = 'none';

export function getFieldSummary(field: SummaryField, depth: number): string {
    if (field.schema?.computed) {
        return 'Date columns';
    }

    if (field.enableGrouping || (field.colGroup && !depth)) {
        return field.colGroup || depth ? 'Pivot' : 'Grouped';
    }

    if (field.agrFunc === noAggregationFuncName) {
        return 'List';
    }

    const label = getAggregationLabel(field.agrFunc) || '';

    return field.useDistinct ? `${label} (distinct)` : label;
}
