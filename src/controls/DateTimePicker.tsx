import React, { useMemo, useState } from 'react';

import { format, isValid, parse, parseISO } from 'date-fns';

interface DateTimePickerProps {
    value?: Date | string;
    onChange?: (date: Date) => void;
    onClear?: () => void;
    showTime?: boolean;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
}

function toInputValue(value: Date | string | undefined, formatString: string): string {
    if (!value) {
        return '';
    }
    const date = value instanceof Date ? value : parseISO(value);
    return isValid(date) ? format(date, formatString) : '';
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    value,
    onChange,
    onClear,
    showTime = false,
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

    return (
        <input
            type={showTime ? 'datetime-local' : 'date'}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${className}`}
        />
    );
};

export default DateTimePicker;
