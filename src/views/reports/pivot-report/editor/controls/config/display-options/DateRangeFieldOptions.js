import React from 'react';
import { FormDatePicker, FormSelectBox } from 'react-controls/controls/form';
import { useFieldsList } from 'src/views/reports/pivot-report/utils/fields';

const rangeType = [
    { value: 'days', label: 'Days with Week' },
    { value: 'week', label: 'Week with Month' },
];

function DateRangeFieldOptions({ isRow }) {
    const fields = useFieldsList(({ fields }) => fields);
    const dateFields = React.useMemo(() => fields.map(({ label, items }) => ({
        label,
        items: items.filter(f => f.schema?.type?.startsWith('date') && f.schema?.type !== 'date-range')
    })), [fields]);

    return (<div className="display-options">
        <div className="label-value-pair">
            <label>Date Range:</label>
            <span className="prop-value">
                <FormDatePicker field="dateRange" range />
            </span>
        </div>
        {!isRow && <div className="label-value-pair">
            <label>Range Type:</label>
            <span className="prop-value">
                <FormSelectBox field="rangeType" dataset={rangeType} autoSelect />
            </span>
        </div>}
        <div className="label-value-pair">
            <label>Filter issues with:</label>
            <span className="prop-value">
                <FormSelectBox
                    field="filterField"
                    dataset={dateFields}
                    valueField="key"
                    optionLabel="name"
                    optionGroupLabel="label"
                    optionGroupChildren="items"
                    filter
                    grouped
                />
            </span>
        </div>
    </div>);
}

export default DateRangeFieldOptions;
