import React, { useCallback, useMemo } from 'react';

import classNames from 'classnames';
import { addDays, isValid, parseISO, set } from 'date-fns';

import { Button, DateRangePicker, TimePicker, type DateSelectedCallbackArg, type TimePickerValue } from '@components';

interface DateTimePickerProps {
    value?: Date | string;
    onChange?: (date: Date) => void;
    onClear?: () => void;
    showTime?: boolean;
    showDayStepper?: boolean;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
}

function toDate(value: Date | string | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }
    const date = value instanceof Date ? value : parseISO(value);
    return isValid(date) ? date : undefined;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    value,
    onChange,
    onClear,
    showTime = false,
    showDayStepper = false,
    className = '',
    disabled = false,
    placeholder = 'Select date',
}) => {
    const currentDate = useMemo(() => toDate(value), [value]);

    const dateSelected = useCallback(
        ({ value: [day] }: DateSelectedCallbackArg) => {
            const time = showTime && currentDate ? currentDate : day;
            onChange?.(set(day, { hours: time.getHours(), minutes: time.getMinutes(), seconds: 0, milliseconds: 0 }));
        },
        [currentDate, onChange, showTime],
    );

    const timeSelected = useCallback(
        (time: TimePickerValue) => {
            if (!(time instanceof Date)) {
                return;
            }
            onChange?.(set(currentDate ?? new Date(), { hours: time.getHours(), minutes: time.getMinutes(), seconds: 0, milliseconds: 0 }));
        },
        [currentDate, onChange],
    );

    const stepDay = useCallback(
        (days: number) => {
            if (currentDate) {
                onChange?.(addDays(currentDate, days));
            }
        },
        [currentDate, onChange],
    );

    const stepDisabled = disabled || !currentDate;

    return (
        <div className={classNames('date-time-picker inline-flex items-center gap-1', className)}>
            {showDayStepper && (
                <Button
                    layout="plain"
                    size="sm"
                    disabled={stepDisabled}
                    onClick={() => stepDay(-1)}
                    title="Previous day"
                    ariaLabel="Previous day"
                >
                    <i className="fa fa-chevron-left" />
                </Button>
            )}
            <DateRangePicker
                className="flex-1 min-w-32"
                range={false}
                value={currentDate}
                dateFormat="dd MMM yyyy"
                placeholder={placeholder}
                ariaLabel={placeholder}
                disabled={disabled}
                onChange={dateSelected}
                onClear={onClear}
            />
            {showTime && (
                <TimePicker
                    className="w-28 shrink-0"
                    value={currentDate ?? null}
                    valueType="date"
                    clearable={false}
                    disabled={disabled}
                    ariaLabel="Time"
                    onChange={timeSelected}
                />
            )}
            {showDayStepper && (
                <Button layout="plain" size="sm" disabled={stepDisabled} onClick={() => stepDay(1)} title="Next day" ariaLabel="Next day">
                    <i className="fa fa-chevron-right" />
                </Button>
            )}
        </div>
    );
};

export default DateTimePicker;
