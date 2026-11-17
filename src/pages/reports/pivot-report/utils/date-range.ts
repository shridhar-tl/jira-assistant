import type { DateSelectedCallbackArg } from '@components';

import type { DateRangeSelection } from '../types';

type DateRangeTuple = DateSelectedCallbackArg['value'];

export function toPickerValue(range?: Partial<DateRangeSelection> | null): DateRangeTuple | undefined {
    if (!range?.fromDate || !range.toDate) {
        return undefined;
    }

    return [new Date(range.fromDate), new Date(range.toDate)];
}

export function fromPickerValue({ value }: DateSelectedCallbackArg): DateRangeSelection | undefined {
    const [fromDate, toDate] = value || [];

    return fromDate && toDate ? { fromDate, toDate } : undefined;
}
