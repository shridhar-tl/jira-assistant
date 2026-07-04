import { useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { stop } from '@/utils';

import { Sortable } from '@controls';

import { removeField, updateField } from '../../../store/field-actions';
import { getGroupItem, useSelectedItemConfig } from '../../../store/pivot-config';

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
    const toggleOpen = () => setIsOpen(!isOpen);

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
    const iconClassName = classNames('fa', {
        'cursor-pointer': isGrouped,
        'fa-angle-down': isGrouped && isOpen,
        'fa-angle-right': isGrouped && !isOpen,
        'fa-arrow-right': !isGrouped,
    });

    const isSelected = itemPath === path;

    return (
        <div
            className={classNames(
                'border border-[--border-primary] rounded mb-2 transition-colors',
                isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
            )}
            onClick={itemSelected}
        >
            <div className="flex items-center gap-2 p-3 cursor-pointer" ref={dragProps.dragRef}>
                {isGrouped && (
                    <button className="text-blue-600 hover:text-blue-800 transition-colors" title="This field would be pivoted as column">
                        <span className="fa-solid fa-table-columns" />
                    </button>
                )}
                <span className={iconClassName} onClick={isGrouped ? toggleOpen : undefined} />
                <span className="flex-1 text-sm font-medium">{item.displayText || item.name}</span>
                <button className="text-red-500 hover:text-red-700 transition-colors" onClick={handleRemoveItem} title="Remove field">
                    <span className="fa fa-times" />
                </button>
            </div>
            {isOpen && isGrouped && (
                <Sortable
                    showPlaceholder={true}
                    className="px-3 pb-3"
                    provideDragRef
                    items={item.subItems || emptyArray}
                    accept={accept}
                    itemType="col-sub-group"
                    onDrop={addChild}
                    onChange={onSort}
                    placeholder={
                        <div className="text-sm text-[--text-tertiary] p-2 border border-dashed border-[--border-primary] rounded">
                            Drag and drop sub group or value field for {item.name}
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
