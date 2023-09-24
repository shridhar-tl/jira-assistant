import React from 'react';
import { Form, FormCheckbox, FormTextBox, FormToggleButton } from 'react-controls/controls/form';
import { Button } from 'src/controls';
import { updateItemByPath } from '../../../store/pivot-config';
import displayOptionComponent from './display-options';
import QueryFilter from './filter-options/QueryFilter';
import './ItemProperties.scss';

function ItemProperties({ selection }) {
    const { itemPath, item, isRow, level, selectItem } = selection;

    const clearSelection = React.useCallback(() => selectItem(), [selectItem]);

    if (!item) {
        return null;
    }

    const isGrouped = item.enableGrouping || (!isRow && level === 0);
    const DisplayOption = displayOptionComponent[item.schema.type] || displayOptionComponent['any'];

    return (<div className="item-properties">
        <Button icon="fa fa-times" className="float-end" onClick={clearSelection} />
        <div className="label-value-pair">
            <label>Field name:</label><span className="prop-value">{item.name}</span>
        </div>
        <Form value={item} onChange={updateItemByPath} args={{ itemPath, isRow }}>
            <div className="config-props">
                {!level && <FormCheckbox field="colGroup" label="Make this a column group field" />}
                {(isRow || !!level) && <FormCheckbox label="Enable grouping" field="enableGrouping" />}
                {(isRow || !isGrouped) && <div className="label-value-pair">
                    <label>Header text</label> <FormTextBox field="headerText" maxLength={35}
                        placeholder={item.name || 'Custom header text for column'} />
                </div>}

                {isGrouped && <FormCheckbox className="inline-block" label="Show totals" field="showTotal" />}
                {isGrouped && <FormToggleButton className="inline-block btn-sm float-end" onLabel="At beginning"
                    offLabel="At end" field="showTotalAtBeginning" disabled={!item.showTotal} />}

                {DisplayOption && <DisplayOption item={item} isGrouped={isGrouped} isRow={isRow} />}

                {isGrouped && <QueryFilter filterText={item.filter} />}
            </div>
        </Form>
    </div>);
}

export default ItemProperties;
