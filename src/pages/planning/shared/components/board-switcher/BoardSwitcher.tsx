import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import classNames from 'classnames';

import { Button, OverlayPanel, TextInput } from '@components';

import { getAllBoards } from '../../jira-api';
import type { PlannerBoard } from '../../types';
import BoardOption from './BoardOption';
import { buildSections, getBoardIcon, getBoardSubtitle, maxListedBoards } from './board-switcher-utils';

interface BoardSwitcherProps {
    board: PlannerBoard | null;
    boardId: number | null;
    recentIds: number[];
    onChange: (board: PlannerBoard) => void;
    className?: string;
}

const listId = 'board-switcher-list';

export default function BoardSwitcher({ board, boardId, recentIds, onChange, className }: BoardSwitcherProps) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [boards, setBoards] = useState<PlannerBoard[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const loadBoards = useCallback(async (force: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            setBoards(await getAllBoards(force));
        } catch (err) {
            setError((err as Error)?.message || 'Unable to load the boards');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const { sections, total } = useMemo(() => buildSections(boards || [], recentIds, query), [boards, recentIds, query]);
    const options = useMemo(() => sections.flatMap((s) => s.boards), [sections]);

    useEffect(() => {
        const selectedIndex = query ? -1 : options.findIndex((b) => b.id === boardId);
        setActiveIndex(Math.max(0, selectedIndex));
    }, [options, query, boardId]);

    useEffect(() => {
        listRef.current?.querySelector(`[data-option-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const open = () => {
        setQuery('');
        setIsOpen(true);
        if (!boards && !isLoading) {
            loadBoards(false);
        }
    };

    const close = useCallback(() => setIsOpen(false), []);

    const select = useCallback(
        (next: PlannerBoard) => {
            setIsOpen(false);
            if (next.id !== boardId) {
                onChange(next);
            }
        },
        [boardId, onChange],
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!options.length) {
            return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const step = e.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex((i) => (i + step + options.length) % options.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            select(options[activeIndex] || options[0]);
        }
    };

    const isPending = !!boardId && !board;
    const title = board?.name || (isPending ? 'Loading board…' : 'Choose a board');
    const subtitle = board ? getBoardSubtitle(board) : isPending ? `Board ${boardId}` : 'Each board is one team';
    let optionIndex = -1;

    const footer = (
        <div className="flex items-center gap-2 text-[11px] text-(--text-tertiary)">
            <span className="me-auto truncate">
                {total > maxListedBoards ? `Showing ${maxListedBoards} of ${total}. Type to narrow the list.` : '↑ ↓ to move, Enter to open'}
            </span>
            <Button
                size="xs"
                layout="plain"
                leftIcon={<i className={classNames('fa fa-refresh', { 'fa-spin': isLoading })} />}
                title="Reload the board list from Jira"
                ariaLabel="Reload boards"
                disabled={isLoading}
                onClick={() => loadBoards(true)}
            />
        </div>
    );

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className={classNames(
                    'group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg py-1 ps-1 pe-2 text-left transition-colors hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-(--border-focus)',
                    { 'bg-(--bg-hover)': isOpen },
                    className,
                )}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                title={board ? `Switch board (current: ${board.name})` : 'Choose a board'}
                onClick={() => (isOpen ? close() : open())}
            >
                <span
                    className={classNames('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base', {
                        'bg-(--primary-light) text-(--primary-color)': board || isPending,
                        'border border-dashed border-(--border-secondary) text-(--text-tertiary)': !board && !isPending,
                    })}
                >
                    <i className={classNames(getBoardIcon(board), { 'animate-pulse': isPending })} />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                    <span className={classNames('truncate text-[15px] font-semibold', board ? 'text-(--text-primary)' : 'text-(--text-secondary)')}>{title}</span>
                    <span className="truncate text-[11px] text-(--text-secondary)">{subtitle}</span>
                </span>
                <span className="ms-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-(--text-tertiary) transition-colors group-hover:bg-(--bg-active) group-hover:text-(--text-secondary)">
                    <i className={classNames('fa text-[10px]', isOpen ? 'fa-chevron-up' : 'fa-chevron-down')} />
                </span>
            </button>
            <OverlayPanel
                isOpen={isOpen}
                target={triggerRef.current}
                onClose={close}
                placement="bottomLeft"
                width="min(26rem, 94vw)"
                maxHeight="min(26rem, 65vh)"
                showCloseButton={false}
                ariaLabel="Switch board"
                footer={footer}
            >
                <div className="flex flex-col gap-2">
                    <div className="sticky top-0 z-10 bg-(--eui-bg) pb-1">
                        <TextInput
                            value={query}
                            onChange={(e) => setQuery(e.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search boards by name or project key"
                            leftIcon={<i className="fa fa-search" />}
                            clearable
                            autoFocus
                            role="combobox"
                            aria-expanded
                            aria-controls={listId}
                            aria-activedescendant={options[activeIndex] ? `board-option-${options[activeIndex].id}` : undefined}
                        />
                    </div>
                    <div ref={listRef} id={listId} role="listbox" aria-label="Boards" className="flex flex-col gap-2">
                        {isLoading && !boards && (
                            <div className="flex items-center gap-2 px-2 py-4 text-sm text-(--text-secondary)">
                                <i className="fa fa-spinner fa-spin" /> Loading boards…
                            </div>
                        )}
                        {error && <div className="px-2 py-3 text-sm text-(--color-error)">{error}</div>}
                        {boards && !sections.length && (
                            <div className="px-2 py-4 text-center text-sm text-(--text-secondary)">{query ? `No boards match "${query}"` : 'No boards found in Jira'}</div>
                        )}
                        {sections.map((section) => (
                            <div key={section.title} role="group" aria-label={section.title} className="flex flex-col">
                                <span className="px-2 pb-1 text-[10px] font-semibold tracking-wide text-(--text-tertiary) uppercase">{section.title}</span>
                                {section.boards.map((b) => {
                                    optionIndex += 1;
                                    return (
                                        <BoardOption
                                            key={`${section.title}-${b.id}`}
                                            board={b}
                                            index={optionIndex}
                                            isActive={optionIndex === activeIndex}
                                            isSelected={b.id === boardId}
                                            onSelect={select}
                                            onHover={setActiveIndex}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </OverlayPanel>
        </>
    );
}
