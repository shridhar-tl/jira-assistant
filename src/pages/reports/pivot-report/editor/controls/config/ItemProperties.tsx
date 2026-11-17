import classNames from 'classnames';

import { Button, Checkbox, SelectButton, TextInput } from '@components';
import type { ComponentEvent } from '@components';

import { updateItemByPath } from '../../../store/pivot-config';
import { getDefaultHeaderText } from '../../../utils/format-functions';
import { getFieldType } from '../../../viewer/common-utils';

import displayOptionComponent from './display-options';
import QueryFilter from './filter-options/QueryFilter';
import PropertyRow from './PropertyRow';

interface ItemPropertiesProps {
    selection: any;
}

const totalPositionOptions = [
    { value: 'start', label: 'At start' },
    { value: 'end', label: 'At end' },
];

function getPlacementLabel(isRow: boolean, level: number, isGrouped: boolean) {
    if (isRow) {
        return isGrouped ? 'Row group' : 'Row value';
    }

    if (!level) {
        return 'Column group';
    }

    return isGrouped ? 'Column sub group' : 'Column value';
}

export default function ItemProperties({ selection }: ItemPropertiesProps) {
    const { itemPath, item, isRow, level, selectItem } = selection;

    if (!item) {
        return null;
    }

    const clearSelection = () => selectItem();
    const isGrouped = item.enableGrouping || (!isRow && level === 0);
    const DisplayOption = displayOptionComponent[item.schema?.type] || displayOptionComponent['any'];

    const update = (changes: object) => {
        updateItemByPath({ ...item, ...changes }, null, { args: { itemPath, isRow } });
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b border-(--border-primary) bg-(--bg-secondary) px-4 py-2">
                <span
                    className={classNames(
                        'fa flex size-8 shrink-0 items-center justify-center rounded-md bg-(--bg-primary) text-(--primary-color)',
                        isRow ? 'fa-table-list' : 'fa-table-columns',
                    )}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                    <h3 className="truncate text-sm font-semibold text-(--text-primary)">{item.name}</h3>
                    <span className="truncate text-xs text-(--text-secondary)">
                        {getPlacementLabel(!!isRow, level, isGrouped)} · {getFieldType(item) || 'unknown'} field
                    </span>
                </div>
                <Button
                    layout="plain"
                    leftIcon={<span className="fa fa-times" />}
                    onClick={clearSelection}
                    title="Close field properties"
                />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 sm:col-span-2">
                        {!level && (
                            <Checkbox
                                checked={!!item.colGroup}
                                onChange={({ value }: ComponentEvent<boolean>) => update({ colGroup: value })}
                                label="Show values of this field as columns (pivot)"
                            />
                        )}
                        {(isRow || !!level) && (
                            <Checkbox
                                checked={!!item.enableGrouping}
                                onChange={({ value }: ComponentEvent<boolean>) => update({ enableGrouping: value })}
                                label="Group the issues by this field"
                            />
                        )}
                    </div>

                    {(isRow || !isGrouped) && (
                        <PropertyRow label="Header text">
                            <TextInput
                                value={item.headerText || ''}
                                onChange={({ value }: ComponentEvent<string>) => update({ headerText: value })}
                                maxLength={35}
                                placeholder={getDefaultHeaderText(item)}
                            />
                        </PropertyRow>
                    )}

                    {DisplayOption && <DisplayOption item={item} isGrouped={isGrouped} isRow={isRow} />}

                    {isGrouped && !isRow && (
                        <PropertyRow label="Totals" className="sm:col-span-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <Checkbox
                                    checked={!!item.showTotal}
                                    onChange={({ value }: ComponentEvent<boolean>) => update({ showTotal: value })}
                                    label="Show total column"
                                />
                                {item.showTotal && (
                                    <SelectButton
                                        items={totalPositionOptions}
                                        value={item.showTotalFirst ? 'start' : 'end'}
                                        onChange={({ value }: ComponentEvent<string>) => update({ showTotalFirst: value === 'start' })}
                                        variant="segmented"
                                        required
                                        ariaLabel="Position of total column"
                                    />
                                )}
                            </div>
                        </PropertyRow>
                    )}

                    {isGrouped && <QueryFilter filterText={item.filter} item={item} isRow={isRow} />}
                </div>
            </div>
        </div>
    );
}
