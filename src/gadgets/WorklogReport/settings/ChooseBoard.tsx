import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { inject } from '@services';

import { Checkbox } from '@components';

import { useWorklogStore, useWorklogDispatch } from '../datastore';

interface ChooseBoardProps {
    onChange?: () => void;
}

function ChooseBoard({ onChange }: ChooseBoardProps) {
    const { sprintBoards, selSprints: savedSprints } = useWorklogStore();
    const dispatch = useWorklogDispatch();

    const [isOpen, setIsOpen] = useState(false);
    const [selSprints, setSprints] = useState(savedSprints);
    const [alignRight, setAlignRight] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const renderRef = useRef(true);

    useEffect(() => {
        setSprints(savedSprints);
    }, [savedSprints]);

    useEffect(() => {
        if (renderRef.current) {
            renderRef.current = false;
            return;
        }
        onChange?.();
    }, [savedSprints]); // eslint-disable-line react-hooks/exhaustive-deps

    const commitAndClose = useCallback(() => {
        const cleaned = { ...selSprints };
        Object.keys(cleaned).forEach((k) => {
            const sprint = cleaned[k];
            if (sprint.range === -1 && !Object.keys(sprint.custom || {}).length) {
                delete cleaned[k];
            }
        });
        dispatch({ selSprints: cleaned });
        setIsOpen(false);
    }, [selSprints, dispatch]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                commitAndClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, commitAndClose]);

    useEffect(() => {
        if (!isOpen || !triggerRef.current) {
            return;
        }
        const updateAlignment = () => {
            const trigger = triggerRef.current;
            const panel = panelRef.current;
            if (!trigger) {
                return;
            }
            const triggerRect = trigger.getBoundingClientRect();
            const panelWidth = panel?.offsetWidth ?? 320;
            const viewportWidth = window.innerWidth;
            const overflowsRight = triggerRect.left + panelWidth > viewportWidth - 8;
            const fitsLeftAligned = triggerRect.right - panelWidth >= 8;
            setAlignRight(overflowsRight && fitsLeftAligned);
        };
        updateAlignment();
        window.addEventListener('resize', updateAlignment);
        return () => window.removeEventListener('resize', updateAlignment);
    }, [isOpen]);

    const boardSelected = useCallback((selected: boolean, id: string, name: string) => {
        setSprints((prev: any) => ({
            ...prev,
            [id]: { range: 0, custom: [], ...prev[id], selected, name },
        }));
    }, []);

    const hasBoards = !!sprintBoards?.length;

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer whitespace-nowrap"
            >
                Choose sprint
            </button>

            {isOpen && (
                <div
                    ref={panelRef}
                    className={`absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl min-w-80 max-w-[90vw] ${alignRight ? 'right-0' : 'left-0'}`}
                >
                    {!hasBoards && (
                        <div className="p-5 text-sm text-secondary">
                            <i className="fa fa-exclamation-triangle text-amber-500 mr-2" />
                            No agile boards selected. Click <i className="fa fa-cogs" /> icon to choose one or more agile boards.
                        </div>
                    )}
                    {hasBoards && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        {sprintBoards.map((g: any) => (
                                            <th key={g.id} className="p-3 text-left">
                                                <Checkbox
                                                    label={g.name}
                                                    checked={selSprints[g.id]?.selected}
                                                    onChange={(e) => boardSelected(e.value, g.id, g.name)}
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {sprintBoards.map((g: any) => (
                                            <td
                                                key={g.id}
                                                className="p-3 align-top border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                                            >
                                                <ChooseSprintRange
                                                    board={g}
                                                    selSprints={selSprints}
                                                    setSprints={setSprints}
                                                    disabled={!selSprints[g.id]?.selected}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex justify-end p-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={commitAndClose}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(ChooseBoard);

const sprintRangeOptions = [
    { value: 0, label: 'Last sprint' },
    { value: 1, label: 'Last closed sprint' },
    { value: 2, label: 'Last 2 sprints' },
    { value: 3, label: 'Last 3 sprints' },
    { value: 4, label: 'Last 4 sprints' },
    { value: 5, label: 'Last 5 sprints' },
    { value: -1, label: 'Custom' },
];

function ChooseSprintRange({ board, selSprints, setSprints, disabled }: any) {
    const [custom, setCustom] = useState(selSprints[board.id]?.range === -1);

    const setRange = (range: number) => {
        if (range < 0) {
            setCustom(true);
        }
        updateSelSprints(null, null, range);
    };

    const updateSelSprints = (selected: boolean | null, sprintId: string | null, range: number) => {
        const selBoard = { ...selSprints[board.id], range };

        if (sprintId) {
            selBoard.custom = { ...selBoard.custom, [sprintId]: selected };
            if (!selected) {
                delete selBoard.custom[sprintId];
            }
        }

        setSprints((prev: any) => ({ ...prev, [board.id]: selBoard }));
    };

    if (!custom) {
        return (
            <div className="space-y-1">
                {sprintRangeOptions.map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 text-sm cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
                        <input
                            type="radio"
                            name={`range_${board.id}`}
                            checked={selSprints[board.id]?.range === opt.value}
                            onChange={() => setRange(opt.value)}
                            disabled={disabled}
                            className="accent-blue-600"
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <CustomSprintList
                boardId={board.id}
                selSprints={selSprints}
                onChange={(selected: boolean, sprintId: string) => updateSelSprints(selected, sprintId, -1)}
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => setCustom(false)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 cursor-pointer"
            >
                &larr; Back
            </button>
        </div>
    );
}

function CustomSprintList({ boardId, selSprints, onChange, disabled }: any) {
    const [isLoading, setLoading] = useState(false);
    const [sprints, setSprints] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const { $jira } = inject('JiraService');
                const data = await $jira.getRapidSprintList([boardId]);
                const sprintArr = Array.isArray(data) ? data : Object.values(data).flat();
                setSprints(sprintArr as any[]);
            } catch (err) {
                console.error('Error pulling sprints for board:', boardId, err);
            } finally {
                setLoading(false);
            }
        })();
    }, [boardId]);

    const customSprints = selSprints[boardId]?.custom || {};

    return (
        <div className="max-h-48 overflow-y-auto space-y-1">
            {isLoading && <span className="text-sm text-secondary">Loading...</span>}
            {sprints.map((s: any) => (
                <Checkbox
                    key={s.id}
                    label={s.name}
                    checked={!!customSprints[s.id]}
                    onChange={(e) => onChange(e.value, s.id)}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}
