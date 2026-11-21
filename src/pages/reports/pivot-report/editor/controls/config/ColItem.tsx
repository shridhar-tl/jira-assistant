import { useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { stop } from '@/utils';

import { Sortable } from '@controls';

import { removeField, updateField } from '../../../store/field-actions';
import { getGroupItem, useSelectedItemConfig } from '../../../store/pivot-config';

import { getFieldSummary } from './field-summary';
import UnavailableFieldIcon from './UnavailableFieldIcon';

const accept = ['jira-field'];
const emptyArray: any[] = [];

function cloneItem(item: any) {
    return { ...item, subItems: [...(item.subItems || [])] };
}

interface ColItemProps {
    path: string;
    item: any;
    depth: number;
    index: number;
    dragProps: any;
    removeItem: (index: number) => void;
    updateItem: (item: any, index: number) => void;
}

function ColItem({ path, item, depth, index, dragProps, removeItem, updateItem }: ColItemProps) {
    const propRef = useRef<any>(null);
    useEffect(() => {
        propRef.current = { index, item, updateItem };
    }, [index, item, updateItem]);

    const [isOpen, setIsOpen] = useState(true);
    const toggleOpen = (e: React.MouseEvent) => {
        stop(e);
        setIsOpen(!isOpen);
    };

    const addChild = useCallback(({ itemType, item: child }: any, { index: childIndex }: any) => {
        if (itemType === 'jira-field') {
            child = getGroupItem(child);
        }

        const { item, index, updateItem } = propRef.current;

        const newItem = cloneItem(item);
        newItem.subItems.splice(childIndex, 0, child);

        updateItem(newItem, index);
    }, []);

    const removeChild = useCallback((childIndex: number) => {
        const { item, index, updateItem } = propRef.current;

        const newItem = cloneItem(item);
        newItem.subItems.splice(childIndex, 1);

        updateItem(newItem, index);
        useSelectedItemConfig.setState({ itemPath: null });
    }, []);

    const handleRemoveItem = useCallback(
        (e: React.MouseEvent) => {
            stop(e);
            removeItem(propRef.current.index);
        },
        [removeItem],
    );

    const updateChild = useCallback((child: any, childIndex: number) => {
        const { item, index, updateItem } = propRef.current;

        const newItem = cloneItem(item);
        newItem.subItems[childIndex] = child;

        updateItem(newItem, index);
    }, []);

    const onSort = useCallback((subItems: any[]) => {
        const { item, index, updateItem } = propRef.current;

        updateItem({ ...item, subItems }, index);
    }, []);

    const { itemPath, selectItem } = useSelectedItemConfig();

    const itemSelected = useCallback(
        (e: React.MouseEvent) => {
            stop(e);
            selectItem(path, depth);
        },
        [path, depth, selectItem],
    );

    const isGrouped = depth === 0 || item.enableGrouping;
    const isSelected = itemPath === path;

    return (
        <div
            className={classNames(
                'mb-2 rounded-lg border bg-(--bg-primary) shadow-(--shadow-sm) transition-colors',
                isSelected
                    ? 'border-(--primary-color) ring-1 ring-(--primary-color)'
                    : 'border-(--border-primary) hover:border-(--border-hover)',
            )}
            onClick={itemSelected}
        >
            <div className="flex cursor-pointer items-center gap-2 px-2.5 py-2" ref={dragProps.dragRef}>
                <span className="fa fa-grip-vertical cursor-move text-xs text-(--text-tertiary)" title="Drag to reorder" />
                {isGrouped ? (
                    <button
                        type="button"
                        className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-(--text-secondary) hover:bg-(--bg-hover)"
                        onClick={toggleOpen}
                        title={isOpen ? 'Collapse' : 'Expand'}
                        aria-expanded={isOpen}
                    >
                        <span className={classNames('fa text-xs', isOpen ? 'fa-angle-down' : 'fa-angle-right')} />
                    </button>
                ) : (
                    <span className="fa fa-arrow-turn-up rotate-90 text-xs text-(--text-tertiary)" title="Value shown under the group" />
                )}
                <span
                    className={classNames(
                        'fa text-xs',
                        isGrouped ? 'fa-table-columns text-(--primary-color)' : 'fa-hashtag text-(--text-secondary)',
                    )}
                    title={isGrouped ? 'Values of this field are shown as columns' : 'Value field'}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--text-primary)">{item.displayText || item.name}</span>
                <UnavailableFieldIcon item={item} />
                {!!item.filter?.trim() && <span className="fa fa-filter text-xs text-(--primary-color)" title="Filter applied" />}
                <span className="shrink-0 rounded-full bg-(--bg-tertiary) px-2 py-0.5 text-[11px] font-medium text-(--text-secondary)">
                    {getFieldSummary(item, depth)}
                </span>
                <button
                    type="button"
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-(--text-tertiary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-error)"
                    onClick={handleRemoveItem}
                    title="Remove field"
                    aria-label={`Remove ${item.name}`}
                >
                    <span className="fa fa-times text-xs" />
                </button>
            </div>
            {isOpen && isGrouped && (
                <Sortable
                    showPlaceholder={true}
                    className="ml-4 border-l-2 border-(--border-primary) pb-1 pl-3 pr-2.5"
                    provideDragRef
                    items={item.subItems || emptyArray}
                    accept={accept}
                    itemType="col-sub-group"
                    onDrop={addChild}
                    onChange={onSort}
                    placeholder={
                        <div className="mb-2 rounded-md border border-dashed border-(--border-primary) px-3 py-2 text-xs text-(--text-tertiary)">
                            Drop a field here to show its value (or a sub group) under {item.name}
                        </div>
                    }
                >
                    {(child: any, childIndex: number, { draggable }: any) => (
                        <ColItem
                            path={`${path}.subItems.${childIndex}`}
                            key={childIndex}
                            index={childIndex}
                            depth={depth + 1}
                            item={child}
                            dragProps={draggable}
                            removeItem={removeChild}
                            updateItem={updateChild}
                        />
                    )}
                </Sortable>
            )}
        </div>
    );
}

interface ColConfigItemProps extends Omit<ColItemProps, 'removeItem' | 'updateItem'> {}

export default function ColConfigItem(props: ColConfigItemProps) {
    return <ColItem {...props} removeItem={removeField} updateItem={updateField} />;
}
