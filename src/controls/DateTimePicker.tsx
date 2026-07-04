import React from 'react';

import { format, parse } from 'date-fns';

interface DateTimePickerProps {
    value?: Date | string;
    onChange?: (date: Date) => void;
    showTime?: boolean;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
    value,
    onChange,
    showTime = false,
    className = '',
    disabled = false,
    placeholder = 'Select date',
}) => {
    const formatString = showTime ? 'yyyy-MM-dd\'T\'HH:mm' : 'yyyy-MM-dd';
    const displayFormat = showTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';

    const getFormattedValue = (): string => {
        if (!value) return '';

        try {
            const dateObj = value instanceof Date ? value : new Date(value);
            if (isNaN(dateObj.getTime())) return '';
            return format(dateObj, formatString);
        } catch {
            return '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (!newValue) {
            onChange?.(new Date());
            return;
        }

        try {
            const parsedDate = parse(newValue, formatString, new Date());
            if (!isNaN(parsedDate.getTime())) {
                onChange?.(parsedDate);
            }
        } catch (error) {
            console.error('Error parsing date:', error);
        }
    };

    return (
        <input
            type={showTime ? 'datetime-local' : 'date'}
            value={getFormattedValue()}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${className}`}
        />
    );
};

export default DateTimePicker;
