import type { CSSProperties } from 'react';

import { endOfMonth, endOfWeek, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns';

import type { DateSelectedCallbackArg } from '@components';
import { DateRangePicker as FluxoDateRangePicker } from '@components';

export type { DateSelectedCallbackArg };

export interface DateRangeValue {
    fromDate: Date;
    toDate: Date;
    quickDate?: string | number;
}

interface DateRangePickerProps {
    value?: [Date, Date] | DateRangeValue;
    onChange?: (e: DateSelectedCallbackArg) => void;
    onClose?: () => void;
    disabled?: boolean;
    styles?: CSSProperties;
    className?: string;
    classNames?: { container?: string; control?: string };
    dateFormat?: string;
    name?: string;
    id?: string;
    args?: any;
}

export const labelText = ['This month', 'One month', 'Prev month', 'This week', 'Last 7 days', 'Prev week', 'Prev 2 weeks', 'Last 14 days'];

function buildRanges() {
    const now = new Date();
    return [
        { value: 'this_month', label: 'This month', range: [startOfMonth(now), endOfMonth(now)] as [Date, Date] },
        { value: 'one_month', label: 'One month', range: [subMonths(now, 1), now] as [Date, Date] },
        {
            value: 'prev_month',
            label: 'Prev month',
            range: [startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))] as [Date, Date],
        },
        { value: 'this_week', label: 'This week', range: [startOfWeek(now), endOfWeek(now)] as [Date, Date] },
        { value: 'last_7_days', label: 'Last 7 days', range: [subDays(now, 6), now] as [Date, Date] },
        { value: 'prev_week', label: 'Prev week', range: [startOfWeek(subWeeks(now, 1)), endOfWeek(subWeeks(now, 1))] as [Date, Date] },
        {
            value: 'prev_2_weeks',
            label: 'Prev 2 weeks',
            range: [startOfWeek(subWeeks(now, 2)), endOfWeek(subWeeks(now, 1))] as [Date, Date],
        },
        { value: 'last_14_days', label: 'Last 14 days', range: [subDays(now, 13), now] as [Date, Date] },
    ];
}

export function getQuickDateValue(quickDate: number): [Date, Date] | undefined {
    return buildRanges()[quickDate]?.range;
}

function normalizePickerValue(value?: [Date, Date] | DateRangeValue): [Date, Date] | string | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (value.quickDate != null) return value.quickDate as string;
    if (value.fromDate && value.toDate) {
        return [new Date(value.fromDate), new Date(value.toDate)];
    }
    return undefined;
}

export default function DateRangePicker({ value, onChange, ...rest }: DateRangePickerProps) {
    return (
        <FluxoDateRangePicker
            {...rest}
            value={normalizePickerValue(value) as any}
            ranges={buildRanges()}
            onChange={onChange ?? (() => {})}
        />
    );
}
