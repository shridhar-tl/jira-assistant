import React from 'react';
import { removeField } from '../../../store/field-actions';
import { useSelectedItemConfig } from '../../../store/pivot-config';
import { stop } from 'src/common/utils';
import './RowItem.scss';

function RowConfigItem({ item, index, depth, dragProps }) {
    const removeItem = React.useCallback((e) => {
        stop(e);
        removeField(index);
    }, [index]);

    const { itemPath, selectItem } = useSelectedItemConfig();

    const itemSelected = React.useCallback(() => selectItem(`fields.${index}`, depth), [index, depth, selectItem]);

    return (<div className={`row-item${itemPath ? ' selected' : ''}`} onClick={itemSelected}>
        <div className="row-config-head" ref={dragProps.dragRef}>
            <span className="icon-remove float-end fa fa-times" onClick={removeItem} />
            <span className="icon fa-solid fa-up-down-left-right" />
            {item.displayText || item.name}
        </div>
    </div>);
}

export default RowConfigItem;
