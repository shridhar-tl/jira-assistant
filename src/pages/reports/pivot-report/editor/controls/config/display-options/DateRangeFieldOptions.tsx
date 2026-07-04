import { useMemo } from 'react';

import { DateRangePicker, Dropdown } from '@components';
import type { ComponentEvent } from '@components';

import { updateItemByPath, useSelectedItemConfig } from '../../../../store/pivot-config';
import { useFieldsList } from '../../../../utils/fields';

const rangeType = [
    { value: 'days', label: 'Days with Week' },
    { value: 'week', label: 'Week with Month' },
];

interface DateRangeFieldOptionsProps {
    item: any;
    isRow?: boolean;
}

export default function DateRangeFieldOptions({ item, isRow }: DateRangeFieldOptionsProps) {
    const { itemPath } = useSelectedItemConfig();
    const fields = useFieldsList(({ fields }) => fields);
    const dateFields = useMemo(
        () =>
            fields.map(({ label, items }) => ({
                label,
                items: items
                    .filter((f) => f.schema?.type?.startsWith('date') && f.schema?.type !== 'date-range')
                    .map((f) => ({ value: f.key, label: f.name })),
            })),
        [fields],
    );

    const handleFieldChange = (field: string, value: any) => {
        updateItemByPath({ ...item, [field]: value }, null, { args: { itemPath, isRow } });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium min-w-24">Date Range:</label>
                <div className="flex-1">
                    <DateRangePicker value={item.dateRange} onChange={(e: any) => handleFieldChange('dateRange', e.value)} />
                </div>
            </div>
            {!isRow && (
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium min-w-24">Range Type:</label>
                    <div className="flex-1">
                        <Dropdown value={item.rangeType} onChange={(e: ComponentEvent<string>) => handleFieldChange('rangeType', e.value)} options={rangeType} />
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium min-w-24">Filter issues with:</label>
                <div className="flex-1">
                    <Dropdown
                        value={item.filterField}
                        onChange={(e: ComponentEvent<string>) => handleFieldChange('filterField', e.value)}
                        options={dateFields}
                    />
                </div>
            </div>
        </div>
    );
}
