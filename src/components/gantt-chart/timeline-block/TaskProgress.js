/* eslint-disable no-unused-vars */
import React from 'react';
import './TaskProgress.scss';
import { GanttContext } from '../store';
import { stop } from 'src/common/utils';

const widthOfDayInPx = 35;

function getLeftPosition(e, containerRef, start) {
    const containerRect = containerRef.current.getBoundingClientRect();
    const left = e.clientX - containerRect.left;

    const value = left / widthOfDayInPx;

    const cellValue = start < value ? Math.ceil(value) : Math.floor(value);

    return parseInt(cellValue);
}

function TaskProgress(props) {
    const rootProps = React.useContext(GanttContext);
    const rootPropsRef = React.useRef(rootProps);
    rootPropsRef.current = rootProps;

    const propsRef = React.useRef(props);
    propsRef.current = props;
    const containerRef = React.useRef(null);
    const [editedTask, setTask] = React.useState(null);
    const [startX, setStartX] = React.useState(null);
    const [endX, setEndX] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const { taskDetailTemplate, taskDetailTemplateArgs } = rootProps;
    const { allowAdd, taskDetails } = rootProps.getItemTaskDetails(props.item, props.columns) || {};

    const handleMouseDown = (e) => {
        if (e.button || isDragging) {
            return;
        }

        const cell = getLeftPosition(e, containerRef);
        setStartX(cell);
        setEndX(cell);
        setIsDragging(true);
    };

    const beginResize = (e) => {
        const el = e.currentTarget;
        const taskIndex = parseInt(el.attributes.getNamedItem('data-task-index').value);
        const task = taskDetails[taskIndex];
        const start = el.classList.contains('float-start');

        setTask({ task, index: taskIndex, start });

        setStartX(task.startCol);
        setEndX(task.startCol + task.noOfDays);

        setIsDragging(true);
    };

    const handleMouseUp = (e) => {
        if (!isDragging) {
            return;
        }

        const col = getLeftPosition(e, containerRef, editedTask?.start ? undefined : startX);

        const { item, columns } = propsRef.current;
        const { onAddTask, onTaskResized } = rootPropsRef.current;
        let start = startX, end = endX;

        if (editedTask) {
            if (editedTask.start) {
                start = col < (endX - 1) ? col : endX - 1;
                setStartX(start);
            } else {
                end = col < startX ? startX : col;
                setEndX(end);
            }

            onTaskResized(item, editedTask.index, columns[start], columns[end - 1]);
        } else {
            const startCol = Math.min(startX, col);
            const endCol = Math.max(startX, col);

            onAddTask(item, columns[startCol], columns[endCol - 1]);
        }

        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const col = getLeftPosition(e, containerRef, editedTask?.start ? undefined : startX);
            if (editedTask) {
                if (editedTask.start) {
                    setStartX(col < (endX - 1) ? col : endX - 1);
                } else {
                    setEndX(col < startX ? startX : col);
                }
            } else {
                setEndX(col);
            }
        }
    };

    const startCol = Math.min(startX, endX);
    const endCol = Math.max(startX, endX);

    return (<div ref={containerRef} className="progress-row"
        onMouseDown={allowAdd !== false ? handleMouseDown : undefined}
        onMouseUp={allowAdd !== false ? handleMouseUp : undefined}
        onMouseMove={isDragging ? handleMouseMove : undefined}>
        {taskDetails?.map((task, i) => {
            if (isDragging && editedTask?.index === i) {
                task = { ...task, startCol, noOfDays: endCol - startCol };
            }

            return (<TaskProgressBar key={i}
                index={i}
                task={task}
                startCol={task.startCol}
                noOfDays={task.noOfDays || 1}
                item={props.item}
                template={taskDetailTemplate}
                templateArgs={taskDetailTemplateArgs}
                beginResize={beginResize}
            />);
        })}
        &nbsp;
        {isDragging && !editedTask && <TaskProgressBar startCol={startCol} noOfDays={(endCol - startCol) || 1} />}
    </div>);
}

export default TaskProgress;

function TaskProgressBar({ startCol, noOfDays, template: Template, templateArgs, item, task, index, beginResize }) {
    return (<div className="task-progress"
        style={{
            left: `${(startCol * widthOfDayInPx) + 3}px`,
            width: `${(noOfDays * widthOfDayInPx) - 3}px`
        }} onMouseDown={stop}>
        <span className="fa-solid fa-ellipsis-vertical float-end" data-task-index={index} onMouseDown={beginResize} />
        {Template && <Template item={item} task={task} args={templateArgs} />}
        <span className="fa-solid fa-ellipsis-vertical float-start" data-task-index={index} onMouseDown={beginResize} />
    </div>);
}