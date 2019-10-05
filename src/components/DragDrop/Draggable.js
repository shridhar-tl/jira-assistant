/* eslint-disable */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';
import classNames from "classnames";

class Draggable extends PureComponent {
    render() {
        const { isDragging, connectDragSource, children, className } = this.props;
        const customClassName = classNames(className, { dragging: isDragging });

        if (typeof children === "function") {
            return children(connectDragSource, isDragging);
        } else {
            return (
                <div ref={connectDragSource} className={customClassName}>
                    {children}
                </div>
            );
        }
    }
}

Draggable.propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired
};

const dragSource = {
    beginDrag(props, monitor, component) {
        const { index, item, itemType } = props;
        return { index, item, itemType };
    }/*,
    endDrag(props, monitor, component) {
        //console.log("Draggable:dragSource:endDrag ", props, monitor, component);
        if (!monitor.didDrop()) {
            // You can check whether the drop was successful
            // or if the drag ended but nobody handled the drop
            return;
        }

        // When dropped on a compatible target, do something.
        // Read the original dragged item from getItem():
        const item = monitor.getItem();

        // You may also read the drop result from the drop target
        // that handled the drop, if it returned an object from
        // its drop() method.
        const dropResult = monitor.getDropResult();
    }*/
};

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    };
}

export default DragSource((prop) => prop.itemType, dragSource, collect)(Draggable);

