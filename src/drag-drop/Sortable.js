import React, { PureComponent } from 'react';
import { bool, array, func, string, arrayOf, element } from 'prop-types';
import Draggable from './Draggable';
import Droppable from './Droppable';

let globalContainerId = 0;

class Sortable extends PureComponent {
    constructor(props) {
        super(props);
        this.containerId = ++globalContainerId;
    }

    render() {
        const { items,
            itemTemplate,
            itemType,
            itemTypePropName,
            accepts = [itemType],
        } = this.props;

        let {
            placeholder,
            itemPlaceholder
        } = this.props;

        if (itemPlaceholder) {
            itemPlaceholder = (<Droppable
                key="addItemPlaceholder"
                containerId={this.containerId}
                index={items.length}
                accepts={accepts}
                onDrop={this.handleDrop}
            >{itemPlaceholder}</Droppable>);
        }

        if (!items.length) {
            placeholder = placeholder && (<Droppable
                key="emptyItemPlaceholder"
                containerId={this.containerId}
                index={items.length}
                accepts={accepts}
                onDrop={this.handleDrop}
            >{placeholder}</Droppable>);

            return placeholder || itemPlaceholder || null;
        }

        const result = items.map((item, i) => (
            <Droppable
                key={i}
                containerId={this.containerId}
                index={i}
                accepts={accepts}
                onDrop={this.handleDrop}
            >
                {(dropRef) =>
                    <Draggable
                        index={i}
                        containerId={this.containerId}
                        itemType={item[itemTypePropName] || itemType}
                        item={item}
                        onRemove={this.handleRemove}
                    >
                        {(item, dragRef) => itemTemplate(item, i, dragRef, dropRef)}
                    </Draggable>}
            </Droppable>
        )
        );

        if (itemPlaceholder) {
            return [result, itemPlaceholder];
        }
        else {
            return result;
        }
    }

    handleRemove = (item, sourceIndex, target) => {
        if (target.containerId === this.containerId) {
            return;
        }

        const { items, onChange } = this.props;

        const newArr = [...items];
        newArr.splice(sourceIndex, 1);

        onChange(newArr);
    };

    handleDrop = (item, source, target) => {
        const { items, onChange } = this.props;
        const newArr = [...items];

        const isSameArray = source.containerId === this.containerId;
        const targetIndex = target.index;

        let removedItem = item;
        if (isSameArray) {
            [removedItem] = newArr.splice(source.index, 1);
        }

        if (targetIndex >= newArr.length) {
            newArr.push(removedItem);
        }
        else {
            newArr.splice(targetIndex, 0, removedItem);
        }

        onChange(newArr);
    };
}

Sortable.propTypes = {
    items: array.isRequired,
    removable: bool,
    onChange: func.isRequired,
    itemTemplate: func.isRequired,
    itemType: string,
    itemTypePropName: string,
    accepts: arrayOf(string),
    placeholder: element,
    itemPlaceholder: element
};

export default Sortable;