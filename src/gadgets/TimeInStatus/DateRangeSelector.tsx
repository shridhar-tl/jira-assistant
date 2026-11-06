import { memo, useCallback, useMemo } from 'react';

import { DateRangePicker, type DateSelectedCallbackArg } from '@/controls';

import { dateRangeHint } from './constants';
import { buildDateRangePresets, fromPickerSelection, getPickerValue } from './date-range';
import type { TimeInStatusDateRange } from './types';

interface DateRangeSelectorProps {
    value: TimeInStatusDateRange;
    onChange: (dateRange: TimeInStatusDateRange) => void;
}

function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
    const presets = useMemo(() => buildDateRangePresets(), []);
    const pickerValue = useMemo(() => getPickerValue(value), [value]);

    const handleChange = useCallback(
        (e: DateSelectedCallbackArg) => {
            const dates = e.value as [Date, Date];
            if (Array.isArray(dates) && dates[0] && dates[1]) {
                onChange(fromPickerSelection(e.range, dates));
            }
        },
        [onChange],
    );

    return (
        <div title={dateRangeHint}>
            <DateRangePicker value={pickerValue} ranges={presets} onChange={handleChange} dateFormat="dd MMM yyyy" />
        </div>
    );
}

export default memo(DateRangeSelector);
