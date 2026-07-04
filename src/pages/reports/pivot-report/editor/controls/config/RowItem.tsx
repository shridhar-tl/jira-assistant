import { useCallback } from 'react';

import classNames from 'classnames';

import { removeField } from '../../../store/field-actions';
import { useSelectedItemConfig } from '../../../store/pivot-config';

interface RowConfigItemProps {
    item: any;
    index: number;
    depth: number;
    dragProps: any;
}

export default function RowConfigItem({ item, index, depth, dragProps }: RowConfigItemProps) {
    const removeItem = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            removeField(index);
        },
        [index],
    );

    const { itemPath, selectItem } = useSelectedItemConfig();

    const itemSelected = useCallback(() => selectItem(`fields.${index}`, depth), [index, depth, selectItem]);

    const currentPath = `fields.${index}`;
    const isSelected = itemPath === currentPath;

    return (
        <div
            className={classNames(
                'border border-[--border-primary] rounded mb-2 transition-colors cursor-pointer',
                isSelected && 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
            )}
            onClick={itemSelected}
        >
            <div className="flex items-center gap-2 p-3" ref={dragProps.dragRef}>
                <span className="fa-solid fa-up-down-left-right text-[--text-tertiary] cursor-move" />
                <span className="flex-1 text-sm font-medium">{item.displayText || item.name}</span>
                <button className="text-red-500 hover:text-red-700 transition-colors" onClick={removeItem} title="Remove field">
                    <span className="fa fa-times" />
                </button>
            </div>
        </div>
    );
}
