import { useCallback, useMemo, useRef, useState } from 'react';

import { AutocompleteMulti } from '@components';
import type { ComponentEvent } from '@components';

import type { ParameterOption } from '../../../types';

import type { OptionsLoader } from './parameter-options';

interface ParameterOptionsPickerProps {
    value?: ParameterOption[];
    onChange: (value: ParameterOption[]) => void;
    loadOptions: OptionsLoader;
    multiple?: boolean;
    placeholder?: string;
}

type OptionValue = ParameterOption['value'];

export default function ParameterOptionsPicker({ value, onChange, loadOptions, multiple, placeholder }: ParameterOptionsPickerProps) {
    const [options, setOptions] = useState<ParameterOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const requestIdRef = useRef(0);
    const selected = useMemo(() => value || [], [value]);

    const search = useCallback(
        async (query: string) => {
            const requestId = ++requestIdRef.current;
            setIsLoading(true);

            try {
                const result = await loadOptions(query);
                if (requestId === requestIdRef.current) {
                    setOptions(result);
                }
            } catch (err) {
                console.error('Unable to load the values for report parameter', err);
                if (requestId === requestIdRef.current) {
                    setOptions([]);
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsLoading(false);
                }
            }
        },
        [loadOptions],
    );

    const optionsMap = useMemo(() => new Map<OptionValue, ParameterOption>([...selected, ...options].map((o) => [o.value, o])), [selected, options]);
    const items = useMemo(() => options.map(toListItem), [options]);
    const selectedItems = useMemo(() => selected.map(toListItem), [selected]);
    const selectedValues = useMemo(() => selected.map((o) => o.value), [selected]);

    const handleChange = useCallback(
        ({ value: values }: ComponentEvent<OptionValue[]>) => {
            const newSelection = (values || []).map((v) => optionsMap.get(v)).filter((o): o is ParameterOption => !!o);

            if (multiple) {
                onChange(newSelection);
                return;
            }

            const added = newSelection.filter((o) => !selectedValues.includes(o.value));
            onChange(added.length ? added.slice(-1) : newSelection.slice(-1));
        },
        [optionsMap, multiple, onChange, selectedValues],
    );

    return (
        <AutocompleteMulti
            items={items}
            value={selectedValues}
            selectedItems={selectedItems}
            onChange={handleChange}
            onFilter={search}
            minLength={0}
            loading={isLoading}
            placeholder={placeholder}
            emptyMessage="No matching values found"
        />
    );
}

function toListItem(option: ParameterOption) {
    return { value: option.value, label: <OptionLabel option={option} /> };
}

function OptionLabel({ option: { label, iconUrl } }: { option: ParameterOption }) {
    return (
        <span className="inline-flex min-w-0 items-center gap-1.5">
            {iconUrl && <img src={iconUrl} alt="" className="h-4 w-4 shrink-0 rounded-sm" />}
            <span className="truncate">{label}</span>
        </span>
    );
}
