import { PureComponent } from 'react';
import { DragSource } from 'react-dnd';

class Draggable extends PureComponent {
    render() {
        const {
            isDragging, dragHandle,
            children, item
        } = this.props;

        if (typeof children === 'function') {
            return children(item, { dragHandle, isDragging });
        }
        else {
            return dragHandle(children);
        }
    }
}

const source = {
    beginDrag(props) {
        return props;
    }
};

function collect(connect, monitor) {
    return {
        dragHandle: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging(),
        monitor
    };
}

export default DragSource(p => p.itemType, source, collect)(Draggable);