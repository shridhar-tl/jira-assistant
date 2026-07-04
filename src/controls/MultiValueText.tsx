import React, { useState, KeyboardEvent, ChangeEvent } from 'react';

import { TextInput, Button } from '@components';

interface MultiValueTextProps {
    value?: string[];
    onChange?: (values: string[]) => void;
    className?: string;
    minItemLength?: number;
    useUpperCase?: boolean;
    placeholder?: string;
    disabled?: boolean;
}

export const MultiValueText: React.FC<MultiValueTextProps> = ({
    value = [],
    onChange,
    className = '',
    minItemLength = 1,
    useUpperCase = false,
    placeholder = 'Enter value and press Enter',
    disabled = false,
}) => {
    const [inputValue, setInputValue] = useState('');

    const addItem = (itemToAdd: string) => {
        const trimmedItem = itemToAdd.trim();
        if (trimmedItem.length >= minItemLength) {
            const finalValue = useUpperCase ? trimmedItem.toUpperCase() : trimmedItem;
            const newValues = [...value, finalValue];
            onChange?.(newValues);
            setInputValue('');
        }
    };

    const removeItem = (index: number) => {
        const newValues = value.filter((_, i) => i !== index);
        onChange?.(newValues);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            removeItem(value.length - 1);
        }
    };

    const handleInputChange = (newValue: string) => {
        setInputValue(useUpperCase ? newValue.toUpperCase() : newValue);
    };

    return (
        <div className={`multi-value-text ${className}`}>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[42px] bg-white dark:bg-gray-800 dark:border-gray-600">
                {value.map((item, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                    >
                        {item}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none"
                            >
                                <i className="fa fa-times text-xs" />
                            </button>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e: any) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={value.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-[120px] outline-none bg-transparent text-gray-900 dark:text-gray-100"
                        disabled={disabled}
                    />
                )}
            </div>
        </div>
    );
};

export default MultiValueText;
