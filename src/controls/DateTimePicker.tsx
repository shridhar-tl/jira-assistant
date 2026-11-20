import React, { useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';
import { addDays, format, isValid, parse, parseISO } from 'date-fns';

import { Button } from '@components';

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

const inputClassName =
    'px-3 py-2 border border-(--border-color) rounded-md bg-(--bg-primary) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

function toDate(value: Date | string | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }
    const date = value instanceof Date ? value : parseISO(value);
    return isValid(date) ? date : undefined;
}

function toInputValue(value: Date | string | undefined, formatString: string): string {
    const date = toDate(value);
    return date ? format(date, formatString) : '';
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
    const formatString = showTime ? 'yyyy-MM-dd\'T\'HH:mm' : 'yyyy-MM-dd';
    const formatted = useMemo(() => toInputValue(value, formatString), [value, formatString]);
    const [text, setText] = useState(formatted);
    const [shownValue, setShownValue] = useState(formatted);

    if (shownValue !== formatted) {
        setShownValue(formatted);
        setText(formatted);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setText(newValue);
        if (!newValue) {
            return;
        }
        const parsedDate = parse(newValue, formatString, new Date());
        if (isValid(parsedDate)) {
            onChange?.(parsedDate);
        }
    };

    const handleBlur = () => {
        if (text) {
            return;
        }
        if (onClear) {
            onClear();
        } else {
            setText(formatted);
        }
    };

    const currentDate = useMemo(() => toDate(value), [value]);

    const stepDay = useCallback(
        (days: number) => {
            if (currentDate) {
                onChange?.(addDays(currentDate, days));
            }
        },
        [currentDate, onChange],
    );

    const input = (
        <input
            type={showTime ? 'datetime-local' : 'date'}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={classNames(inputClassName, showDayStepper ? 'flex-1 min-w-0' : className)}
        />
    );

    if (!showDayStepper) {
        return input;
    }

    const stepDisabled = disabled || !currentDate;

    return (
        <div className={classNames('flex items-center gap-1', className)}>
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
            {input}
            <Button layout="plain" size="sm" disabled={stepDisabled} onClick={() => stepDay(1)} title="Next day" ariaLabel="Next day">
                <i className="fa fa-chevron-right" />
            </Button>
        </div>
    );
};

export default DateTimePicker;
