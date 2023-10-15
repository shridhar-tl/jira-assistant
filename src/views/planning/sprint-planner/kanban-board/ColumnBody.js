import React from 'react';
import { Sortable } from 'react-controls/controls/drag-drop';

export function ColumnBody({ column, filterItems, scope, onChange, onDrop, placeholder, template: CardTemplate }) {
    const [items, setItems] = React.useState();

    const ref = React.useRef({});
    ref.current.updateItems = async () => {
        const filteredItems = await filterItems(column);
        setItems(filteredItems || []);
    };

    React.useEffect(() => { ref.current.updateItems(); }, [column]);

    const handleChange = React.useCallback((items, sprint, result) => {
        onChange(items, sprint, result);
        setItems(items);
    }, [onChange]);

    return (<td className="column-td">
        <div className="column-body">
            {!items && <span>Loading...</span>}
            {items && !items.length && <span className="p-2">No issues available</span>}
            {items && <Sortable items={items}
                args={column}
                accept="card-item"
                defaultItemType="card-item"
                placeholder={placeholder}
                onChange={handleChange}
                onDrop={onDrop}
            >
                {(item, i) => (<CardTemplate key={i} item={item} scope={scope} />)}
            </Sortable>}
        </div>
    </td>);
}

export function CollapsedBody({ column, headerTextField, setCollapse, keyField }) {
    const toggle = React.useCallback(() => {
        setCollapse(keyField);
    }, [keyField, setCollapse]);

    return (<td className="column-td-collapsed pointer" onClick={toggle}>
        <div className="column-body">
            <strong className="vertical-text">{column[headerTextField]}</strong>
        </div>
    </td>);
}
