import { useCallback, useMemo } from 'react';

import { TimePicker as TimeInput, type TimePickerValue } from '@components';

interface TimePickerProps {
    value?: number | null;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    maxHour?: number;
    onChange?: (value: number, field?: string) => void;
    field?: string;
}

function toTimeValue(value: number | null | undefined): TimePickerValue {
    if (value === undefined || value === null) {
        return null;
    }
    const hours = Math.floor(value);
    return { hours, minutes: Math.round((value - hours) * 60), seconds: 0 };
}

export default function TimePicker({ value, className, disabled = false, placeholder = 'Choose time', maxHour = 12, onChange, field }: TimePickerProps) {
    const timeValue = useMemo(() => toTimeValue(value), [value]);

    const timeChanged = useCallback(
        (time: TimePickerValue) => {
            if (time && typeof time === 'object' && !(time instanceof Date)) {
                onChange?.(time.hours + time.minutes / 60, field);
            }
        },
        [field, onChange],
    );

    return (
        <TimeInput
            className={className}
            value={timeValue}
            valueType="object"
            maxHour={maxHour}
            clearable={false}
            showNow={false}
            disabled={disabled}
            placeholder={placeholder}
            ariaLabel={placeholder}
            onChange={timeChanged}
        />
    );
}
