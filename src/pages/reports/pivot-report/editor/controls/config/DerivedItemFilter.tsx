import { useEffect, useState } from 'react';

import { Multiselect } from '@components';
import type { ComponentEvent } from '@components';

import type { DerivedItemFilter as DerivedItemFilterConfig, DerivedItemFilterOption } from '../../../utils/derived-sources';

import PropertyRow from './PropertyRow';

interface DerivedItemFilterProps {
    itemFilter: DerivedItemFilterConfig;
    values?: string[];
    onChange: (values: string[]) => void;
}

export default function DerivedItemFilter({ itemFilter, values, onChange }: DerivedItemFilterProps) {
    const [options, setOptions] = useState<DerivedItemFilterOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        itemFilter
            .loadOptions()
            .then((loaded) => isActive && setOptions(loaded))
            .catch((err: unknown) => console.error(`Unable to load options for ${itemFilter.label}`, err))
            .finally(() => isActive && setIsLoading(false));

        return () => {
            isActive = false;
        };
    }, [itemFilter]);

    const availableOptions = values?.length
        ? [...options, ...values.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ label: v, value: v }))]
        : options;

    return (
        <PropertyRow label={itemFilter.label} helpText={itemFilter.helpText} className="sm:col-span-2">
            <Multiselect
                options={availableOptions}
                value={values || []}
                onChange={(e: ComponentEvent<unknown>) => onChange((e.value as string[]) || [])}
                placeholder={isLoading ? 'Loading...' : itemFilter.placeholder}
                disabled={isLoading}
                searchable
                maxVisibleChips={3}
                ariaLabel={itemFilter.label}
            />
        </PropertyRow>
    );
}
