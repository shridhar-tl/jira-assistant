import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Draggable from './Draggable';
import Droppable from './Droppable';

class Sortable extends PureComponent {

    onDrop = (source, target) => {
        const { items, onChange } = this.props;

        const newArr = [...items];

        const [sourceItem] = newArr.splice(source.index, 1);
        newArr.splice(target.index, 0, sourceItem);

        onChange(newArr);
    }

    render() {
        const { props: { itemType, accepts = itemType, items, children, keyName } } = this;

        return (
            <div>
                {items.map((c, i) => <Droppable key={keyName ? c[keyName] : i} accepts={accepts} index={i} onDrop={this.onDrop}>
                    {(dropConnector, isOver, canDrop) => <Draggable itemType={itemType} item={c} index={i}>
                        {children(c, i, { dropConnector, isOver, canDrop })}
                    </Draggable>}
                </Droppable>)}
            </div>
        );
    }
}

Sortable.propTypes = {
    items: PropTypes.array.isRequired,
    children: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
};

export default Sortable;