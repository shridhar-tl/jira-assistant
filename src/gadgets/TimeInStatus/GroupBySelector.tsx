import { memo, useEffect, useState } from 'react';

import { Dropdown } from '@components';

import { builtInGroupByOptions } from './constants';
import { getGroupByOptions } from './data-loader';
import type { GroupByOptionGroup } from './types';

interface GroupBySelectorProps {
    value: string;
    onChange: (groupBy: string) => void;
    className?: string;
}

const initialOptions: GroupByOptionGroup[] = [{ label: 'Common', items: builtInGroupByOptions.map(({ value, label }) => ({ value, label })) }];

function GroupBySelector({ value, onChange, className }: GroupBySelectorProps) {
    const [options, setOptions] = useState<GroupByOptionGroup[]>(initialOptions);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getGroupByOptions()
            .then(setOptions)
            .catch((err: unknown) => console.error('Failed to load the fields for grouping:', err))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className={className}>
            <Dropdown
                options={options}
                value={value}
                onChange={(e) => onChange((e.value as string) || 'none')}
                loading={isLoading}
                searchable
                placeholder="Group by"
                ariaLabel="Group by"
            />
        </div>
    );
}

export default memo(GroupBySelector);
