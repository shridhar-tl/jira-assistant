/* eslint-disable */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from "react-dnd";

class Droppable extends PureComponent {
    render() {
        const { isOver, canDrop, connectDropTarget, children } = this.props;
        const isActive = isOver && canDrop;

        if (typeof children === "function") {
            return children(connectDropTarget, isOver, canDrop, isActive);
        }
        else {
            return connectDropTarget(children);
        }
    }
}

Droppable.propTypes = {
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired
};

const dropTarget = {
    canDrop(props, monitor, component) {
        if (monitor.didDrop()) {
            return;
        } // This line is to handle drop event of nested components

        const { accepts } = props;
        if (!accepts) { return true; }

        const { itemType } = monitor.getItem();

        if (Array.isArray(accepts)) {
            return !!~accepts.indexOf(itemType)
        }
        else {
            return accepts === itemType;
        }
    },
    /*hover(props, monitor, component) {
        console.log("Droppable:dropTarget:hover ", props, monitor, component);
    },*/
    drop(props, monitor, component) {
        if (monitor.didDrop()) {
            return;
        } // This line is to handle drop event of nested components

        const item = monitor.getItem();

        const { props: { index, onDrop, accepts } } = component;
        if (onDrop && typeof onDrop === "function") {
            onDrop(item, { index, accepts });
        }
    }
};

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    };
}

export default DropTarget(prop => prop.accepts, dropTarget, collect)(Droppable);