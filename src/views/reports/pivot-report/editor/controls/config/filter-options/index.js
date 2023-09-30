import React from 'react';
import { Button } from 'react-controls/controls';
import { FormCheckbox, FormSelectBox } from 'react-controls/controls/form';
import { useUpdate } from 'react-controls/controls/form/Form';
import { useFieldsList } from 'src/views/reports/pivot-report/utils/fields';
//https://www.npmjs.com/package/sql-where-parser
function FilterOptions({ filters }) {
    const fields = useFieldsList(({ fields }) => fields);
    const updateItem = useUpdate();

    const addFilter = React.useCallback(() => {
        if (filters) {
            updateItem([...filters, {}], 'filters');
        } else {
            updateItem([{}], 'filters');
        }
    }, [filters, updateItem]);

    const removeFilter = React.useCallback(index => {
        const newFilters = [...filters];
        newFilters.splice(index, 1);

        updateItem(newFilters, 'filters');
    }, [filters, updateItem]);

    return (<div className="filter-options">
        <table className="scroll-table table-bordered w-100">
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Comparer</th>
                    <th>Manual</th>
                    <th>Value</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {filters?.map((filter, i) => <FilterOption key={i} filter={filter} fields={fields} index={i} onRemove={removeFilter} />)}
            </tbody>
            <tfoot>
                <tr>
                    <th><Button text icon="fa fa-plus" onClick={addFilter} label="Add filter" /></th>
                </tr>
            </tfoot>
        </table>
    </div>);
}

export default FilterOptions;


function FilterOption({ filter, fields, index, onRemove }) {
    const handleRemove = React.useCallback(() => onRemove(index), [index, onRemove]);

    return (<tr className="filter">
        <td>
            <FormSelectBox
                field={`filters.${index}.field`}
                dataset={fields}
                valueField="id"
                optionLabel="name"
                optionGroupLabel="label"
                optionGroupChildren="items"
                filter
                grouped
            />
        </td>
        <td><FormSelectBox field={`filters.${index}.comparer`}
            dataset={comparerList} autoSelect /></td>
        <td><FormCheckbox field={`filters.${index}.manual`} /></td>
        <td>
            {filter.manual && <FormSelectBox field={`filters.${index}.value`} dataset={comparerList} />}
            {!filter.manual && <FormSelectBox
                field={`filters.${index}.valueField`}
                dataset={fields}
                valueField="id"
                optionLabel="name"
                optionGroupLabel="label"
                optionGroupChildren="items"
                filter
                grouped
            />}
        </td>
        <td><Button icon="fa fa-trash" onClick={handleRemove} /></td>
    </tr>);
}

const comparerList = [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '()', label: 'In' },
    { value: '!()', label: 'Not In' },
    { value: '(~)', label: 'Contains' },
    { value: '!(~)', label: 'Not Contains' },
    { value: '>', label: 'Greater' },
    { value: '<>>', label: 'Lesser' },
    { value: '>', label: 'Greater/Equals' },
    { value: '<>>', label: 'Lesser/Equals' },
];