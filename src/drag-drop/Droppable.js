import { PureComponent } from 'react';
import { DropTarget } from "react-dnd";

class Droppable extends PureComponent {
    render() {
        const { children, dropConnector } = this.props;

        if (typeof children === 'function') {
            return children({ dropConnector });
        }
        else {
            return dropConnector(children);
        }
    }
}

const dropTarget = {
    canDrop(props, monitor, component) {
        if (monitor.didDrop()) {
            return;
        } // This line is to handle drop event of nested components

        return true;
    },
    drop(props, monitor, component) {
        if (monitor.didDrop()) {
            return;
        } // This line is to handle drop event of nested components

        const source = monitor.getItem();
        const { index: sourceIndex, item, onRemove } = source;

        if (onRemove) {
            onRemove(item, sourceIndex, props);
        }

        const { onDrop } = props;

        if (onDrop) {
            onDrop(item, source, props);
        }
    }
};

function collect(connect, monitor) {
    return {
        dropConnector: connect.dropTarget(),
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
        monitor
    };
}

export default DropTarget(prop => prop.accepts, dropTarget, collect)(Droppable);