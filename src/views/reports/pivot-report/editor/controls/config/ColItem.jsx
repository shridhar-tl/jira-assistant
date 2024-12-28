import React from 'react';
import useToggler from 'react-controls/hooks/useToggler';
import { getGroupItem, useSelectedItemConfig } from '../../../store/pivot-config';
import { removeField, updateField } from '../../../store/field-actions';
import { Sortable } from 'src/controls';
import classNames from 'classnames';
import { stop } from 'src/common/utils';
import './ColItem.scss';

const accept = ['jira-field'];
const emptyArray = [];

function cloneItem(item) {
    return { ...item, subItems: [...(item.subItems || [])] };
}

function ColItem({ path, item, depth, index, dragProps, removeItem, updateItem }) {
    const propRef = React.useRef();
    React.useEffect(() => {
        propRef.current = { index, item, updateItem };
    }, [index, item, updateItem]);

    const [isOpen, toggleOpen] = useToggler(true);

    const addChild = React.useCallback(({ itemType, item: child }, { index: childIndex }) => {
        if (itemType === 'jira-field') {
            child = getGroupItem(child);
        }

        const { item, index, updateItem } = propRef.current;

        const newItem = cloneItem(item);
        newItem.subItems.splice(childIndex, 0, child);

        updateItem(newItem, index);
    }, []);

    const removeChild = React.useCallback(childIndex => {
        const { item, index, updateItem } = propRef.current;

        const newItem = cloneItem(item);
        newItem.subItems.splice(childIndex, 1);

        updateItem(newItem, index);
    }, []);

    const handleRemoveItem = React.useCallback(() => removeItem(propRef.current.index), [removeItem]);

    const updateChild = React.useCallback((child, childIndex) => {
        const { item, index, updateItem } = propRef.current;

        const newItem = cloneItem(item);
        newItem.subItems[childIndex] = child;

        updateItem(newItem, index);
    }, []);

    const onSort = React.useCallback(subItems => {
        const { item, index, updateItem } = propRef.current;

        updateItem({ ...item, subItems }, index);
    }, []);

    const { itemPath, selectItem } = useSelectedItemConfig();

    const itemSelected = React.useCallback(e => {
        stop(e);
        selectItem(path, depth);
    }, [path, depth, selectItem]);

    const isGrouped = depth === 0 || item.enableGrouping;
    const iconClassName = classNames('icon-col fa', {
        'pointer': isGrouped,
        'fa-angle-down': isGrouped && isOpen,
        'fa-angle-right': isGrouped && !isOpen,
        'fa-arrow-right': !isGrouped
    });

    return (<div className={`col-item${itemPath === path ? ' selected' : ''}`} onClick={itemSelected}>
        <div className="col-config-head" ref={dragProps.dragRef}>
            <span className="icon-remove float-end fa fa-times" onClick={handleRemoveItem} />
            {isGrouped && <span className="icon-pivot float-end fa-solid fa-table-columns me-2" title="This field would be pivoted as column" />}
            <span className={iconClassName} onClick={toggleOpen} />
            {item.displayText || item.name}
        </div>
        {isOpen && isGrouped && <Sortable addPlaceholder={true} className="sub-items"
            useDragRef
            items={item.subItems || emptyArray} accept={accept}
            defaultItemType="col-sub-group"
            onDrop={addChild} onChange={onSort}
            placeholder={`Drag and drop sub group or value field for ${item.name}`}>
            {(child, childIndex, { draggable }) => <ColItem
                path={`${path}.subItems.${childIndex}`}
                key={childIndex}
                index={childIndex}
                depth={depth + 1}
                item={child}
                dragProps={draggable}
                removeItem={removeChild}
                updateItem={updateChild}
            />}
        </Sortable>}
    </div>);
}

function ColConfigItem({ ...props }) {
    return (<ColItem {...props} removeItem={removeField} updateItem={updateField} />);
}

export default ColConfigItem;
