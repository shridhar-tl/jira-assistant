import { memo } from 'react';

import classNames from 'classnames';

import type { PlannerBoard } from '../../types';

import { getBoardIcon, getBoardSubtitle } from './board-switcher-utils';

interface BoardOptionProps {
    board: PlannerBoard;
    index: number;
    isActive: boolean;
    isSelected: boolean;
    onSelect: (board: PlannerBoard) => void;
    onHover: (index: number) => void;
}

function BoardOption({ board, index, isActive, isSelected, onSelect, onHover }: BoardOptionProps) {
    return (
        <button
            type="button"
            role="option"
            id={`board-option-${board.id}`}
            aria-selected={isSelected}
            data-option-index={index}
            className={classNames('flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors', {
                'bg-(--bg-hover)': isActive,
            })}
            onClick={() => onSelect(board)}
            onMouseMove={() => !isActive && onHover(index)}
        >
            <span
                className={classNames('flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm', {
                    'bg-(--primary-color) text-(--text-inverse)': isSelected,
                    'bg-(--bg-tertiary) text-(--text-secondary)': !isSelected,
                })}
            >
                <i className={getBoardIcon(board)} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className={classNames('truncate text-sm', { 'font-semibold': isSelected })}>{board.name}</span>
                <span className="truncate text-[11px] text-(--text-secondary)">{getBoardSubtitle(board)}</span>
            </span>
            {isSelected && <i className="fa fa-check shrink-0 text-xs text-(--primary-color)" />}
        </button>
    );
}

export default memo(BoardOption);
