import { useCallback } from 'react';

import classNames from 'classnames';

import { removeField } from '../../../store/field-actions';
import { useSelectedItemConfig } from '../../../store/pivot-config';

import { getFieldSummary } from './field-summary';

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

    const isSelected = itemPath === `fields.${index}`;

    return (
        <div
            className={classNames(
                'mb-2 cursor-pointer rounded-lg border bg-(--bg-primary) shadow-(--shadow-sm) transition-colors',
                isSelected
                    ? 'border-(--primary-color) ring-1 ring-(--primary-color)'
                    : 'border-(--border-primary) hover:border-(--border-hover)',
            )}
            onClick={itemSelected}
        >
            <div className="flex items-center gap-2 px-2.5 py-2" ref={dragProps.dragRef}>
                <span className="fa fa-grip-vertical cursor-move text-xs text-(--text-tertiary)" title="Drag to reorder" />
                <span className="fa fa-table-list text-xs text-(--text-secondary)" title="Row field" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--text-primary)">{item.displayText || item.name}</span>
                {!!item.filter?.trim() && <span className="fa fa-filter text-xs text-(--primary-color)" title="Filter applied" />}
                {item.sortOrder && (
                    <span
                        className={classNames('fa text-xs text-(--primary-color)', item.sortOrder === 'desc' ? 'fa-arrow-down-z-a' : 'fa-arrow-down-a-z')}
                        title={item.sortOrder === 'desc' ? 'Sorted in descending order' : 'Sorted in ascending order'}
                    />
                )}
                <span className="shrink-0 rounded-full bg-(--bg-tertiary) px-2 py-0.5 text-[11px] font-medium text-(--text-secondary)">
                    {getFieldSummary(item, depth)}
                </span>
                <button
                    type="button"
                    className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-(--text-tertiary) transition-colors hover:bg-(--bg-hover) hover:text-(--color-error)"
                    onClick={removeItem}
                    title="Remove field"
                    aria-label={`Remove ${item.name}`}
                >
                    <span className="fa fa-times text-xs" />
                </button>
            </div>
        </div>
    );
}
