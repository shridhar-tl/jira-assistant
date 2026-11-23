import React, { useCallback } from 'react';

import classNames from 'classnames';

import { Chips, type ComponentEvent } from '@components';

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
    const valuesChanged = useCallback(
        (e: ComponentEvent<string[]>) => {
            const values = e.value
                .map((item) => item.trim())
                .filter((item) => item.length >= minItemLength)
                .map((item) => (useUpperCase ? item.toUpperCase() : item));
            onChange?.(values);
        },
        [minItemLength, onChange, useUpperCase],
    );

    return (
        <Chips
            className={classNames('multi-value-text w-full', className)}
            value={value}
            onChange={valuesChanged}
            placeholder={placeholder}
            disabled={disabled}
            allowDuplicates
            commitOnTab
        />
    );
};

export default MultiValueText;
