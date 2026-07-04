import React, { useCallback, useContext, useRef, useState } from 'react';

import classNames from 'classnames';

import { stop } from '@/utils';

import { GridContext } from './GridContext';
import { GridCellProps } from './types';
import { formatDataForDisplay } from './utils';

interface GridCellBaseProps extends GridCellProps {
    cellType?: 'cell' | 'header' | 'footer';
    elementType?: 'td' | 'th';
    customDisplayControl?: (modProps?: any) => React.ReactNode;
}

function GridCellBase({
    column,
    data,
    index,
    rowIndex,
    className,
    domProps,
    isLastCell,
    cellType = 'cell',
    elementType = 'td',
    customDisplayControl,
}: GridCellBaseProps) {
    const [editing, setEditing] = useState(false);
    const [newValue, setNewValue] = useState<any>('');
    const context = useContext(GridContext);
    const tdRef = useRef<HTMLTableCellElement>(null);

    const editable = useCallback(() => column.editable !== false && (column as any)[`${cellType}Editable`] !== false, [column, cellType]);

    const setFocus = useCallback((ref: HTMLInputElement | null) => ref?.focus(), []);

    const endEdit = useCallback(() => {
        context.endEdit(newValue, rowIndex, index);
        setEditing(false);
        setNewValue('');
    }, [context, newValue, rowIndex, index]);

    const cancelEdit = useCallback(() => {
        context.endEdit(null, -2, -2);
        setEditing(false);
        setNewValue('');
    }, [context]);

    const setNewValueHandler = useCallback(
        (value: any) => {
            context.endEdit(value, rowIndex, index);
            setEditing(false);
            setNewValue('');
        },
        [context, rowIndex, index],
    );

    const beingEdit = useCallback(() => {
        if (!editable()) {
            return;
        }
        setEditing(true);
        setNewValue(data?.[column.field] || '');
        context.beginEdit(rowIndex, index);
    }, [editable, data, column.field, context, rowIndex, index]);

    const getDisplayControl = useCallback(
        (modProps?: any): React.ReactNode => {
            if (customDisplayControl) {
                return customDisplayControl(modProps);
            }

            const template = (column as any)[`${cellType}Template`];

            if (template) {
                return template(column, data, index, rowIndex, modProps);
            }

            return formatDataForDisplay(data?.[column.field]);
        },
        [customDisplayControl, column, cellType, data, index, rowIndex],
    );

    const getEditor = useCallback((): React.ReactNode => {
        let template = (column as any)[`${cellType}EditorTemplate`];
        if (template) {
            template = template(data, column, rowIndex, index, setNewValueHandler, cancelEdit);
        }

        if (template !== undefined) {
            return template;
        }

        return (
            <input
                ref={setFocus}
                type="text"
                className="string-editor"
                value={newValue}
                onBlur={endEdit}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                    const { which, keyCode = which } = e;
                    if (keyCode === 13) {
                        endEdit();
                    } else if (keyCode === 27) {
                        cancelEdit();
                    }
                }}
            />
        );
    }, [column, cellType, data, rowIndex, index, setNewValueHandler, cancelEdit, setFocus, newValue, endEdit]);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => editable() && context.beginSelect(rowIndex, index),
        [editable, context, rowIndex, index],
    );

    const onMouseUp = useCallback((e: React.MouseEvent) => context.endSelect(rowIndex, index), [context, rowIndex, index]);

    const onMouseOver = useCallback((e: React.MouseEvent) => context.onSelecting(rowIndex, index), [context, rowIndex, index]);

    const onRepeaterDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            stop(e);
            context.repeatSelectedCells();
        },
        [context],
    );

    const resizePrevious = useCallback(
        (e: React.MouseEvent) => {
            stop(e);
            context.beginResize(index - 1, e);
        },
        [context, index],
    );

    const resize = useCallback(
        (e: React.MouseEvent) => {
            stop(e);
            context.beginResize(index, e);
        },
        [context, index],
    );

    const Type = elementType;
    const modProps: { className?: string } = { className };
    const displayText = !editing && getDisplayControl(modProps);

    return (
        <Type
            ref={tdRef}
            className={modProps.className}
            {...domProps}
            onDoubleClick={beingEdit}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseOver={onMouseOver}
        >
            {!editing && index > 0 && cellType === 'header' && <div className="h-resizer-l" onMouseDown={resizePrevious} />}
            {!editing && isLastCell && cellType === 'cell' && editable() && (
                <div
                    className={classNames('cell-repeater', !!displayText && 'with-data')}
                    onDoubleClick={onRepeaterDoubleClick}
                    onMouseDown={stop}
                    onMouseUp={stop}
                >
                    &nbsp;
                </div>
            )}
            {editing ? getEditor() : displayText}
            {!editing && cellType === 'header' && <div className="h-resizer-r" onMouseDown={resize} />}
        </Type>
    );
}

export default GridCellBase;
