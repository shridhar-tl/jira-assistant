import { useMemo } from 'react';

import { DateRangePicker, Dropdown, SelectButton, TextInput } from '@components';
import type { ComponentEvent } from '@components';

import { updateItemByPath, useSelectedItemConfig } from '../../../../store/pivot-config';
import { fromPickerValue, toPickerValue } from '../../../../utils/date-range';
import { useFieldsList } from '../../../../utils/fields';
import PropertyRow from '../PropertyRow';

const rangeType = [
    { value: 'days', label: 'Days grouped by week' },
    { value: 'week', label: 'Weeks grouped by month' },
];

const filterFieldHelpText = 'Issues (or its worklogs, comments etc.) are shown under the date matching the value of this field.';
const parameterHelpText = 'Name of the parameter asked while generating the report. Use the same name in JQL as worklogDate >= startDate(parameters(\'Period\')) to pull only the issues of these dates.';
const defaultParameterName = 'Period';

const rangeSourceOptions = [
    { value: 'fixed', label: 'Fixed dates' },
    { value: 'parameter', label: 'Ask while generating' },
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
            fields
                .map(({ label, items }) => ({
                    label,
                    items: items
                        .filter((f) => f.schema?.type?.startsWith('date') && f.schema?.type !== 'date-range')
                        .map((f) => ({ value: f.key, label: f.name })),
                }))
                .filter(({ items }) => items.length),
        [fields],
    );

    const handleFieldChange = (field: string, value: unknown) => {
        updateItemByPath({ ...item, [field]: value }, null, { args: { itemPath, isRow } });
    };

    const isParameter = item.dateRangeParameter !== undefined;

    const handleSourceChange = (source: string) => {
        const { dateRangeParameter: _, ...rest } = item;
        const updated = source === 'parameter' ? { ...rest, dateRangeParameter: defaultParameterName } : rest;

        updateItemByPath(updated, null, { args: { itemPath, isRow } });
    };

    return (
        <>
            <PropertyRow label="Dates" className="sm:col-span-2">
                <SelectButton
                    items={rangeSourceOptions}
                    value={isParameter ? 'parameter' : 'fixed'}
                    onChange={(e) => handleSourceChange(e.value)}
                    variant="segmented"
                    required
                    ariaLabel="Dates of the range"
                />
            </PropertyRow>
            {isParameter ? (
                <PropertyRow label="Parameter name" helpText={parameterHelpText} className="sm:col-span-2">
                    <TextInput
                        value={item.dateRangeParameter}
                        onChange={(e) => handleFieldChange('dateRangeParameter', e.value)}
                        maxLength={25}
                        placeholder={defaultParameterName}
                    />
                </PropertyRow>
            ) : (
                <PropertyRow label="Date range">
                    <DateRangePicker
                        value={toPickerValue(item.dateRange)}
                        placeholder="Select the dates"
                        onChange={(e) => handleFieldChange('dateRange', fromPickerValue(e))}
                    />
                </PropertyRow>
            )}
            {!isRow && (
                <PropertyRow label="Show columns as">
                    <Dropdown
                        value={item.rangeType || 'days'}
                        onChange={(e: ComponentEvent<string>) => handleFieldChange('rangeType', e.value)}
                        options={rangeType}
                    />
                </PropertyRow>
            )}
            <PropertyRow label="Date field to match" helpText={filterFieldHelpText} className="sm:col-span-2">
                <Dropdown
                    value={item.filterField}
                    onChange={(e: ComponentEvent<string>) => handleFieldChange('filterField', e.value)}
                    options={dateFields}
                    placeholder="Select a date field"
                    searchable
                />
            </PropertyRow>
        </>
    );
}
