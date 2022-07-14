import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { GridContext } from './GridContext';
import { formatDataForDisplay, stop } from './utils';

class GridCellBase extends PureComponent {
    static contextType = GridContext;
    cellType = 'cell';
    elementType = 'td';
    state = {};

    editable = () => this.props.column.editable !== false && this.props.column[`${this.cellType}Editable`] !== false;

    beingEdit = () => {
        if (!this.editable()) { return; }
        const { column, data } = this.props;

        this.setState({ editing: true, newValue: data?.[column.field] || '' });
        this.context.beginEdit(this.props.rowIndex, this.props.index);
    };

    endEdit = () => this.setNewValue(this.state.newValue);
    cancelEdit = () => {
        this.context.endEdit(null, -2);
        this.setState({ editing: false, newValue: '' });
    };

    setNewValue = (value) => {
        this.context.endEdit(value, this.props.rowIndex, this.props.index);
        this.setState({ editing: false, newValue: '' });
    };

    getDisplayControl = (modProps) => {
        const { column, data, index, rowIndex } = this.props;
        const template = column[`${this.cellType}Template`];

        if (template) {
            return template(column, data, index, rowIndex, modProps);
        }

        return formatDataForDisplay(data[column.field]);
    };

    setFocus = (ref) => ref?.focus();
    getEditor = () => {
        const { column, data, index, rowIndex } = this.props;
        let template = column[`${this.cellType}EditorTemplate`];
        if (template) {
            template = template(data, column, rowIndex, index, this.setNewValue, this.cancelEdit);
        }

        if (template !== undefined) { return template; }

        return <input ref={this.setFocus} type="text" className="string-editor" value={this.state.newValue}
            onBlur={this.endEdit} onChange={this.valueChanged} onKeyDown={this.editorKeyDown} />;
    };

    editorKeyDown = (e) => {
        const { which, keyCode = which } = e; // ToDo: need to consider line break scenario

        if (keyCode === 13) {
            this.endEdit(e);
        } else if (keyCode === 27) {
            this.cancelEdit();
        }
    };

    valueChanged = (e) => this.setState({ newValue: e.target.value });

    onMouseDown = (e) => this.editable() && this.context.beginSelect(this.props.rowIndex, this.props.index);
    onMouseUp = (e) => this.context.endSelect(this.props.rowIndex, this.props.index);
    onMouseOver = (e) => this.context.onSelecting(this.props.rowIndex, this.props.index);

    onRepeaterDoubleClick = (e) => {
        stop(e);
        this.context.repeatSelectedCells();
    };

    resizePrevious = (e) => {
        stop(e);
        this.context.beginResize(this.props.index - 1, e);
    };

    resize = (e) => {
        stop(e);
        this.context.beginResize(this.props.index, e);
    };

    setTDRef = (td) => this.td = td;

    render() {
        const Type = this.elementType;
        const { className, domProps, isLastCell, index } = this.props;
        const { editing } = this.state;
        const modProps = { className };
        const displayText = !editing && this.getDisplayControl(modProps);

        return (
            <Type ref={this.setTDRef} className={modProps.className}  {...domProps} onDoubleClick={this.beingEdit}
                onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseOver={this.onMouseOver}>
                {!editing && index > 0 && this.cellType === 'header' && <div className="h-resizer-l" onMouseDown={this.resizePrevious} />}
                {!editing && isLastCell && this.cellType === 'cell' && this.editable() && <div
                    className={classNames("cell-repeater", !!displayText && "with-data")}
                    onDoubleClick={this.onRepeaterDoubleClick}
                    onMouseDown={stop} onMouseUp={stop}
                >&nbsp;</div>}
                {editing ? this.getEditor() : displayText}
                {!editing && this.cellType === 'header' && <div className="h-resizer-r" onMouseDown={this.resize} />}
            </Type>
        );
    }
}

export default GridCellBase;
