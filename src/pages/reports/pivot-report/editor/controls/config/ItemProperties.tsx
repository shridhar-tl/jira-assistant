import { Button, Checkbox, TextInput } from '@components';

import { updateItemByPath } from '../../../store/pivot-config';

import displayOptionComponent from './display-options';
import QueryFilter from './filter-options/QueryFilter';

interface ItemPropertiesProps {
    selection: any;
}

export default function ItemProperties({ selection }: ItemPropertiesProps) {
    const { itemPath, item, isRow, level, selectItem } = selection;

    const clearSelection = () => selectItem();

    if (!item) {
        return null;
    }

    const isGrouped = item.enableGrouping || (!isRow && level === 0);
    const DisplayOption = displayOptionComponent[item.schema?.type] || displayOptionComponent['any'];

    const update = (changes: object) => {
        updateItemByPath({ ...item, ...changes }, null, { args: { itemPath, isRow } });
    };

    return (
        <div className="h-full overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Field Properties</h3>
                <Button leftIcon={<span className="fa fa-times" />} onClick={clearSelection} />
            </div>

            <div className="mb-3">
                <label className="text-sm font-medium">Field name:</label>
                <div className="mt-1 text-sm text-[--text-secondary]">{item.name}</div>
            </div>

            <div className="space-y-4">
                {!level && (
                    <Checkbox
                        checked={item.colGroup}
                        onChange={({ value }: any) => update({ colGroup: value })}
                        label="Make this a column group field"
                    />
                )}
                {(isRow || !!level) && (
                    <Checkbox
                        checked={item.enableGrouping}
                        onChange={({ value }: any) => update({ enableGrouping: value })}
                        label="Enable grouping"
                    />
                )}
                {(isRow || !isGrouped) && (
                    <div>
                        <label className="text-sm font-medium">Header text</label>
                        <TextInput
                            value={item.headerText}
                            onChange={({ value }: any) => update({ headerText: value })}
                            maxLength={35}
                            placeholder={item.name || 'Custom header text for column'}
                            className="mt-1"
                        />
                    </div>
                )}

                {isGrouped && (
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={item.showTotal}
                            onChange={({ value }: any) => update({ showTotal: value })}
                            label="Show totals"
                        />
                        <Button
                            className="ml-auto"
                            disabled={!item.showTotal}
                            onClick={() => update({ showTotalFirst: !item.showTotalFirst })}
                            title="Toggle totals position"
                        >
                            {item.showTotalFirst ? 'At start' : 'At end'}
                        </Button>
                    </div>
                )}

                {DisplayOption && <DisplayOption item={item} isGrouped={isGrouped} isRow={isRow} />}

                {isGrouped && <QueryFilter filterText={item.filter} item={item} isRow={isRow} />}
            </div>
        </div>
    );
}
